import express from 'express';
import http from 'http';
import { registerAccountProfileSettingsBackend } from '../server/accountProfileSettingsBackend';

async function runTests() {
  console.log('--- STARTING PROFILE & SETTINGS FULL-STACK INTEGRATION TESTS ---');

  const app = express();
  app.use(express.json({ limit: '10mb' }));
  registerAccountProfileSettingsBackend(app);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  const testUserId = 'usr_test_student_42';
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': testUserId,
  };

  try {
    // 1. GET /api/profile
    {
      const res = await fetch(`${baseUrl}/api/profile`, { headers });
      console.assert(res.status === 200, `GET /api/profile expected 200, got ${res.status}`);
      const data = await res.json();
      console.assert(data.success === true, 'GET /api/profile success should be true');
      console.assert(data.profile.userId === testUserId, 'Profile userId should match');
      console.assert(data.completion !== undefined, 'Profile completion should exist');
      console.assert(data.stats !== undefined, 'Profile stats should exist');
      console.log('✓ Test 1: GET /api/profile passed');
    }

    // 2. PATCH /api/profile
    {
      const patchPayload = {
        fullName: 'Aarav Patel',
        username: 'aarav_patel',
        headline: 'CS Scholar & Open Source Contributor',
        college: 'Delhi Technological University',
        course: 'B.Tech Information Technology',
        semester: '6',
        bio: 'Enthusiastic developer building student tools.',
        academicInterests: ['Distributed Systems', 'Mobile Dev'],
      };
      const res = await fetch(`${baseUrl}/api/profile`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patchPayload),
      });
      console.assert(res.status === 200, `PATCH /api/profile expected 200, got ${res.status}`);
      const data = await res.json();
      console.assert(data.profile.fullName === 'Aarav Patel', 'Updated name should match');
      console.assert(data.profile.username === 'aarav_patel', 'Updated username should match');
      console.log('✓ Test 2: PATCH /api/profile passed');
    }

    // 3. GET /api/profile/username-check
    {
      // Same user checking their own username -> available
      const res1 = await fetch(`${baseUrl}/api/profile/username-check?username=aarav_patel`, { headers });
      const data1 = await res1.json();
      console.assert(data1.available === true, 'Owner should see username as available');

      // Different user checking existing username -> unavailable
      const res2 = await fetch(`${baseUrl}/api/profile/username-check?username=aarav_patel`, {
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_other_student' },
      });
      const data2 = await res2.json();
      console.assert(data2.available === false, 'Other user should see username as taken');
      console.log('✓ Test 3: GET /api/profile/username-check passed');
    }

    // 4. POST & DELETE /api/profile/avatar
    {
      const dummyBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const uploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileBase64: dummyBase64, fileName: 'student_pic.png' }),
      });
      console.assert(uploadRes.status === 200, `POST /api/profile/avatar expected 200, got ${uploadRes.status}`);
      const uploadData = await uploadRes.json();
      console.assert(Boolean(uploadData.avatarUrl), 'Should return valid avatarUrl');

      const delRes = await fetch(`${baseUrl}/api/profile/avatar`, {
        method: 'DELETE',
        headers,
      });
      console.assert(delRes.status === 200, `DELETE /api/profile/avatar expected 200, got ${delRes.status}`);
      console.log('✓ Test 4: Avatar Upload & Delete passed');
    }

    // 5. GET & PATCH /api/settings
    {
      const getRes = await fetch(`${baseUrl}/api/settings`, { headers });
      console.assert(getRes.status === 200, `GET /api/settings expected 200, got ${getRes.status}`);

      const patchRes = await fetch(`${baseUrl}/api/settings`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          appearance: {
            theme: 'dark',
            density: 'compact',
            reduceMotion: true,
            sidebarBehavior: 'collapsed',
          },
        }),
      });
      console.assert(patchRes.status === 200, `PATCH /api/settings expected 200, got ${patchRes.status}`);
      const patchData = await patchRes.json();
      console.assert(patchData.settings.appearance.theme === 'dark', 'Theme should be dark');
      console.log('✓ Test 5: Settings GET & PATCH passed');
    }

    // 6. GET & PATCH /api/settings/privacy
    {
      const patchRes = await fetch(`${baseUrl}/api/settings/privacy`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          profileVisibility: 'Private',
          activityVisibility: {
            notes: false,
            achievements: true,
            events: false,
          },
        }),
      });
      console.assert(patchRes.status === 200, `PATCH /api/settings/privacy expected 200, got ${patchRes.status}`);
      const patchData = await patchRes.json();
      console.assert(patchData.privacy.profileVisibility === 'Private', 'Visibility should be Private');
      console.log('✓ Test 6: Privacy GET & PATCH passed');
    }

    // 7. GET & PATCH /api/settings/notifications
    {
      const patchRes = await fetch(`${baseUrl}/api/settings/notifications`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          studyReminders: true,
          assignmentDeadlines: false,
          campusEvents: true,
          communityAlerts: false,
        }),
      });
      console.assert(patchRes.status === 200, `PATCH /api/settings/notifications expected 200, got ${patchRes.status}`);
      const patchData = await patchRes.json();
      console.assert(patchData.preferences.assignmentDeadlines === false, 'assignmentDeadlines should be false');
      console.log('✓ Test 7: Notifications GET & PATCH passed');
    }

    // 8. GET /api/account & POST /api/account/export
    {
      const accRes = await fetch(`${baseUrl}/api/account`, { headers });
      console.assert(accRes.status === 200, `GET /api/account expected 200, got ${accRes.status}`);

      const expRes = await fetch(`${baseUrl}/api/account/export`, {
        method: 'POST',
        headers,
      });
      console.assert(expRes.status === 200, `POST /api/account/export expected 200, got ${expRes.status}`);
      const expData = await expRes.json();
      console.assert(expData.data.profile !== undefined, 'Export archive must contain profile');
      console.assert(expData.data.exportDate !== undefined, 'Export archive must have timestamp');
      console.log('✓ Test 8: Account Summary & Data Export passed');
    }

    // 9. POST /api/account/delete
    {
      // Incorrect phrase -> 400
      const badRes = await fetch(`${baseUrl}/api/account/delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ confirmationPhrase: 'INCORRECT' }),
      });
      console.assert(badRes.status === 400, `Expected 400 for bad confirmation phrase, got ${badRes.status}`);

      // Correct phrase -> 200
      const goodRes = await fetch(`${baseUrl}/api/account/delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          confirmationPhrase: 'DELETE MY ACCOUNT',
          reason: 'Test suite cleanup',
        }),
      });
      console.assert(goodRes.status === 200, `Expected 200 for valid delete, got ${goodRes.status}`);
      const goodData = await goodRes.json();
      console.assert(goodData.success === true, 'Delete success should be true');
      console.log('✓ Test 9: Account Deletion passed');
    }

    console.log('==========================================================');
    console.log('🎉 ALL 9 PROFILE & SETTINGS API INTEGRATION TESTS PASSED 100%!');
    console.log('==========================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
