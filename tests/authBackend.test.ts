import express from 'express';
import { registerAuthBackend } from '../server/authBackend.ts';

async function runAuthTests() {
  console.log('--- Running KAMPUS Authentication Backend Unit Tests ---');
  const app = express();
  app.use(express.json());
  registerAuthBackend(app);

  // We test the endpoints by calling them using fetch against a local test server
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Test Send OTP
    console.log('[Test 1] POST /api/auth/send-otp for student login...');
    const sendOtpRes = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.verma@kampus.edu.in', purpose: 'login' }),
    });
    const sendOtpData = await sendOtpRes.json();
    console.log('Result:', sendOtpData);
    if (!sendOtpData.success) throw new Error('Send OTP failed: ' + JSON.stringify(sendOtpData));

    // 2. Test Invalid OTP rejection
    console.log('[Test 2] POST /api/auth/verify-otp with incorrect OTP...');
    const failOtpRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.verma@kampus.edu.in', code: '000000', purpose: 'login' }),
    });
    const failOtpData = await failOtpRes.json();
    console.log('Result (expected failure):', failOtpData);
    if (failOtpData.success) throw new Error('Expected invalid OTP rejection!');

    // 3. Test Student Registration with Password
    console.log('[Test 3] POST /api/auth/register...');
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Aarav Gupta',
        email: `aarav.${Date.now()}@iitb.ac.in`,
        password: 'securePassword2026!',
        mobile: '+91 98765 12345',
        college: 'IIT Bombay',
        course: 'B.Tech AI',
        branch: 'Computer Science',
        semester: '4',
        interests: ['Artificial Intelligence', 'Competitive Programming'],
        skills: ['Python', 'PyTorch', 'TypeScript'],
      }),
    });
    const regData = await regRes.json();
    console.log('Result:', { success: regData.success, userId: regData.user?.userId, tokenGenerated: Boolean(regData.token) });
    if (!regData.success || !regData.token) throw new Error('Registration failed!');

    // 4. Test Student Login with Password
    console.log('[Test 4] POST /api/auth/login-password...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regData.user.email,
        password: 'securePassword2026!',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Result:', { success: loginData.success, name: loginData.user?.fullName });
    if (!loginData.success) throw new Error('Password Login failed!');

    console.log('>>> ALL AUTHENTICATION BACKEND TESTS PASSED SUCCESSFULLY! <<<');
  } finally {
    server.close();
  }
}

runAuthTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
