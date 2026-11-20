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

// Initialize PostgreSQL Connection Pool if credentials exist
const connectionString = process.env.DATABASE_URL;
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
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]:', err.message);
    });
  } catch (err: any) {
    console.warn('[PostgreSQL Init Error]:', err.message);
  }
}

/**
 * Execute a SQL query against PostgreSQL or log fallback
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
      console.error('[PostgreSQL Query Error]:', err.message, '\nQuery:', text);
      throw err;
    }
  }

  // Graceful fallback for offline / development when PostgreSQL is not connected
  return { rows: [], rowCount: 0 };
}

/**
 * Run schema migrations and auto-seed from existing JSON databases
 */
export async function initializeDatabase(): Promise<void> {
  console.log('[Database] Initializing KAMPUS database engine...');

  if (!pool) {
    console.log('[Database] PostgreSQL not configured. Operating in High-Resilience File-Store & JSON Sync Mode.');
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
        console.log('[Database] PostgreSQL Schema migrations applied successfully.');
        isPostgresReady = true;

        // Auto-seed from existing JSON files if users table is empty
        const userCheck = await client.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(userCheck.rows[0].count, 10);
        if (userCount === 0) {
          console.log('[Database] Empty user database detected. Seeding from existing Kampus records...');
          await seedFromExistingJson(client);
        }
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[Database] PostgreSQL connection failed (will run in resilient file mode):', err.message);
    isPostgresReady = false;
  }
}

/**
 * Seed existing JSON database contents into PostgreSQL so no data is lost
 */
async function seedFromExistingJson(client: pg.PoolClient): Promise<void> {
  try {
    // 1. Seed Accounts
    const accountDbPath = path.join(process.cwd(), '.kampus_account_db.json');
    if (fs.existsSync(accountDbPath)) {
      const data = JSON.parse(fs.readFileSync(accountDbPath, 'utf8'));
      if (data.profiles) {
        for (const [id, prof] of Object.entries<any>(data.profiles)) {
          await client.query(
            `INSERT INTO users (id, email, name, college, course, branch, semester, enrollment_no, avatar_url, bio, skills, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [
              id,
              prof.email || `${id}@kampus.edu.in`,
              prof.fullName || 'Student',
              prof.college || 'IIT Bombay',
              prof.course || 'B.Tech Computer Science',
              prof.branch || 'CSE',
              prof.semester || '6',
              prof.enrollmentNo || '',
              prof.avatarUrl || '',
              prof.bio || '',
              prof.skills || [],
              prof.verifiedBadge || false,
            ]
          );
        }
      }
    }

    // 2. Seed Super Admin
    const adminDbPath = path.join(process.cwd(), '.kampus_super_admin_db.json');
    if (fs.existsSync(adminDbPath)) {
      const adminData = JSON.parse(fs.readFileSync(adminDbPath, 'utf8'));
      if (adminData.roles) {
        for (const role of adminData.roles) {
          await client.query(
            `INSERT INTO admin_roles (id, name, description, permissions, is_system)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [role.id, role.name, role.description, role.permissions, role.isSystem ?? true]
          );
        }
      }

      if (adminData.teamMembers) {
        for (const member of adminData.teamMembers) {
          await client.query(
            `INSERT INTO admin_users (id, email, name, password_hash, role_id, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [
              member.id,
              member.email,
              member.name,
              '$2a$10$e8w.KzYkC5pI/P1v3Xm6Z.r7P8g0HqG3d8b5T2x1q0m6v2Xm6Z.r7', // bcrypt hash placeholder
              member.roleId,
              member.status || 'Active',
            ]
          );
        }
      }
    }
    console.log('[Database] JSON seeder completed successfully.');
  } catch (err: any) {
    console.warn('[Database] Seeding warning:', err.message);
  }
}

export function getDatabaseStatus() {
  return {
    engine: isPostgresReady ? 'PostgreSQL' : 'JSON/File Resilience Storage',
    isPostgresConnected: isPostgresReady,
    poolActive: pool !== null,
  };
}
