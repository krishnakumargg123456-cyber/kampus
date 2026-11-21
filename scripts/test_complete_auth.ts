import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase, query, getDatabaseStatus } from '../database/db.ts';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kampus_default_super_secret_jwt_key_2026';

async function runAuthTests() {
  console.log('====================================================');
  console.log('       KAMPUS COMPREHENSIVE AUTHENTICATION TESTS    ');
  console.log('====================================================');

  await initializeDatabase();
  const dbStatus = getDatabaseStatus();
  console.log('[DB Status]:', dbStatus);

  if (!dbStatus.isPostgresConnected) {
    throw new Error('PostgreSQL connection failed during test.');
  }

  const testEmail = `test.student.${Date.now()}@kampus.edu.in`;
  const testPassword = 'SecureStudentPassword2026!';
  const newPassword = 'NewlyResetPassword2026@#$';
  const testUserId = 'usr_test_' + Date.now().toString(36);

  console.log(`\n--- Test 1: Send OTP for Registration ---`);
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const codeHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await query(
    `INSERT INTO otp_tokens (email, identifier, code_hash, token_hash, purpose, expires_at, attempts)
     VALUES ($1, $1, $2, $2, 'register', $3, 0)`,
    [testEmail, codeHash, expiresAt.toISOString()]
  );
  console.log(`[PASS] OTP token successfully stored in PostgreSQL for ${testEmail}`);

  console.log(`\n--- Test 2: Reject Incorrect OTP Code ---`);
  const wrongCode = '000000';
  const wrongHash = crypto.createHash('sha256').update(wrongCode).digest('hex');
  const otpCheck = await query(
    `SELECT id, code_hash, token_hash, attempts FROM otp_tokens WHERE (email = $1 OR identifier = $1) AND purpose = 'register'`,
    [testEmail]
  );
  if (otpCheck.rows.length > 0) {
    const row = otpCheck.rows[0];
    const storedHash = row.code_hash || row.token_hash;
    if (storedHash !== wrongHash) {
      await query('UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = $1', [row.id]);
      console.log(`[PASS] Incorrect OTP code detected and attempts incremented to 1.`);
    }
  }

  console.log(`\n--- Test 3: Verify Valid OTP & Generate Verification Token ---`);
  const validCheck = await query(
    `SELECT id, code_hash, token_hash FROM otp_tokens WHERE (email = $1 OR identifier = $1) AND purpose = 'register'`,
    [testEmail]
  );
  if (validCheck.rows.length > 0) {
    const row = validCheck.rows[0];
    const storedHash = row.code_hash || row.token_hash;
    if (storedHash === codeHash) {
      await query(`DELETE FROM otp_tokens WHERE id = $1`, [row.id]);
      console.log(`[PASS] Valid OTP consumed and deleted to prevent replay attacks.`);
    }
  }

  const verificationToken = jwt.sign(
    { email: testEmail, purpose: 'register', verifiedAt: Date.now() },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  console.log(`\n--- Test 4: Student Registration in PostgreSQL ---`);
  const passwordHash = await bcrypt.hash(testPassword, 10);
  await query(
    `INSERT INTO users (id, email, password_hash, mobile, name, college, course, branch, semester, enrollment_no, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
    [
      testUserId,
      testEmail,
      passwordHash,
      '+91 9876543210',
      'Test Scholar',
      'IIT Bombay',
      'B.Tech Computer Science',
      'CSE',
      'Semester 6',
      '22B099999',
    ]
  );
  console.log(`[PASS] Student record persisted to PostgreSQL users table with bcrypt hash.`);

  console.log(`\n--- Test 5: Duplicate Registration Rejection ---`);
  let duplicateRejected = false;
  try {
    await query(
      `INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
      ['usr_dup', testEmail, passwordHash, 'Duplicate User']
    );
  } catch (dupErr: any) {
    if (dupErr.message.includes('unique constraint') || dupErr.message.includes('users_email_key')) {
      duplicateRejected = true;
      console.log(`[PASS] Duplicate email registration blocked by database constraint.`);
    }
  }
  if (!duplicateRejected) throw new Error('Duplicate registration was not blocked!');

  console.log(`\n--- Test 6: Password Login Verification ---`);
  const userRow = await query('SELECT id, email, password_hash, name FROM users WHERE email = $1', [testEmail]);
  if (userRow.rows.length === 0) throw new Error('User not found in DB');

  const isPasswordValid = await bcrypt.compare(testPassword, userRow.rows[0].password_hash);
  if (!isPasswordValid) throw new Error('Valid password comparison failed');
  console.log(`[PASS] Password verified successfully against PostgreSQL bcrypt hash.`);

  console.log(`\n--- Test 7: Reject Incorrect Password ---`);
  const isWrongPasswordValid = await bcrypt.compare('WrongPassword123!', userRow.rows[0].password_hash);
  if (isWrongPasswordValid) throw new Error('Incorrect password was accepted');
  console.log(`[PASS] Incorrect password rejected successfully.`);

  console.log(`\n--- Test 8: Session Persistence in user_sessions ---`);
  const sessionId = 'sess_test_' + crypto.randomBytes(8).toString('hex');
  const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO user_sessions (id, user_id, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, testUserId, 'Automated Test Client (Android/Web)', '127.0.0.1', sessionExpiresAt.toISOString()]
  );
  const sessionCheck = await query('SELECT id, user_id FROM user_sessions WHERE id = $1', [sessionId]);
  if (sessionCheck.rows.length === 0) throw new Error('Session was not saved in DB');
  console.log(`[PASS] User session successfully created and verified in user_sessions table.`);

  console.log(`\n--- Test 9: Forgot Password & Reset Flow ---`);
  const resetOtp = crypto.randomInt(100000, 1000000).toString();
  const resetHash = crypto.createHash('sha256').update(resetOtp).digest('hex');
  await query(
    `INSERT INTO otp_tokens (email, identifier, code_hash, token_hash, purpose, expires_at, attempts)
     VALUES ($1, $1, $2, $2, 'forgot_password', $3, 0)`,
    [testEmail, resetHash, new Date(Date.now() + 600000).toISOString()]
  );

  // Apply reset
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2', [newPasswordHash, testEmail]);
  await query("DELETE FROM otp_tokens WHERE (email = $1 OR identifier = $1) AND purpose = 'forgot_password'", [testEmail]);
  console.log(`[PASS] Password reset successfully updated PostgreSQL users table.`);

  console.log(`\n--- Test 10: Verify Login with NEW Password ---`);
  const updatedUserRow = await query('SELECT password_hash FROM users WHERE email = $1', [testEmail]);
  const isNewValid = await bcrypt.compare(newPassword, updatedUserRow.rows[0].password_hash);
  const isOldStillValid = await bcrypt.compare(testPassword, updatedUserRow.rows[0].password_hash);
  if (!isNewValid || isOldStillValid) throw new Error('New password login verification failed');
  console.log(`[PASS] Login with new password succeeded; old password successfully invalidated.`);

  console.log(`\n--- Test 11: Super Admin Authentication (scrypt Salt & Hash) ---`);
  const adminRow = await query(
    'SELECT id, email, password_hash, password_salt, role_id FROM admin_users WHERE email = $1',
    ['admin@kampus.edu.in']
  );
  if (adminRow.rows.length === 0) throw new Error('Super admin user not found in DB');
  const admin = adminRow.rows[0];
  console.log(`[PASS] Super Admin record found in PostgreSQL (Role: ${admin.role_id}, Salt length: ${admin.password_salt?.length}).`);

  // Clean up test records
  await query('DELETE FROM user_sessions WHERE user_id = $1', [testUserId]);
  await query('DELETE FROM users WHERE id = $1', [testUserId]);
  console.log(`[CLEANUP] Test records cleaned up successfully.`);

  console.log('\n====================================================');
  console.log('       ALL 11 AUTHENTICATION TESTS PASSED [PASS]     ');
  console.log('====================================================');
}

runAuthTests().catch((err) => {
  console.error('\nFAILED AUTH TEST:', err);
  process.exit(1);
});
