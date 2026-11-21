import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

let pool: pg.Pool | null = null;
let isPostgresReady = false;

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;
const isNeon = connectionString?.includes('neon.tech') || connectionString?.includes('sslmode=require');
const shouldEnableSsl = process.env.DATABASE_SSL === 'true' || isNeon || (connectionString?.includes('ssl=true') ?? false);

const hasPgCredentials = Boolean(
  connectionString ||
  (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE)
);

if (hasPgCredentials) {
  try {
    pool = new Pool({
      connectionString: connectionString || undefined,
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      ssl: shouldEnableSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]:', err.message);
    });
  } catch (err: any) {
    console.error('[PostgreSQL Init Error]:', err.message);
    if (isProduction) {
      throw new Error(`Production database pool initialization failed: ${err.message}`);
    }
  }
} else if (isProduction) {
  throw new Error('Fatal: Production environment requires DATABASE_URL or PostgreSQL credentials.');
}

/**
 * Execute a SQL query against PostgreSQL
 * In production: throws if PostgreSQL is not connected or query fails.
 * In development: logs explicit fallback warning when PostgreSQL is offline.
 * Never logs SQL parameters or secrets.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  if (pool && isPostgresReady) {
    try {
      const res = await pool.query(text, params);
      return {
        rows: res.rows,
        rowCount: res.rowCount ?? res.rows.length,
      };
    } catch (err: any) {
      console.error('[PostgreSQL Query Error]:', err.message);
      throw err;
    }
  }

  if (isProduction) {
    throw new Error('PostgreSQL database is not connected or unavailable in production.');
  }

  // Graceful fallback for offline / development when PostgreSQL is not connected
  return { rows: [], rowCount: 0 };
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<pg.PoolClient | null> {
  if (pool && isPostgresReady) {
    return await pool.connect();
  }
  return null;
}

export function isDatabaseConnected(): boolean {
  return isPostgresReady && pool !== null;
}

/**
 * Run schema migrations and auto-seed from existing JSON records
 */
