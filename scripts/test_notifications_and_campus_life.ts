import assert from 'assert';

async function runTestSuite() {
  console.log('--- STARTING NOTIFICATIONS & CAMPUS LIFE FULL-STACK TEST SUITE ---');
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
  const testUserId = `test_scholar_${Date.now()}`;

  // 1. Notifications - List & Seed
  console.log('1. Testing GET /api/notifications with automated seeding...');
  const notifsRes = await fetch(`${baseUrl}/api/notifications?userId=${testUserId}`);
  assert.strictEqual(notifsRes.status, 200, 'GET /api/notifications should return 200');
  const notifsData = await notifsRes.json();
  assert(Array.isArray(notifsData.notifications), 'notifications must be an array');
  assert(notifsData.notifications.length >= 5, 'seeded notifications should contain at least 5 items');
  console.log(`✓ Fetched ${notifsData.notifications.length} notifications (Unread: ${notifsData.unreadCount})`);

  // 2. Unread Count Endpoint
  console.log('2. Testing GET /api/notifications/unread-count...');
  const countRes = await fetch(`${baseUrl}/api/notifications/unread-count?userId=${testUserId}`);
  assert.strictEqual(countRes.status, 200, 'unread-count should return 200');
  const countData = await countRes.json();
  assert.strictEqual(typeof countData.unreadCount, 'number', 'unreadCount must be a number');
  console.log(`✓ Unread count verified: ${countData.unreadCount}`);

  // 3. Mark Single as Read
  const unreadItem = notifsData.notifications.find((n: any) => !n.read);
  if (unreadItem) {
    console.log(`3. Testing PATCH /api/notifications/${unreadItem.id}/read...`);
    const readRes = await fetch(`${baseUrl}/api/notifications/${unreadItem.id}/read?userId=${testUserId}`, {
      method: 'PATCH',
    });
    assert.strictEqual(readRes.status, 200, 'mark read should return 200');
    const readData = await readRes.json();
    assert.strictEqual(readData.notification.read, true, 'item should be marked as read');
    console.log(`✓ Notification ${unreadItem.id} marked as read`);
  }

  // 4. Mark All Read
  console.log('4. Testing PATCH /api/notifications/read-all...');
  const markAllRes = await fetch(`${baseUrl}/api/notifications/read-all?userId=${testUserId}`, {
    method: 'PATCH',
  });
  assert.strictEqual(markAllRes.status, 200, 'mark-all-read should return 200');
  const markAllData = await markAllRes.json();
  assert(markAllData.success, 'mark-all-read should succeed');

  const afterCountRes = await fetch(`${baseUrl}/api/notifications/unread-count?userId=${testUserId}`);
  const afterCount = await afterCountRes.json();
  assert.strictEqual(afterCount.unreadCount, 0, 'unread count after mark-all-read should be 0');
  console.log('✓ Mark all read verified (Unread is now 0)');

  // 5. Preferences
  console.log('5. Testing GET /api/notifications/preferences...');
  const prefRes = await fetch(`${baseUrl}/api/notifications/preferences?userId=${testUserId}`);
  assert.strictEqual(prefRes.status, 200, 'preferences should return 200');
  const prefData = await prefRes.json();
  assert(prefData.preferences, 'preferences object should exist');
  console.log('✓ Preferences loaded successfully');

  // 6. Campus Life - Overview
  console.log('6. Testing GET /api/campus-life/overview...');
  const overviewRes = await fetch(`${baseUrl}/api/campus-life/overview?userId=${testUserId}`);
  assert.strictEqual(overviewRes.status, 200, 'campus-life overview should return 200');
  const overview = await overviewRes.json();
  assert(overview.featuredEvent, 'featuredEvent must exist');
  assert(Array.isArray(overview.events), 'events must be array');
  assert(Array.isArray(overview.clubs), 'clubs must be array');
  assert(Array.isArray(overview.announcements), 'announcements must be array');
  assert(Array.isArray(overview.lostAndFound), 'lostAndFound must be array');
  console.log(`✓ Campus life overview loaded: ${overview.events.length} events, ${overview.clubs.length} clubs, ${overview.announcements.length} notices`);

  // 7. Event Registration & Capacity Validation & Cross-Module Notification
  const targetEvent = overview.events[0];
  console.log(`7. Testing POST /api/campus-life/events/${targetEvent.id}/register...`);
  const initialRegistered = targetEvent.registeredCount;
  const regRes = await fetch(`${baseUrl}/api/campus-life/events/${targetEvent.id}/register?userId=${testUserId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'Test Student Scholar', userId: testUserId }),
  });
  assert.strictEqual(regRes.status, 200, 'event register should return 200');
  const regData = await regRes.json();
  assert.strictEqual(regData.event.registeredCount, initialRegistered + 1, 'seat count should increment by 1');
  assert.strictEqual(regData.event.isRegistered, true, 'isRegistered should be true');

  // Verify automatic notification was created for user
  const notifsAfterReg = await fetch(`${baseUrl}/api/notifications?userId=${testUserId}`);
  const notifsAfterData = await notifsAfterReg.json();
  const regNotif = notifsAfterData.notifications.find((n: any) =>
    n.title.includes(targetEvent.title) && n.category === 'Campus'
  );
  assert(regNotif, 'cross-module notification must be generated on event registration');
  console.log(`✓ Registration confirmed & cross-module notification created: "${regNotif.title}"`);

  // 8. Event Duplicate Registration Prevention
  console.log('8. Testing duplicate registration prevention...');
  const dupRegRes = await fetch(`${baseUrl}/api/campus-life/events/${targetEvent.id}/register?userId=${testUserId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'Test Student Scholar', userId: testUserId }),
  });
  assert.strictEqual(dupRegRes.status, 400, 'duplicate register should return 400');
  console.log('✓ Duplicate registration correctly rejected with 400');

  // 9. Event Registration Cancellation
  console.log(`9. Testing POST /api/campus-life/events/${targetEvent.id}/cancel...`);
  const cancelRes = await fetch(`${baseUrl}/api/campus-life/events/${targetEvent.id}/cancel?userId=${testUserId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUserId }),
  });
  assert.strictEqual(cancelRes.status, 200, 'cancel registration should return 200');
  const cancelData = await cancelRes.json();
  assert.strictEqual(cancelData.event.registeredCount, initialRegistered, 'seat count should decrement back');
  console.log('✓ Event registration cancelled & seat restored');

  // 10. Club Join & Notification
  const targetClub = overview.clubs[0];
  console.log(`10. Testing POST /api/campus-life/clubs/${targetClub.id}/join...`);
  const clubRes = await fetch(`${baseUrl}/api/campus-life/clubs/${targetClub.id}/join?userId=${testUserId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'Test Student Scholar', userId: testUserId }),
  });
  assert.strictEqual(clubRes.status, 200, 'join club should return 200');
  const clubData = await clubRes.json();
  assert.strictEqual(clubData.club.isMember, true, 'isMember should be true');
  console.log(`✓ Joined club "${targetClub.name}" successfully`);

  // 11. Lost & Found Reporting & Resolution
  console.log('11. Testing POST /api/campus-life/lost-found report item...');
  const lfReportRes = await fetch(`${baseUrl}/api/campus-life/lost-found?userId=${testUserId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Water Bottle with NASA Sticker',
      description: 'Navy blue stainless steel flask left in Seminar Hall 2',
      type: 'Found',
      category: 'Accessories',
      location: 'Seminar Hall 2',
      reporterName: 'Test Student Scholar',
      reporterContact: 'Hostel 3, Room 101',
      userId: testUserId,
    }),
  });
  assert.strictEqual(lfReportRes.status, 201, 'reporting lost item should return 201');
  const lfReportData = await lfReportRes.json();
  assert(lfReportData.item?.id, 'item id should be returned');
  console.log(`✓ Reported Lost & Found item: ${lfReportData.item.title} (ID: ${lfReportData.item.id})`);

  console.log(`12. Testing PATCH /api/campus-life/lost-found/${lfReportData.item.id}/resolve...`);
  const lfResolveRes = await fetch(`${baseUrl}/api/campus-life/lost-found/${lfReportData.item.id}/resolve?userId=${testUserId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: testUserId }),
  });
  assert.strictEqual(lfResolveRes.status, 200, 'resolve should return 200');
  const lfResolveData = await lfResolveRes.json();
  assert.strictEqual(lfResolveData.item.status, 'Resolved', 'status should be Resolved');
  console.log('✓ Item marked as resolved successfully');

  console.log('================================================================');
  console.log('🎉 ALL NOTIFICATIONS & CAMPUS LIFE TESTS PASSED FLAWLESSLY! 🎉');
  console.log('================================================================');
}

runTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
