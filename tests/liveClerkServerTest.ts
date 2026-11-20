async function runLiveTest() {
  const baseUrl = 'http://127.0.0.1:3000';
  console.log('=== KAMPUS LIVE SERVER & CLERK END-TO-END VERIFICATION ===\n');

  // 1. Clerk Config
  console.log('[1] Checking Clerk Configuration Status...');
  const cfgRes = await fetch(`${baseUrl}/api/auth/clerk-config`);
  const cfg = await cfgRes.json();
  console.log('  Status:', cfgRes.status, '| Config:', cfg);
  if (!cfg.isConfigured || !cfg.publishableKey) {
    throw new Error('Clerk is not reported as configured on the server');
  }
  console.log('  ✓ Clerk Live Mode is Active with Publishable Key:', cfg.publishableKey);

  // 2. Profile Synchronization
  console.log('\n[2] Testing Clerk Profile Sync (/api/auth/sync-profile)...');
  const clerkUserId = 'user_2clerk_live_' + Date.now().toString(36);
  const studentEmail = `student_${Date.now().toString(36)}@kampus.edu.in`;
  const syncRes = await fetch(`${baseUrl}/api/auth/sync-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clerkId: clerkUserId,
      email: studentEmail,
      fullName: 'Aarav Mehta',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      college: 'Indian Institute of Technology, Bombay',
      course: 'B.Tech Computer Science & AI',
      branch: 'Computer Science',
      semester: 'Semester 6',
      enrollmentNo: '22B030149',
      bio: 'Distributed Systems & ML Researcher at IIT Bombay',
      interests: ['Artificial Intelligence', 'Operating Systems', 'Robotics'],
    }),
  });
  const syncData = await syncRes.json();
  console.log('  Status:', syncRes.status);
  console.log('  User Synchronized:', syncData.user?.fullName);
  console.log('  Clerk ID Linked:', syncData.user?.clerkId);
  console.log('  Token Generated:', !!syncData.token);
  if (!syncRes.ok || !syncData.success || !syncData.token) {
    throw new Error('Profile synchronization failed');
  }
  console.log('  ✓ Clerk user ID successfully mapped to KAMPUS profile.');

  // 3. Authenticated /api/auth/me
  console.log('\n[3] Testing Authenticated Profile Fetch (/api/auth/me)...');
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${syncData.token}` },
  });
  const meData = await meRes.json();
  console.log('  Status:', meRes.status);
  console.log('  Returned Profile Email:', meData.user?.email);
  console.log('  Returned Profile College:', meData.user?.college);
  if (!meRes.ok || !meData.success || meData.user?.email !== studentEmail) {
    throw new Error('Failed to retrieve profile via authenticated Bearer token');
  }
  console.log('  ✓ Server-side session verification succeeded.');

  // 4. Student Onboarding Completion & Direct Account Identity Check
  console.log('\n[4] Testing Student Onboarding Completion & Non-Demo Isolation (/api/auth/complete-onboarding)...');
  const userTestEmail = 'kumark04906@gmail.com';
  const userTestName = 'Kumar Saurav';
  const customClerkId = 'user_2clerk_user_' + Date.now().toString(36);

  // Sync profile for direct user
  const syncCustomRes = await fetch(`${baseUrl}/api/auth/sync-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clerkId: customClerkId,
      email: userTestEmail,
      fullName: userTestName,
      college: 'GLA UNIVERSITY',
      course: 'B.Tech Computer Science',
      semester: 'Semester 3',
      enrollmentNo: '12515000831',
    }),
  });
  const syncCustomData = await syncCustomRes.json();
  console.log('  Status (Direct User Sync):', syncCustomRes.status);
  console.log('  Direct User Name:', syncCustomData.user?.fullName);
  console.log('  Direct User Email:', syncCustomData.user?.email);
  if (syncCustomData.user?.fullName !== userTestName || syncCustomData.user?.email !== userTestEmail) {
    throw new Error(`Profile sync returned incorrect user info: ${JSON.stringify(syncCustomData.user)}`);
  }

  // Complete onboarding for this direct user
  const onboardRes = await fetch(`${baseUrl}/api/auth/complete-onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: syncCustomData.user.userId,
      clerkId: customClerkId,
      fullName: userTestName,
      email: userTestEmail,
      onboardingData: {
        hostel: 'Hostel 3, Room 102',
        college: 'GLA UNIVERSITY',
        enrollmentNo: '12515000831',
        course: 'B.Tech Computer Science',
        semester: 'Semester 3',
        bio: 'Passionate student navigating campus life & academic excellence.',
      },
    }),
  });
  const onboardData = await onboardRes.json();
  console.log('  Status (Direct User Onboard):', onboardRes.status);
  console.log('  hasCompletedOnboarding:', onboardData.user?.hasCompletedOnboarding);
  console.log('  College saved:', onboardData.user?.college);
  console.log('  Full Name saved:', onboardData.user?.fullName);
  console.log('  Email saved:', onboardData.user?.email);
  if (onboardData.user?.fullName !== userTestName || onboardData.user?.email !== userTestEmail) {
    throw new Error(`Onboarding contaminated profile with wrong identity: ${JSON.stringify(onboardData.user)}`);
  }
  if (onboardData.user?.userId === 'usr_22b030149') {
    throw new Error('Onboarding incorrectly assigned demo user ID usr_22b030149 to a real user!');
  }
  console.log('  ✓ User account directly created with their own name, email, and college.');

  // 5. Audit Sample Existing Modules
  console.log('\n[5] Auditing Existing Application Modules...');
  const endpoints = [
    '/api/studyhub/bootstrap',
    '/api/community/bootstrap',
    '/api/notes-exchange/bootstrap',
    '/api/study-partner/bootstrap',
    '/api/public/site-config',
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${baseUrl}${ep}`);
    console.log(`  ${ep} -> HTTP ${res.status}`);
    if (!res.ok) throw new Error(`Module endpoint ${ep} failed with ${res.status}`);
  }
  console.log('  ✓ Existing application modules are preserved and responsive.');

  console.log('\n=============================================================');
  console.log('>>> ALL VERIFICATION CHECKS PASSED: CLERK INTEGRATION 100% OPERATIONAL! <<<');
  console.log('=============================================================');
}

runLiveTest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