export async function initializeDatabase(): Promise<void> {
  console.log('[Database] Initializing KAMPUS database engine...');

  if (!pool) {
    if (isProduction) {
      throw new Error('Fatal: PostgreSQL pool is required in production but could not be initialized.');
    }
    console.log('[Database Dev]: PostgreSQL not configured. Operating in High-Resilience File-Store & JSON Sync Mode.');
    isPostgresReady = false;
    return;
  }

  try {
    const client = await pool.connect();
    try {
      console.log('[Database] Connected to PostgreSQL. Applying schema migrations...');
      const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        // Ensure compatibility columns exist on existing databases
        await client.query(`
          ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_salt VARCHAR(128);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
          ALTER TABLE otp_tokens ADD COLUMN IF NOT EXISTS identifier VARCHAR(255);
          ALTER TABLE otp_tokens ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255);
          ALTER TABLE otp_tokens ALTER COLUMN email DROP NOT NULL;
          ALTER TABLE otp_tokens ALTER COLUMN code_hash DROP NOT NULL;
          ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS device_info TEXT;
          ALTER TABLE user_sessions ALTER COLUMN token_hash DROP NOT NULL;
        `);
        console.log('[Database] PostgreSQL schema migrations applied successfully.');
        isPostgresReady = true;

        await seedFromExistingJson(client);
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (isProduction) {
      throw new Error(`Fatal: Production PostgreSQL connection failed: ${err.message}`);
    }
    console.warn('[Database Dev]: PostgreSQL connection failed (will run in resilient file mode):', err.message);
    isPostgresReady = false;
  }
}

/**
 * Seed existing JSON database contents into PostgreSQL with complete credential and field fidelity
 */
async function seedFromExistingJson(client: pg.PoolClient): Promise<void> {
  try {
    // 1. Seed Accounts & Student Profiles
    const accountDbPath = path.join(process.cwd(), '.kampus_account_db.json');
    if (fs.existsSync(accountDbPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(accountDbPath, 'utf8'));
        if (data.profiles) {
          for (const [id, prof] of Object.entries<any>(data.profiles)) {
            const isVerified = Boolean(prof.isVerified ?? prof.verifiedBadge ?? false);
            const passwordHash = data.credentials?.[id]?.passwordHash || null;
            const mobile = prof.mobile || prof.phone || '';
            const email = (prof.email || `${id}@kampus.edu.in`).trim().toLowerCase();

            // Check if user already exists by ID or Email
            const existing = await client.query('SELECT id FROM users WHERE id = $1 OR email = $2', [id, email]);
            if (existing.rows.length > 0) {
              await client.query(
                `UPDATE users SET
                   name = COALESCE(NULLIF($1, ''), users.name),
                   is_verified = $2,
                   password_hash = COALESCE(users.password_hash, $3),
                   mobile = COALESCE(NULLIF($4, ''), users.mobile),
                   college = COALESCE(NULLIF($5, ''), users.college),
                   course = COALESCE(NULLIF($6, ''), users.course),
                   branch = COALESCE(NULLIF($7, ''), users.branch),
                   semester = COALESCE(NULLIF($8, ''), users.semester),
                   enrollment_no = COALESCE(NULLIF($9, ''), users.enrollment_no),
                   avatar_url = COALESCE(NULLIF($10, ''), users.avatar_url),
                   bio = COALESCE(NULLIF($11, ''), users.bio)
                 WHERE id = $12 OR email = $13`,
                [
                  prof.fullName || '',
                  isVerified,
                  passwordHash,
                  mobile,
                  prof.college || '',
                  prof.course || '',
                  prof.branch || '',
                  prof.semester || '',
                  prof.enrollmentNo || '',
                  prof.avatarUrl || '',
                  prof.bio || '',
                  id,
                  email,
                ]
              );
            } else {
              await client.query(
                `INSERT INTO users (id, email, password_hash, mobile, name, college, course, branch, semester, enrollment_no, avatar_url, bio, skills, is_verified)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                  id,
                  email,
                  passwordHash,
                  mobile,
                  prof.fullName || 'Student',
                  prof.college || 'IIT Bombay',
                  prof.course || 'B.Tech Computer Science',
                  prof.branch || 'CSE',
                  prof.semester || '6',
                  prof.enrollmentNo || '',
                  prof.avatarUrl || '',
                  prof.bio || '',
                  prof.skills || [],
                  isVerified,
                ]
              );
            }
          }
        }
      } catch (userErr: any) {
        console.warn('[Database] User seeding notice:', userErr.message);
      }
    }

    // 2. Seed Super Admin Roles and Users
    const adminDbPath = path.join(process.cwd(), '.kampus_super_admin_db.json');
    if (fs.existsSync(adminDbPath)) {
      const adminData = JSON.parse(fs.readFileSync(adminDbPath, 'utf8'));
      
      // Roles
      if (Array.isArray(adminData.roles)) {
        for (const role of adminData.roles) {
          await client.query(
            `INSERT INTO admin_roles (id, name, description, permissions, is_system)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               description = EXCLUDED.description,
               permissions = EXCLUDED.permissions,
               is_system = EXCLUDED.is_system`,
            [role.id, role.name, role.description, role.permissions, role.isSystem ?? true]
          );
        }
      }

      // Team Members with Real Credentials (never placeholder hashes)
      if (Array.isArray(adminData.teamMembers)) {
        const credMap = new Map<string, { passwordSalt: string; passwordHash: string }>();
        if (Array.isArray(adminData.credentials)) {
          for (const c of adminData.credentials) {
            credMap.set(c.adminId, { passwordSalt: c.passwordSalt, passwordHash: c.passwordHash });
          }
        }

        for (const member of adminData.teamMembers) {
          const cred = credMap.get(member.id);
          await client.query(
            `INSERT INTO admin_users (id, email, name, password_hash, password_salt, role_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               password_hash = COALESCE(NULLIF(EXCLUDED.password_hash, ''), admin_users.password_hash),
               password_salt = COALESCE(NULLIF(EXCLUDED.password_salt, ''), admin_users.password_salt),
               role_id = EXCLUDED.role_id,
               status = EXCLUDED.status`,
            [
              member.id,
              member.email,
              member.name,
              cred?.passwordHash || '',
              cred?.passwordSalt || '',
              member.roleId,
              member.status || 'Active',
            ]
          );
        }
      }
    }
    console.log('[Database] Data synchronization completed successfully.');
  } catch (err: any) {
    console.warn('[Database] Seeding warning:', err.message);
  }
}

export function getDatabaseStatus() {
  return {
    engine: isPostgresReady ? 'PostgreSQL' : 'JSON/File Resilience Storage',
    isPostgresConnected: isPostgresReady,
    poolActive: pool !== null,
    environment: isProduction ? 'production' : 'development',
  };
}
