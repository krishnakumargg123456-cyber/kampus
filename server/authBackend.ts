import crypto from 'crypto';
import type { Express, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { query, isDatabaseConnected } from '../database/db.ts';
import { getRegisteredModule, ModuleStorage } from '../database/moduleStorage.ts';

const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required.'); })();
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';
const ACCOUNT_DB_PATH = path.join(process.cwd(), '.kampus_account_db.json');

const clerkClient = CLERK_SECRET_KEY ? createClerkClient({ secretKey: CLERK_SECRET_KEY }) : null;

interface StoredOtp {
  email: string;
  codeHash: string;
  purpose: 'login' | 'register' | 'forgot_password';
  attempts: number;
  expiresAt: number;
  lastSentAt: number;
}

// In-memory OTP storage with TTL and rate limiting
const otpStore = new Map<string, StoredOtp>();

// Rate limiter for OTP requests: max 3 requests per 10 minutes
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();

// SMTP Transporter configuration
function createEmailTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

const mailTransporter = createEmailTransporter();

async function sendEmailOtp(toEmail: string, otpCode: string, purpose: string): Promise<boolean> {
  const subject = `Your KAMPUS Verification Code: ${otpCode}`;
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="margin-bottom: 24px; text-align: center;">
        <h1 style="color: #0f172a; margin: 0; font-size: 26px; letter-spacing: -0.5px;">KAMPUS</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Your Student Life, Connected.</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #e2e8f0;">
        <p style="color: #475569; font-size: 15px; margin: 0 0 16px;">Use the following 6-digit one-time password to complete your <strong>${purpose}</strong>:</p>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; padding: 12px 0;">${otpCode}</div>
        <p style="color: #94a3b8; font-size: 13px; margin: 12px 0 0;">Valid for 10 minutes. Never share this code with anyone.</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">If you did not request this verification code, please ignore this email or contact security.</p>
    </div>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || '"KAMPUS Student App" <noreply@kampus.edu.in>',
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[KAMPUS SMTP] Verification email dispatched successfully to: ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`[KAMPUS SMTP Error]: Failed to dispatch via SMTP to ${toEmail}:`, err.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Email dispatch failed via SMTP gateway: ${err.message}`);
      }
    }
  }

  // Fallback logging for local testing & development without live SMTP gateway
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[KAMPUS DEV OTP] To: ${toEmail} | Purpose: ${purpose} | Code: [${otpCode}]`);
  }
  return true;
}

