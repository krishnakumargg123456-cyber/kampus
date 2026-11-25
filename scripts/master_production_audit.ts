import express from 'express';
import { createServer as createHttpServer } from 'http';
import { initializeDatabase } from '../database/db.ts';
import { initializeAllModules } from '../database/moduleStorage.ts';
import { registerAuthBackend } from '../server/authBackend.ts';
import { registerAccountProfileSettingsBackend } from '../server/accountProfileSettingsBackend.ts';
import { registerStudyHubBackend } from '../server/studyHubBackend.ts';
import { registerMarketBackend } from '../server/marketBackend.ts';
import { registerCareerBackend } from '../server/careerBackend.ts';
import { registerCampusLifeBackend } from '../server/campusLifeBackend.ts';
import { registerNotificationsBackend } from '../server/notificationsBackend.ts';
import { registerKampusAiBackend } from '../server/kampusAiBackend.ts';

const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 KAMPUS FINAL MASTER PRODUCTION AUDIT & QA SUITE');
  console.log('====================================================\n');

  process.env.ALLOW_OFFLINE_DB = 'true';
  process.env.PORT = String(PORT);

  const app = express();
  app.use(express.json({ limit: '16mb' }));

  await initializeDatabase();
  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'kampus-api' }));
  registerAuthBackend(app);
  registerAccountProfileSettingsBackend(app);
  registerStudyHubBackend(app);
  registerMarketBackend(app);
  registerCareerBackend(app);
  registerCampusLifeBackend(app);
  registerNotificationsBackend(app);
  registerKampusAiBackend(app);
  await initializeAllModules();

  const server = createHttpServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Server] Live on ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Health & Database check
    console.log('[Phase 1] Auditing System Health & Storage');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthJson.ok === true, 'Service reports ok: true');

    // 2. Profile & Account
    console.log('\n[Phase 2] Auditing Profile & Settings Persistence');
    const userA = 'stu_audit_user_a';
    const profRes = await fetch(`${BASE_URL}/api/profile`, {
      headers: { 'x-user-id': userA },
    });
    const profJson = await profRes.json();
    assert(profRes.status === 200, 'GET /api/profile returns HTTP 200');
    assert(profJson.profile?.userId === userA, 'Profile belongs to User A');

    // Account delete confirmation check
    const delFailRes = await fetch(`${BASE_URL}/api/account/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userA },
      body: JSON.stringify({ confirmationPhrase: 'WRONG' }),
    });
    assert(delFailRes.status === 400, 'Account delete requires exact confirmation phrase');

    // 3. Study Hub Data Isolation
    console.log('\n[Phase 3] Auditing Study Hub User Data Isolation');
    const userB = 'stu_audit_user_b';

    // User A creates a personal note
    const noteCreateRes = await fetch(`${BASE_URL}/api/studyhub/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userA },
      body: JSON.stringify({
        title: 'User A Confidential Note',
        content: 'Personal academic formula',
        subject: 'Algorithms',
      }),
    });
    const noteCreateJson = await noteCreateRes.json();
    assert(noteCreateRes.status === 201, 'User A creates personal note');
    const noteId = noteCreateJson.data.id;

    // User B tries to update User A's note -> must fail 403
    const noteUpdateBRes = await fetch(`${BASE_URL}/api/studyhub/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userB },
      body: JSON.stringify({ title: 'Hacked by User B' }),
    });
    assert(noteUpdateBRes.status === 403, 'User B cannot edit User A private note (HTTP 403)');

    // User B tries to delete User A's note -> must fail 403
    const noteDeleteBRes = await fetch(`${BASE_URL}/api/studyhub/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userB },
    });
    assert(noteDeleteBRes.status === 403, 'User B cannot delete User A private note (HTTP 403)');

    // User A successfully updates their own note
    const noteUpdateARes = await fetch(`${BASE_URL}/api/studyhub/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userA },
      body: JSON.stringify({ title: 'User A Note Updated' }),
    });
    assert(noteUpdateARes.status === 200, 'User A can edit own note');

    // 4. Common Subject Protection
    console.log('\n[Phase 4] Auditing Common vs Personal Subjects Permissions');
    const subjBootstrap = await fetch(`${BASE_URL}/api/studyhub/bootstrap`, {
      headers: { 'x-user-id': userA },
    });
    const subjJson = await subjBootstrap.json();
    assert(subjBootstrap.status === 200, 'GET /api/studyhub/bootstrap returns HTTP 200');
    assert(Array.isArray(subjJson.data.subjects), 'Bootstrap provides visible subjects');

    // User A tries to create a common subject -> must fail 403 (requires Admin)
    const commSubjRes = await fetch(`${BASE_URL}/api/studyhub/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userA },
      body: JSON.stringify({ name: 'Unauthorized Common Subject', isCommon: true }),
    });
    assert(commSubjRes.status === 403, 'Normal student cannot create common subject (HTTP 403)');

    // User A creates a personal subject -> succeeds 201
    const persSubjRes = await fetch(`${BASE_URL}/api/studyhub/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userA },
      body: JSON.stringify({ name: 'User A Elective Subject', isCommon: false }),
    });
    assert(persSubjRes.status === 201, 'Student can create personal subject (HTTP 201)');
    const persSubjId = (await persSubjRes.json()).data.id;

    // User B cannot delete User A personal subject -> 403
    const delSubjBRes = await fetch(`${BASE_URL}/api/studyhub/subjects/${persSubjId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userB },
    });
    assert(delSubjBRes.status === 403, 'User B cannot delete User A personal subject (HTTP 403)');

    // 5. Market Full-Stack
    console.log('\n[Phase 5] Auditing Market & E-Commerce Workflow');
    const marketListingsRes = await fetch(`${BASE_URL}/api/market/listings`);
    const marketJson = await marketListingsRes.json();
    assert(marketListingsRes.status === 200, 'GET /api/market/listings returns HTTP 200');
    assert(Array.isArray(marketJson.listings), 'Market listings array exists');

    // Cart operations
    const cartRes = await fetch(`${BASE_URL}/api/market/cart?userId=${userA}`);
    assert(cartRes.status === 200, 'GET /api/market/cart returns HTTP 200');

    // 6. KAMPUS AI Health
    console.log('\n[Phase 6] Auditing KAMPUS AI Gateway');
    const aiRes = await fetch(`${BASE_URL}/api/ai/status`, {
      headers: { 'x-user-id': userA },
    });
    assert(aiRes.status === 200, 'GET /api/ai/status returns HTTP 200 without crashes');

    // 7. Campus Life
    console.log('\n[Phase 7] Auditing Campus Life & Events');
    const campusRes = await fetch(`${BASE_URL}/api/campus-life/overview`);
    const campusJson = await campusRes.json();
    assert(campusRes.status === 200, 'GET /api/campus-life/overview returns HTTP 200');
    assert(Array.isArray(campusJson.events), 'Campus Life overview includes real events');

    // 8. Notifications
    console.log('\n[Phase 8] Auditing Notifications Centre');
    const notifCountRes = await fetch(`${BASE_URL}/api/notifications/unread-count?userId=${userA}`);
    assert(notifCountRes.status === 200, 'GET /api/notifications/unread-count returns HTTP 200');

    // 9. Career & Placement
    console.log('\n[Phase 9] Auditing Career & Placement Ecosystem');
    const careerBootRes = await fetch(`${BASE_URL}/api/career/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userA },
      body: JSON.stringify({ userId: userA }),
    });
    const careerJson = await careerBootRes.json();
    assert(careerBootRes.status === 200, 'POST /api/career/bootstrap returns HTTP 200');
    assert(Array.isArray(careerJson.opportunities), 'Career bootstrap returns opportunities list');

    // Apply to opportunity
    if (careerJson.opportunities.length > 0) {
      const targetOpp = careerJson.opportunities[0];
      const applyRes = await fetch(`${BASE_URL}/api/career/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userA },
        body: JSON.stringify({
          userId: userA,
          opportunityId: targetOpp.id,
          roleTitle: targetOpp.title,
          companyName: targetOpp.organizationName,
          consentConfirmed: true,
        }),
      });
      assert(applyRes.status === 201, 'Student application submitted successfully (HTTP 201)');
    }

    console.log('\n====================================================');
    console.log(`📊 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err: any) {
    console.error('Fatal audit error:', err);
    server.close();
    process.exit(1);
  }
}

runAudit();
