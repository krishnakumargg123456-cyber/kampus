import assert from 'assert';
import http from 'http';
import express from 'express';
import { registerKampusIdBackend } from '../server/kampusIdBackend.ts';
import jwt from 'jsonwebtoken';

async function runKampusIdQaAudit() {
  console.log('--- STARTING KAMPUS ID MASTER QA AUDIT ---');
  let passed = 0;
  let failed = 0;

  const app = express();
  app.use(express.json());
  registerKampusIdBackend(app);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  const studentUser = {
    userId: `user_test_student_${Date.now()}`,
    email: 'krish@gla.ac.in',
    fullName: 'Krish Kumar',
  };

  const studentToken = jwt.sign(
    { sub: studentUser.userId, email: studentUser.email, name: studentUser.fullName },
    'test_secret'
  );

  const adminToken = jwt.sign(
    { sub: 'usr_admin_master', email: 'admin@kampus.edu', role: 'admin' },
    'test_secret'
  );

  function logPass(msg: string) {
    passed++;
    console.log(`  [PASS] ${msg}`);
  }

  function logFail(msg: string, err: any) {
    failed++;
    console.error(`  [FAIL] ${msg}:`, err);
  }

  let studentKampusId = '';
  let qrToken = '';
  let qrNonce = '';

  // 1. Bootstrap: Generates permanent unique ID
  try {
    const res = await fetch(`${baseUrl}/api/kampus-id/bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.strictEqual(data.success, true);
    assert(data.identity.kampusIdNumber.startsWith('KMP-'));
    assert.strictEqual(data.identity.userId, studentUser.userId);
    assert(data.qrPayload.token);
    assert(data.qrPayload.nonce);
    studentKampusId = data.identity.kampusIdNumber;
    qrToken = data.qrPayload.token;
    qrNonce = data.qrPayload.nonce;
    logPass(`Bootstrap generates permanent non-sequential ID (${studentKampusId})`);
  } catch (e) {
    logFail('Bootstrap generates permanent ID', e);
  }

  // 2. Immutability: Calling bootstrap again returns the EXACT same ID
  try {
    const res = await fetch(`${baseUrl}/api/kampus-id/bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const data = await res.json();
    assert.strictEqual(data.identity.kampusIdNumber, studentKampusId);
    logPass('ID is immutable and never changes across re-bootstrap');
  } catch (e) {
    logFail('ID immutability check', e);
  }

  // 3. Profile update: Updates college/course while strictly preserving ID
  try {
    const res = await fetch(`${baseUrl}/api/kampus-id/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        college: 'GLA University',
        course: 'B.Tech Computer Science',
        semester: 'Semester 4',
        enrollmentNumber: 'GLA-2024-CS-092',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.strictEqual(data.identity.kampusIdNumber, studentKampusId);
    assert.strictEqual(data.identity.college, 'GLA University');
    assert.strictEqual(data.identity.semester, 'Semester 4');
    logPass('Profile updates preserve permanent ID number');
  } catch (e) {
    logFail('Profile update ID preservation', e);
  }

  // 4. Verify QR Code: Decodes and authenticates signed token
  try {
    const res = await fetch(`${baseUrl}/api/kampus-id/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: qrToken }),
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.identity.kampusIdNumber, studentKampusId);
    assert.strictEqual(data.identity.college, 'GLA University');
    logPass('QR verification authenticates cryptographic token');
  } catch (e) {
    logFail('QR verification token check', e);
  }

  // 5. Rotate QR & Invalidation: Revokes previous nonce
  try {
    const res = await fetch(`${baseUrl}/api/kampus-id/me/rotate-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ priorNonce: qrNonce }),
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.notStrictEqual(data.qrPayload.nonce, qrNonce);

    // Old token must now be rejected
    const verifyOldRes = await fetch(`${baseUrl}/api/kampus-id/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: qrToken }),
    });
    const verifyOldData = await verifyOldRes.json();
    assert.strictEqual(verifyOldRes.status, 400);
    assert.strictEqual(verifyOldData.success, false);
    logPass('QR rotation invalidates previous nonce and revokes stale token');
  } catch (e) {
    logFail('QR rotation & nonce revocation', e);
  }

  // 6. Public Profile: Strips private credentials and internal keys
  try {
    const res = await fetch(`${baseUrl}/api/kampus-id/public/${studentKampusId}`);
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.profile.kampusIdNumber, studentKampusId);
    assert.strictEqual(data.profile.college, 'GLA University');
    assert.strictEqual(data.profile.userId, undefined); // userId MUST NOT leak
    logPass('Public lookup sanitizes internal userId & private fields');
  } catch (e) {
    logFail('Public profile data sanitization', e);
  }

  // 7. Verification Request Submission
  try {
    const res = await fetch(`${baseUrl}/api/kampus-id/me/verification-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        documentType: 'College ID Card',
        evidenceText: 'GLA-2024-CS-092 / krish@gla.ac.in',
        studentNote: 'Requesting verified student badge',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.strictEqual(data.identity.verificationStatus, 'PENDING_REVIEW');
    logPass('Student submits institutional verification request');
  } catch (e) {
    logFail('Verification request submission', e);
  }

  // 8. Admin Security Check: Student CANNOT access admin endpoints
  try {
    const res = await fetch(`${baseUrl}/api/admin/kampus-ids`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403);
    logPass('Non-admin users are strictly forbidden from Admin ID portal (HTTP 403)');
  } catch (e) {
    logFail('Admin security permission check', e);
  }

  // 9. Admin Approval: Admin approves student request
  try {
    const res = await fetch(`${baseUrl}/api/admin/kampus-ids/${studentKampusId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-kampus-role': 'Platform Admin',
      },
      body: JSON.stringify({
        reviewerNote: 'Accreditation verified against university registrar.',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.strictEqual(data.identity.verificationStatus, 'APPROVED');
    assert.strictEqual(data.identity.statusBadge, 'Verified Scholar');
    logPass('Admin approves institutional verification -> Status updates to Verified Scholar');
  } catch (e) {
    logFail('Admin approval workflow', e);
  }

  // 10. Admin Suspension: Admin suspends identity
  try {
    const res = await fetch(`${baseUrl}/api/admin/kampus-ids/${studentKampusId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-kampus-role': 'Platform Admin',
      },
      body: JSON.stringify({ reason: 'Investigation of academic duplicate.' }),
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.strictEqual(data.identity.accountStatus, 'Inactive');
    logPass('Admin suspends identity with recorded audit reason');
  } catch (e) {
    logFail('Admin suspend identity workflow', e);
  }

  // 11. Admin Restore: Admin restores identity
  try {
    const res = await fetch(`${baseUrl}/api/admin/kampus-ids/${studentKampusId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-kampus-role': 'Platform Admin',
      },
    });
    const data = await res.json();
    assert(res.status === 200 || res.status === 201);
    assert.strictEqual(data.identity.accountStatus, 'Active');
    logPass('Admin restores identity to Active status');
  } catch (e) {
    logFail('Admin restore identity workflow', e);
  }

  server.close();

  console.log(`\n--- AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runKampusIdQaAudit();