function hashString(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

const accountStorage = getRegisteredModule('account') || new ModuleStorage<any>(
  'account',
  ACCOUNT_DB_PATH,
  () => ({ profiles: {}, settings: {}, credentials: {} })
);

function getAccountDb(): any {
  return accountStorage.get();
}

function saveAccountDb(db: any): boolean {
  accountStorage.saveSync(db);
  return true;
}

export function registerAuthBackend(app: Express): void {
  /**
   * 1. Send OTP (Supports login, register, forgot_password)
   */
  app.post('/api/auth/send-otp', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, purpose = 'login' } = req.body;

      const allowedPurposes = ['login', 'register', 'forgot_password'];

      if (!allowedPurposes.includes(purpose)) {
        res.status(400).json({
          success: false,
          error: 'Invalid OTP purpose.',
        });
        return;
      }

      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        res.status(400).json({
          success: false,
          error: 'A valid email address is required.',
        });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const now = Date.now();

      // Check rate limits
      const rateData = rateLimitMap.get(normalizedEmail);
      if (rateData) {
        if (now - rateData.firstAttempt < 10 * 60 * 1000) {
          if (rateData.count >= 5) {
            res.status(429).json({ success: false, error: 'Too many OTP requests. Please wait 10 minutes.' });
            return;
          }
          rateData.count += 1;
        } else {
          rateLimitMap.set(normalizedEmail, { count: 1, firstAttempt: now });
        }
      } else {
        rateLimitMap.set(normalizedEmail, { count: 1, firstAttempt: now });
      }

      // Check cooldown (60 seconds) per email + purpose
      const otpKey = `${normalizedEmail}:${purpose}`;
      const existing = otpStore.get(otpKey);
      if (existing && now - existing.lastSentAt < 60 * 1000) {
        const remainingSec = Math.ceil((60 * 1000 - (now - existing.lastSentAt)) / 1000);
        res.status(429).json({
          success: false,
          error: `Please wait ${remainingSec} seconds before requesting a new code.`,
        });
        return;
      }

      // Generate 6-digit cryptographic OTP
      const otpCode = crypto.randomInt(100000, 1000000).toString();
      const codeHash = hashString(otpCode);
      const expiresAt = now + 10 * 60 * 1000; // 10 minutes

      otpStore.set(otpKey, {
        email: normalizedEmail,
        codeHash,
        purpose,
        attempts: 0,
        expiresAt,
        lastSentAt: now,
      });

      if (isDatabaseConnected()) {
        try {
          const expiresDate = new Date(expiresAt);
          await query(
            `INSERT INTO otp_tokens (email, identifier, code_hash, token_hash, purpose, expires_at, attempts)
             VALUES ($1, $1, $2, $2, $3, $4, 0)`,
            [normalizedEmail, codeHash, purpose, expiresDate.toISOString()]
          );
        } catch (dbErr: any) {
          console.warn('[OTP DB Save Notice]:', dbErr.message);
        }
      }

      await sendEmailOtp(normalizedEmail, otpCode, purpose.replace('_', ' '));

      res.json({
        success: true,
        message: `Verification code sent to ${normalizedEmail}`,
        expiresInSeconds: 600,
        cooldownSeconds: 60,
      });
    } catch (err: any) {
      console.error('[Auth send-otp Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to send verification code. Please retry.' });
    }
  });

  /**
   * 2. Verify OTP
   */
  app.post('/api/auth/verify-otp', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, code, purpose = 'login' } = req.body;
      if (!email || !code) {
        res.status(400).json({ success: false, error: 'Email and verification code are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      let isValidOtp = false;

      // Check PostgreSQL persistent OTP storage
      if (isDatabaseConnected()) {
        try {
          const otpRes = await query(
            `SELECT id, code_hash, token_hash, purpose, expires_at, attempts
             FROM otp_tokens
             WHERE (email = $1 OR identifier = $1) AND purpose = $2
             ORDER BY created_at DESC LIMIT 1`,
            [normalizedEmail, purpose]
          );
          if (otpRes.rows.length > 0) {
            const row = otpRes.rows[0];
            if (new Date() > new Date(row.expires_at)) {
              res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
              return;
            }
            if (row.attempts >= 5) {
              res.status(429).json({ success: false, error: 'Too many invalid attempts. Please request a new code.' });
              return;
            }
            const inputHash = hashString(code.trim());
            const storedHash = row.code_hash || row.token_hash;
            if (inputHash !== storedHash) {
              await query('UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = $1', [row.id]);
              const remaining = 5 - (row.attempts + 1);
              res.status(400).json({
                success: false,
                error: `Incorrect verification code. ${remaining} attempts remaining.`,
              });
              return;
            }
            isValidOtp = true;
            await query('DELETE FROM otp_tokens WHERE (email = $1 OR identifier = $1) AND purpose = $2', [normalizedEmail, purpose]);
          }
        } catch (dbErr: any) {
          console.warn('[OTP DB Verify Notice]:', dbErr.message);
        }
      }

      if (!isValidOtp) {
        const otpKey = `${normalizedEmail}:${purpose}`;
        const stored = otpStore.get(otpKey);
        if (!stored) {
          res.status(400).json({ success: false, error: 'No OTP requested for this email or it has expired.' });
          return;
        }

        if (stored.purpose !== purpose) {
          res.status(400).json({
            success: false,
            error: 'Verification code purpose mismatch.',
          });
          return;
        }

        if (Date.now() > stored.expiresAt) {
          otpStore.delete(otpKey);
          res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
          return;
        }

        if (stored.attempts >= 5) {
          otpStore.delete(otpKey);
          res.status(429).json({ success: false, error: 'Too many invalid attempts. Please request a new code.' });
          return;
        }

        const inputHash = hashString(code.trim());
        if (inputHash !== stored.codeHash) {
          stored.attempts += 1;
          const remaining = 5 - stored.attempts;
          res.status(400).json({
            success: false,
            error: `Incorrect verification code. ${remaining} attempts remaining.`,
          });
          return;
        }

        otpStore.delete(otpKey);
      }

      // Handle login flow
      if (purpose === 'login') {
        const db = getAccountDb();
        let userProfile = Object.values<any>(db.profiles || {}).find(
          (p) => p.email?.toLowerCase() === normalizedEmail
        );

        // Check PostgreSQL users table
        if (!userProfile && isDatabaseConnected()) {
          try {
            const pgU = await query(
              'SELECT id, email, name, mobile, college, course, branch, semester, enrollment_no, avatar_url, bio, is_verified FROM users WHERE email = $1',
              [normalizedEmail]
            );
            if (pgU.rows.length > 0) {
              const r = pgU.rows[0];
              userProfile = {
                userId: r.id,
                fullName: r.name,
                email: r.email,
                mobile: r.mobile || '',
                college: r.college || '',
                course: r.course || '',
                branch: r.branch || '',
                semester: r.semester || '',
                enrollmentNo: r.enrollment_no || '',
                avatarUrl: r.avatar_url || '',
                bio: r.bio || '',
                isVerified: r.is_verified,
                hasCompletedOnboarding: !!(r.college && r.course),
                createdAt: new Date().toISOString(),
              };
              if (!db.profiles) db.profiles = {};
              db.profiles[r.id] = userProfile;
              saveAccountDb(db);
            }
          } catch (dbErr: any) {
            console.warn('[OTP Login DB Profile Query Notice]:', dbErr.message);
          }
        }

        if (!userProfile) {
          // Provision verified user WITHOUT invented fake college or student information
          const userId = 'usr_' + Date.now().toString(36);
          userProfile = {
            userId,
            fullName: normalizedEmail.split('@')[0],
            email: normalizedEmail,
            mobile: '',
            college: '',
            course: '',
            branch: '',
            semester: '',
            enrollmentNo: '',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            verifiedBadge: true,
            hasCompletedOnboarding: false, // Prompt onboarding so student enters real university details
            createdAt: new Date().toISOString(),
          };
          if (!db.profiles) db.profiles = {};
          db.profiles[userId] = userProfile;
          saveAccountDb(db);

          if (isDatabaseConnected()) {
            try {
              await query(
                `INSERT INTO users (id, email, name, is_verified)
                 VALUES ($1, $2, $3, TRUE)
                 ON CONFLICT (email) DO NOTHING`,
                [userId, normalizedEmail, userProfile.fullName]
              );
            } catch (err: any) {
              console.warn('[OTP User Insert Notice]:', err.message);
            }
          }
        }

        // Record session in user_sessions
        if (isDatabaseConnected()) {
          try {
            const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
            const userAgent = (req.headers['user-agent'] as string) || 'KAMPUS Client';
            await query(
              `INSERT INTO user_sessions (id, user_id, device_info, ip_address, expires_at)
               VALUES ($1, $2, $3, $4, $5)`,
              [sessionId, userProfile.userId, userAgent, ip, expiresAt.toISOString()]
            );
          } catch (sessErr: any) {
            console.warn('[Session DB Notice]:', sessErr.message);
          }
        }

        const token = jwt.sign(
          { userId: userProfile.userId, email: userProfile.email, role: 'student' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        res.json({
          success: true,
          token,
          user: userProfile,
          message: 'Login successful',
        });
        return;
      }

      // For registration or forgot password, return a temporary verification token
      const verificationToken = jwt.sign(
        { email: normalizedEmail, purpose, verifiedAt: Date.now() },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({
        success: true,
        verificationToken,
        message: 'Verification code confirmed successfully.',
      });
    } catch (err: any) {
      console.error('[Auth verify-otp Error]:', err);
      res.status(500).json({ success: false, error: 'Verification failed. Please retry.' });
    }
  });

  /**
   * 3. Register Student (Multi-step complete registration)
   */
  app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        fullName,
        email,
        mobile,
        college,
        course,
        branch,
        semester,
        enrollmentNo,
        password,
        interests = [],
        skills = [],
        careerPreferences = [],
        verificationToken,
      } = req.body;

      if (!fullName || !email || !password) {
        res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!verificationToken) {
        res.status(403).json({
          success: false,
          error: 'Email verification is required before registration.',
        });
        return;
      }

      let verifiedPayload: any;

      try {
        verifiedPayload = jwt.verify(verificationToken, JWT_SECRET);
      } catch {
        res.status(403).json({
          success: false,
          error: 'Verification expired. Please verify your email again.',
        });
        return;
      }

      if (
        verifiedPayload.purpose !== 'register' ||
        verifiedPayload.email !== normalizedEmail
      ) {
        res.status(403).json({
          success: false,
          error: 'Email verification does not match this registration.',
        });
        return;
      }

      // Check duplicate email in PostgreSQL first
      if (isDatabaseConnected()) {
        try {
          const pgDup = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
          if (pgDup.rows.length > 0) {
            res.status(400).json({ success: false, error: 'An account with this email already exists.' });
            return;
          }
        } catch (dbErr: any) {
          console.warn('[Register DB Duplicate Check Notice]:', dbErr.message);
        }
      }

      const db = getAccountDb();

      // Check duplicate email in memory/file store
      const existing = Object.values<any>(db.profiles || {}).find(
        (p) => p.email?.toLowerCase() === normalizedEmail
      );
      if (existing) {
        res.status(400).json({ success: false, error: 'An account with this email already exists.' });
        return;
      }

      // Hash password using bcrypt
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = 'usr_' + Date.now().toString(36) + '_' + crypto.randomBytes(2).toString('hex');

      // 1. Save to PostgreSQL first (Source of Truth)
      if (isDatabaseConnected()) {
        try {
          await query(
            `INSERT INTO users (id, email, password_hash, mobile, name, college, course, branch, semester, enrollment_no, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
             ON CONFLICT (email) DO NOTHING`,
            [userId, normalizedEmail, passwordHash, mobile || '', fullName.trim(), college || '', course || '', branch || '', semester || '1', enrollmentNo || '']
          );
        } catch (pgInsertErr: any) {
          console.error('[Register PostgreSQL Insert Error]:', pgInsertErr.message);
          res.status(500).json({ success: false, error: 'Failed to record student account in database.' });
          return;
        }
      }

      // 2. Record Session in PostgreSQL
      if (isDatabaseConnected()) {
        try {
          const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
          const userAgent = (req.headers['user-agent'] as string) || 'KAMPUS Client';
          await query(
            `INSERT INTO user_sessions (id, user_id, device_info, ip_address, expires_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, userId, userAgent, ip, expiresAt.toISOString()]
          );
        } catch (sessErr: any) {
          console.warn('[Register Session DB Notice]:', sessErr.message);
        }
      }

      const newProfile = {
        userId,
        fullName: fullName.trim(),
        email: normalizedEmail,
        mobile: mobile || '',
        college: college || 'University Campus',
        course: course || 'Undergraduate',
        branch: branch || 'Engineering',
        semester: semester || '1',
        enrollmentNo: enrollmentNo || '',
        bio: `Student at ${college || 'Campus'} interested in ${interests.slice(0, 2).join(', ') || 'Technology'}`,
        interests,
        skills,
        careerPreferences,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        verifiedBadge: true,
        hasCompletedOnboarding: true,
        createdAt: new Date().toISOString(),
      };

      if (!db.profiles) db.profiles = {};
      if (!db.credentials) db.credentials = {};
      db.profiles[userId] = newProfile;
      db.credentials[userId] = { passwordHash, lastChangedAt: new Date().toISOString() };
      saveAccountDb(db);

      const token = jwt.sign(
        { userId, email: normalizedEmail, role: 'student' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: newProfile,
        message: 'Account registered successfully.',
      });
    } catch (err: any) {
      console.error('[Auth register Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to create student account.' });
    }
  });

  /**
   * 4. Login with Email + Password
   */
  app.post('/api/auth/login-password', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const db = getAccountDb();

      let profile = Object.values<any>(db.profiles || {}).find(
        (p) => p.email?.toLowerCase() === normalizedEmail
      );

      let effectivePasswordHash = db.credentials?.[profile?.userId]?.passwordHash;

      // Check PostgreSQL users table for credentials if not found in memory
      if (!effectivePasswordHash && isDatabaseConnected()) {
        try {
          const pgUser = await query(
            'SELECT id, password_hash, name, college, course, branch, semester, enrollment_no, avatar_url, bio, is_verified FROM users WHERE email = $1',
            [normalizedEmail]
          );
          if (pgUser.rows.length > 0 && pgUser.rows[0].password_hash) {
            effectivePasswordHash = pgUser.rows[0].password_hash;
            if (!profile) {
              const u = pgUser.rows[0];
              profile = {
                userId: u.id,
                fullName: u.name,
                email: normalizedEmail,
                college: u.college,
                course: u.course,
                branch: u.branch,
                semester: u.semester,
                enrollmentNo: u.enrollment_no,
                avatarUrl: u.avatar_url,
                bio: u.bio,
                isVerified: u.is_verified,
                hasCompletedOnboarding: true,
              };
            }
          }
        } catch (dbErr: any) {
          console.warn('[DB User Login Notice]:', dbErr.message);
        }
      }

      if (!profile) {
        res.status(401).json({ success: false, error: 'No student account found with this email.' });
        return;
      }

      if (!effectivePasswordHash) {
        res.status(401).json({
          success: false,
          error: 'Password credentials not configured. Please reset your password.',
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, effectivePasswordHash);

      if (!isPasswordValid) {
        res.status(401).json({ success: false, error: 'Invalid password. Please check and try again.' });
        return;
      }

      // Record active session in PostgreSQL
      if (isDatabaseConnected()) {
        try {
          const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
          const userAgent = (req.headers['user-agent'] as string) || 'KAMPUS Client';
          await query(
            `INSERT INTO user_sessions (id, user_id, device_info, ip_address, expires_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, profile.userId, userAgent, ip, expiresAt.toISOString()]
          );
        } catch (sessErr: any) {
          console.warn('[Session DB Notice]:', sessErr.message);
        }
      }

      const token = jwt.sign(
        { userId: profile.userId, email: profile.email, role: 'student' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        token,
        user: profile,
        message: 'Login successful.',
      });
    } catch (err: any) {
      console.error('[Auth login-password Error]:', err);
      res.status(500).json({ success: false, error: 'Login failed. Please retry.' });
    }
  });

  /**
   * 5. Forgot Password & Reset
   */
  app.post('/api/auth/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        res.status(400).json({ success: false, error: 'Please provide a valid email.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const db = getAccountDb();
      let profile = Object.values<any>(db.profiles || {}).find(
        (p) => p.email?.toLowerCase() === normalizedEmail
      );

      if (!profile) {
        // Don't disclose if account exists
        res.json({
          success: true,
          message: 'If an account exists with this email, a reset code has been sent.',
        });
        return;
      }

      const otpCode = crypto.randomInt(100000, 1000000).toString();
      const codeHash = hashString(otpCode);
      const expiresAt = Date.now() + 10 * 60 * 1000;

      otpStore.set(`${normalizedEmail}:forgot_password`, {
        email: normalizedEmail,
        codeHash,
        purpose: 'forgot_password',
        attempts: 0,
        expiresAt,
        lastSentAt: Date.now(),
      });

      if (isDatabaseConnected()) {
        try {
          const expiresDate = new Date(expiresAt);
          await query(
            `INSERT INTO otp_tokens (identifier, token_hash, purpose, expires_at, attempts)
             VALUES ($1, $2, 'forgot_password', $3, 0)`,
            [normalizedEmail, codeHash, expiresDate.toISOString()]
          );
        } catch (dbErr: any) {
          console.warn('[Forgot Password OTP DB Save Notice]:', dbErr.message);
        }
      }

      await sendEmailOtp(normalizedEmail, otpCode, 'Password Reset');

      res.json({
        success: true,
        message: `Password reset code sent to ${normalizedEmail}`,
      });
    } catch (err: any) {
      console.error('[Auth forgot-password Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to process request.' });
    }
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        res.status(400).json({ success: false, error: 'All fields are required.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      let isValidResetCode = false;

      // Check PostgreSQL persistent OTP tokens for forgot_password
      if (isDatabaseConnected()) {
        try {
          const otpRes = await query(
            `SELECT id, token_hash, expires_at, attempts
             FROM otp_tokens
             WHERE identifier = $1 AND purpose = 'forgot_password'
             ORDER BY created_at DESC LIMIT 1`,
            [normalizedEmail]
          );
          if (otpRes.rows.length > 0) {
            const row = otpRes.rows[0];
            if (new Date() > new Date(row.expires_at)) {
              res.status(400).json({ success: false, error: 'Reset code expired. Request a new code.' });
              return;
            }
            if (row.attempts >= 5) {
              res.status(429).json({ success: false, error: 'Too many attempts. Request a new code.' });
              return;
            }
            const inputHash = hashString(code.trim());
            if (inputHash !== row.token_hash) {
              await query('UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = $1', [row.id]);
              res.status(400).json({ success: false, error: 'Invalid reset code.' });
              return;
            }
            isValidResetCode = true;
            await query("DELETE FROM otp_tokens WHERE identifier = $1 AND purpose = 'forgot_password'", [normalizedEmail]);
          }
        } catch (dbErr: any) {
          console.warn('[Reset Password DB Check Notice]:', dbErr.message);
        }
      }

      if (!isValidResetCode) {
        const otpKey = `${normalizedEmail}:forgot_password`;
        const stored = otpStore.get(otpKey) || otpStore.get(normalizedEmail);

        if (!stored || (stored.purpose !== 'forgot_password' && stored.purpose !== undefined)) {
          res.status(400).json({ success: false, error: 'Invalid or expired reset code.' });
          return;
        }

        if (Date.now() > stored.expiresAt) {
          otpStore.delete(otpKey);
          otpStore.delete(normalizedEmail);
          res.status(400).json({ success: false, error: 'Reset code expired. Request a new code.' });
          return;
        }

        if (stored.attempts >= 5) {
          otpStore.delete(otpKey);
          otpStore.delete(normalizedEmail);
          res.status(429).json({ success: false, error: 'Too many attempts. Request a new code.' });
          return;
        }

        if (hashString(code.trim()) !== stored.codeHash) {
          stored.attempts += 1;
          res.status(400).json({ success: false, error: 'Invalid reset code.' });
          return;
        }

        otpStore.delete(otpKey);
        otpStore.delete(normalizedEmail);
      }

      const db = getAccountDb();
      let profile = Object.values<any>(db.profiles || {}).find(
        (p) => p.email?.toLowerCase() === normalizedEmail
      );

      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Synchronize to PostgreSQL users table as primary source of truth
      if (isDatabaseConnected()) {
        try {
          await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
            [passwordHash, normalizedEmail]
          );
        } catch (pgErr: any) {
          console.warn('[Reset Password DB Notice]:', pgErr.message);
        }
      }

      if (profile) {
        if (!db.credentials) db.credentials = {};
        db.credentials[profile.userId] = { passwordHash, lastChangedAt: new Date().toISOString() };
        saveAccountDb(db);
      }

      res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });
    } catch (err: any) {
      console.error('[Auth reset-password Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
  });

  /**
   * Helper: Authenticate session token via Clerk or local JWT
   */
  async function authenticateAnyToken(authHeader?: string): Promise<{ userId: string; email: string; role: string } | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];

    // Try Clerk verification if secret key is present
    if (CLERK_SECRET_KEY) {
      try {
        const verified = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
        if (verified && verified.sub) {
          return {
            userId: verified.sub,
            email: (verified as any).email || '',
            role: 'student',
          };
        }
      } catch {
        // Continue to local JWT fallback
      }
    }

    // Fallback to local JWT verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        userId: decoded.userId || decoded.sub,
        email: decoded.email || '',
        role: decoded.role || 'student',
      };
    } catch {
      return null;
    }
  }

  /**
   * 6. Current User profile endpoint
   */
  app.get('/api/auth/me', async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = await authenticateAnyToken(req.headers.authorization);
      if (!auth) {
        res.status(401).json({ success: false, error: 'Authentication required or session expired.' });
        return;
      }

      const db = getAccountDb();
      let userProfile = db.profiles?.[auth.userId];
      if (!userProfile) {
        userProfile = Object.values<any>(db.profiles || {}).find(
          (p) => (auth.email && p.email?.toLowerCase() === auth.email.toLowerCase()) || p.clerkId === auth.userId
        );
      }

      // If not yet in local store but authenticated via Clerk, auto-provision
      if (!userProfile && clerkClient && auth.userId.startsWith('user_')) {
        try {
          const clerkUser = await clerkClient.users.getUser(auth.userId);
          if (clerkUser) {
            const email = clerkUser.emailAddresses?.[0]?.emailAddress || auth.email || '';
            const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'KAMPUS Student';
            userProfile = {
              userId: 'usr_' + Date.now().toString(36),
              clerkId: clerkUser.id,
              fullName,
              email,
              mobile: clerkUser.phoneNumbers?.[0]?.phoneNumber || '',
              college: '',
              course: '',
              branch: '',
              semester: '',
              enrollmentNo: '',
              bio: 'KAMPUS Student navigating university life.',
              interests: ['Technology', 'Campus Innovation'],
              skills: [],
              avatarUrl: clerkUser.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              verifiedBadge: true,
              hasCompletedOnboarding: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            if (!db.profiles) db.profiles = {};
            db.profiles[userProfile.userId] = userProfile;
            if (!saveAccountDb(db)) { throw new Error('Account database write failed.'); }
          }
        } catch (fetchErr) {
          console.warn('[Clerk Auto-fetch Warning]:', fetchErr);
        }
      }

      if (!userProfile) {
        res.status(404).json({ success: false, error: 'User profile not found' });
        return;
      }

      res.json({ success: true, user: userProfile });
    } catch (err: any) {
      res.status(401).json({ success: false, error: 'Invalid or expired session token' });
    }
  });

  /**
   * 7. Clerk Profile Synchronization
   * Links external Clerk User ID to KAMPUS profile with database parity
   */
  app.post('/api/auth/sync-profile', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        clerkId,
        email,
        fullName,
        avatarUrl,
        college,
        course,
        branch,
        semester,
        enrollmentNo,
        bio,
        interests,
      } = req.body;

      if (!clerkId && !email) {
        res.status(400).json({ success: false, error: 'Clerk ID or student email is required for profile sync.' });
        return;
      }

      const normalizedEmail = (email || '').trim().toLowerCase();
      const db = getAccountDb();
      if (!db.profiles) db.profiles = {};

      let existingProfile: any = null;
      let existingKey = '';

      for (const [key, p] of Object.entries<any>(db.profiles)) {
        if (p.clerkId && clerkId && p.clerkId === clerkId) {
          existingProfile = p;
          existingKey = key;
          break;
        }
        if (normalizedEmail && p.email?.toLowerCase() === normalizedEmail) {
          existingProfile = p;
          existingKey = key;
          break;
        }
      }

      // Safeguard: Never overwrite demo user usr_22b030149 with a different student's details
      if (existingProfile && (existingKey === 'usr_22b030149' || existingProfile.userId === 'usr_22b030149') && normalizedEmail !== 'priya.sharma@cse.iitb.ac.in') {
        existingProfile = null;
        existingKey = '';
      }

      if (existingProfile) {
        // Link Clerk ID if not already set
        existingProfile.clerkId = clerkId || existingProfile.clerkId;
        if (fullName && (!existingProfile.fullName || existingProfile.fullName === 'KAMPUS Student' || existingProfile.fullName === 'Priya Sharma')) {
          existingProfile.fullName = fullName;
        }
        if (normalizedEmail && (!existingProfile.email || existingProfile.email === 'priya.sharma@cse.iitb.ac.in')) {
          existingProfile.email = normalizedEmail;
        }
        if (avatarUrl && !existingProfile.avatarUrl?.startsWith('data:')) {
          existingProfile.avatarUrl = avatarUrl;
        }
        if (college && !existingProfile.college) existingProfile.college = college;
        if (course && !existingProfile.course) existingProfile.course = course;
        if (branch && !existingProfile.branch) existingProfile.branch = branch;
        if (semester && !existingProfile.semester) existingProfile.semester = semester;
        if (enrollmentNo && !existingProfile.enrollmentNo) existingProfile.enrollmentNo = enrollmentNo;
        if (bio && !existingProfile.bio) existingProfile.bio = bio;
        if (interests && Array.isArray(interests) && interests.length > 0 && (!existingProfile.interests || existingProfile.interests.length === 0)) {
          existingProfile.interests = interests;
        }

        existingProfile.updatedAt = new Date().toISOString();
        db.profiles[existingKey] = existingProfile;
        if (!saveAccountDb(db)) { throw new Error('Account database write failed.'); }

        const token = jwt.sign(
          { userId: existingProfile.userId, clerkId, email: existingProfile.email, role: 'student' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        res.json({
          success: true,
          user: existingProfile,
          token,
          hasCompletedOnboarding: !!existingProfile.hasCompletedOnboarding,
          message: 'Profile synchronized successfully.',
        });
        return;
      }

      // First-time Clerk User: Provision fresh KAMPUS profile
      const userId = 'usr_' + Date.now().toString(36) + '_' + crypto.randomBytes(2).toString('hex');
      const newProfile = {
        userId,
        clerkId: clerkId || userId,
        fullName: fullName || (normalizedEmail ? normalizedEmail.split('@')[0] : 'KAMPUS Student'),
        email: normalizedEmail,
        mobile: '',
        college: college || '',
        course: course || '',
        branch: branch || '',
        semester: semester || '',
        enrollmentNo: enrollmentNo || '',
        bio: bio || 'Passionate student navigating campus life & academic excellence.',
        interests: interests || ['Technology', 'Software Development', 'Campus Innovation'],
        skills: ['Problem Solving', 'Teamwork'],
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        verifiedBadge: true,
        hasCompletedOnboarding: !!(college && course && semester),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.profiles[userId] = newProfile;
      if (!saveAccountDb(db)) { throw new Error('Account database write failed.'); }

      // Persist to PostgreSQL if connected
      await query(
        `INSERT INTO users (id, email, name, college, course, branch, semester, enrollment_no, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name`,
        [userId, normalizedEmail, newProfile.fullName, newProfile.college, newProfile.course, newProfile.branch, newProfile.semester, newProfile.enrollmentNo]
      );

      const token = jwt.sign(
        { userId, clerkId, email: normalizedEmail, role: 'student' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        user: newProfile,
        token,
        hasCompletedOnboarding: newProfile.hasCompletedOnboarding,
        message: 'New student profile created and linked to Clerk.',
      });
    } catch (err: any) {
      console.error('[Auth sync-profile Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to synchronize student profile.' });
    }
  });

  /**
   * 8. Complete Student Onboarding
   */
  app.post('/api/auth/complete-onboarding', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, clerkId, onboardingData, fullName, email } = req.body;
      if (!userId && !clerkId) {
        res.status(400).json({ success: false, error: 'User identifier required.' });
        return;
      }

      const db = getAccountDb();
      if (!db.profiles) db.profiles = {};

      const normalizedEmail = (email || onboardingData?.email || '').trim().toLowerCase();

      let targetKey = userId;
      let profile = (userId && userId !== 'usr_22b030149') ? db.profiles[userId] : null;

      if (!profile && clerkId) {
        for (const [key, p] of Object.entries<any>(db.profiles)) {
          if (p.clerkId === clerkId && key !== 'usr_22b030149') {
            profile = p;
            targetKey = key;
            break;
          }
        }
      }

      if (!profile && normalizedEmail && normalizedEmail !== 'priya.sharma@cse.iitb.ac.in') {
        for (const [key, p] of Object.entries<any>(db.profiles)) {
          if (p.email?.toLowerCase() === normalizedEmail && key !== 'usr_22b030149') {
            profile = p;
            targetKey = key;
            break;
          }
        }
      }

      const realName =
        fullName ||
        onboardingData?.name ||
        (normalizedEmail ? normalizedEmail.split('@')[0] : 'KAMPUS Student');

      if (!profile) {
        // Auto-provision profile with onboarding details if not found
        const fallbackId = (userId && userId !== 'usr_22b030149') ? userId : 'usr_' + Date.now().toString(36);
        profile = {
          userId: fallbackId,
          clerkId: clerkId || fallbackId,
          fullName: realName,
          email: normalizedEmail,
          mobile: onboardingData?.mobile || '',
          ...onboardingData,
          hasCompletedOnboarding: true,
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.profiles[fallbackId] = profile;
        targetKey = fallbackId;
      }

      const updated = {
        ...profile,
        ...onboardingData,
        fullName: realName !== 'KAMPUS Student' ? realName : (profile.fullName || realName),
        email: normalizedEmail || profile.email,
        hasCompletedOnboarding: true,
        isVerified: true,
        updatedAt: new Date().toISOString(),
      };

      db.profiles[targetKey] = updated;
      if (!saveAccountDb(db)) { throw new Error('Account database write failed.'); }

      await query(
        `UPDATE users SET college = $1, course = $2, semester = $3, enrollment_no = $4 WHERE id = $5`,
        [updated.college || '', updated.course || '', updated.semester || '', updated.enrollmentNo || '', updated.userId]
      );

      const token = jwt.sign(
        { userId: updated.userId, clerkId: updated.clerkId || clerkId, email: updated.email, role: 'student' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        user: updated,
        profile: updated,
        token,
        message: 'Student onboarding successfully completed.',
      });
    } catch (err: any) {
      console.error('[Auth complete-onboarding Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to complete onboarding.' });
    }
  });

  /**
   * 9. Clerk Configuration Status
   */
  app.get('/api/auth/clerk-config', (_req: Request, res: Response): void => {
    const pubKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || '';
    const isConfigured = pubKey.startsWith('pk_') && !pubKey.includes('your_clerk_publishable_key');
    res.json({
      success: true,
      isConfigured,
      publishableKey: isConfigured ? pubKey : '',
    });
  });
}


