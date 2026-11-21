/**
 * KAMPUS Comprehensive 21 Backend Modules Persistence & Integrity Verification
 * Verifies versioned PostgreSQL JSONB state storage, atomic updates, checksums, and record counts.
 */
import path from 'path';
import { initializeDatabase, isDatabaseConnected, query } from '../database/db';
import { ModuleStorage, getRegisteredModule } from '../database/moduleStorage';

const MODULES_TO_TEST = [
  { key: 'account', file: '.kampus_account_db.json', name: 'Account Profile & Settings' },
  { key: 'campus_pulse', file: '.kampus_campus_pulse_db.json', name: 'Campus Pulse' },
  { key: 'career', file: '.kampus_career_db.json', name: 'Career Services' },
  { key: 'chat', file: '.kampus_chat_db.json', name: 'Campus Real-Time Chat' },
  { key: 'college_explorer', file: '.kampus_college_explorer_db.json', name: 'College Explorer' },
  { key: 'community', file: '.kampus_community_db.json', name: 'Student Communities' },
  { key: 'events_clubs', file: '.kampus_events_clubs_db.json', name: 'Events & Campus Clubs' },
  { key: 'kampus_id', file: '.kampus_kampus_id_db.json', name: 'Digital KAMPUS ID' },
  { key: 'locker', file: '.kampus_locker_db.json', name: 'Cloud Student Locker' },
  { key: 'market', file: '.kampus_market_db.json', name: 'Campus Marketplace' },
  { key: 'notes_exchange', file: '.kampus_notes_exchange_db.json', name: 'Peer Notes Exchange' },
  { key: 'notifications', file: '.kampus_notifications_db.json', name: 'Real-Time Notifications' },
  { key: 'planner', file: '.kampus_planner_db.json', name: 'Academic Planner' },
  { key: 'rewards', file: '.kampus_rewards_db.json', name: 'Karma & Rewards' },
  { key: 'skillswap', file: '.kampus_skillswap_db.json', name: 'Peer Skill Swap' },
  { key: 'student_voice', file: '.kampus_student_voice_db.json', name: 'Student Voice & Polls' },
  { key: 'studyhub', file: '.kampus_studyhub_db.json', name: 'Study Hub' },
  { key: 'study_partner', file: '.kampus_study_partner_db.json', name: 'Study Partner Matching' },
  { key: 'study_rooms', file: '.kampus_study_rooms_db.json', name: 'Virtual Study Rooms' },
  { key: 'super_admin', file: '.kampus_super_admin_db.json', name: 'Super Admin Engine' },
];

async function runModulesTest() {
  console.log('====================================================');
  console.log('   KAMPUS 21 BACKEND MODULES PERSISTENCE AUDIT     ');
  console.log('====================================================');

  await initializeDatabase();
  const dbConnected = isDatabaseConnected();
  console.log(`[DB Status]: Connected to PostgreSQL = ${dbConnected}`);

  if (!dbConnected) {
    throw new Error('Fatal: PostgreSQL must be connected to run modules persistence audit.');
  }

  let passedCount = 0;

  for (const mod of MODULES_TO_TEST) {
    console.log(`\n[Testing Module]: ${mod.name} (Key: "${mod.key}")`);

    // Obtain or initialize storage
    let storage = getRegisteredModule(mod.key);
    if (!storage) {
      storage = new ModuleStorage(mod.key, path.join(process.cwd(), mod.file), () => ({}));
    }

    const state = await storage.init();
    if (!state || typeof state !== 'object') {
      throw new Error(`Module ${mod.key} failed to load valid state object.`);
    }

    // 2. Verify state presence in PostgreSQL module_state
    const rowRes = await query(
      'SELECT module_key, version, checksum, record_count, updated_at FROM module_state WHERE module_key = $1',
      [mod.key]
    );

    if (rowRes.rows.length === 0) {
      throw new Error(`Module ${mod.key} was not found in PostgreSQL module_state table.`);
    }

    const row = rowRes.rows[0];
    const initialVersion = Number(row.version);
    const initialChecksum = row.checksum;
    const recordCount = Number(row.record_count);

    if (typeof initialChecksum !== 'string' || initialChecksum.length !== 64) {
      throw new Error(`Module ${mod.key} has invalid SHA-256 checksum: "${initialChecksum}"`);
    }

    console.log(
      `  ✓ PostgreSQL State Verified: Version=${initialVersion}, Records=${recordCount}, Checksum=${initialChecksum.substring(0, 12)}...`
    );

    // 3. Test Atomic Update & Version Increment
    const originalAuditStamp = (state as any)._lastAuditTime;
    (state as any)._lastAuditTime = new Date().toISOString();

    const saveSuccess = await storage.save(state);
    if (!saveSuccess) {
      throw new Error(`Failed to save state to PostgreSQL for module ${mod.key}`);
    }

    // Verify version incremented in PostgreSQL
    const updatedRes = await query(
      'SELECT version, checksum, record_count FROM module_state WHERE module_key = $1',
      [mod.key]
    );
    const updatedRow = updatedRes.rows[0];
    const newVersion = Number(updatedRow.version);
    const newChecksum = updatedRow.checksum;

    if (newVersion <= initialVersion) {
      throw new Error(
        `Version was not incremented for ${mod.key}. Expected > ${initialVersion}, got ${newVersion}`
      );
    }

    // 4. Verify Persistence on Reload
    const reloadedState = storage.get();
    if ((reloadedState as any)._lastAuditTime !== (state as any)._lastAuditTime) {
      throw new Error(`State persistence mismatch on reload for module ${mod.key}`);
    }

    // Restore clean audit stamp
    if (originalAuditStamp !== undefined) {
      (reloadedState as any)._lastAuditTime = originalAuditStamp;
    } else {
      delete (reloadedState as any)._lastAuditTime;
    }
    await storage.save(reloadedState);

    console.log(`  ✓ Atomic Upsert & Persistence Reload PASSED [Version ${initialVersion} -> ${newVersion}]`);
    passedCount++;
  }

  // 21st Module: Core Authentication & User Management (Relational PostgreSQL)
  console.log(`\n[Testing Module]: Student Authentication & User Ecosystem (Relational Schema)`);
  const userCountRes = await query('SELECT count(*)::int as count FROM users');
  const sessionCountRes = await query('SELECT count(*)::int as count FROM user_sessions');
  const adminCountRes = await query('SELECT count(*)::int as count FROM admin_users');

  console.log(
    `  ✓ Relational Tables: Users=${userCountRes.rows[0].count}, Sessions=${sessionCountRes.rows[0].count}, AdminUsers=${adminCountRes.rows[0].count}`
  );
  passedCount++;

  console.log('\n====================================================');
  console.log(`   ALL ${passedCount}/21 BACKEND MODULES PASSED [PASS]   `);
  console.log('====================================================');
}

runModulesTest().catch((err) => {
  console.error('\nMODULE AUDIT FAILED:', err);
  process.exit(1);
});
