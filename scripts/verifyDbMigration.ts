import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase, query, getDatabaseStatus } from '../database/db.ts';
import { ModuleStorage, initializeAllModules } from '../database/moduleStorage.ts';

async function main() {
  console.log('--- 1. Testing Database Initialization ---');
  await initializeDatabase();
  const status = getDatabaseStatus();
  console.log('Status:', status);

  if (!status.isPostgresConnected) {
    console.error('FAILED: PostgreSQL not connected');
    process.exit(1);
  }

  console.log('--- 2. Checking Users Table ---');
  const userRes = await query('SELECT id, email, name, is_verified, (password_hash IS NOT NULL) as has_pwd FROM users LIMIT 5');
  console.log('Sample Users:', userRes.rows);

  console.log('--- 3. Checking Admin Roles Table ---');
  const roleRes = await query('SELECT id, name, is_system FROM admin_roles');
  console.log('Admin Roles count:', roleRes.rowCount);

  console.log('--- 4. Checking Admin Users Table (Credentials Fidelity) ---');
  const adminRes = await query('SELECT id, email, name, role_id, status, length(password_hash) as hash_len, length(password_salt) as salt_len FROM admin_users');
  console.log('Admin Users:', adminRes.rows);

  for (const admin of adminRes.rows) {
    if (admin.hash_len === 0 || admin.salt_len === 0) {
      console.error(`FAILED: Admin user ${admin.id} is missing password hash or salt!`);
      process.exit(1);
    }
  }

  console.log('--- 5. Testing Module Storage Versioned JSONB ---');
  const testStorage = new ModuleStorage<any>(
    'test_module',
    './.kampus_test_module_db.json',
    () => ({ items: ['alpha', 'beta'], counter: 1 })
  );

  const initData = await testStorage.init();
  console.log('Initial test module data:', initData);

  initData.counter += 1;
  const saveOk = await testStorage.save(initData);
  console.log('Save result:', saveOk);

  const dbRow = await query('SELECT module_key, version, checksum, record_count FROM module_state WHERE module_key = $1', ['test_module']);
  console.log('Module state in PostgreSQL:', dbRow.rows[0]);

  // Clean up test module from DB and disk
  await query('DELETE FROM module_state WHERE module_key = $1', ['test_module']);
  try {
    const fs = await import('fs');
    if (fs.existsSync('./.kampus_test_module_db.json')) {
      fs.unlinkSync('./.kampus_test_module_db.json');
    }
  } catch {}

  console.log('--- ALL CHECKS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
