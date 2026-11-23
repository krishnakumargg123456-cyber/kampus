import express from 'express';
import { createServer } from 'http';
import { registerKampusAiBackend } from '../server/kampusAiBackend.ts';

const app = express();
app.use(express.json({ limit: '16mb' }));
registerKampusAiBackend(app);

const server = createServer(app);

async function runAiTests() {
  const PORT = 4923;
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  const baseUrl = `http://localhost:${PORT}`;

  console.log('=== KAMPUS AI FULL-STACK INTEGRATION TEST ===');

  const userA = `stu_ai_a_${Date.now()}`;
  const userB = `stu_ai_b_${Date.now()}`;

  // 1. Status Check
  const resStatus = await fetch(`${baseUrl}/api/ai/status`);
  if (!resStatus.ok) throw new Error('AI status check failed');
  const statusJson = await resStatus.json();
  console.log('✓ AI Status: success =', statusJson.success, 'Available:', statusJson.available);

  // 2. Create conversation for User A
  const resConvA = await fetch(`${baseUrl}/api/ai/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userA, title: 'Calculus III Optimization Study', mode: 'study' }),
  });
  if (!resConvA.ok) throw new Error('Create conv failed');
  const convAJson = await resConvA.json();
  const convIdA = convAJson.conversation.id;
  console.log('✓ Created Conversation for User A:', convIdA, convAJson.conversation.title);

  // 3. User A lists conversations
  const resListA = await fetch(`${baseUrl}/api/ai/conversations?userId=${encodeURIComponent(userA)}`);
  const listAJson = await resListA.json();
  if (listAJson.conversations.length !== 1 || listAJson.conversations[0].id !== convIdA) {
    throw new Error('User A conversation listing mismatch');
  }
  console.log('✓ User A has 1 conversation listed');

  // 4. User B cannot see User A's conversation (User Isolation)
  const resListB = await fetch(`${baseUrl}/api/ai/conversations?userId=${encodeURIComponent(userB)}`);
  const listBJson = await resListB.json();
  if (listBJson.conversations.length !== 0) {
    throw new Error('Privacy breach: User B can see conversations of User A');
  }
  console.log('✓ Verified User Isolation: User B sees 0 conversations');

  // 5. User B cannot access User A's conversation details (IDOR check)
  const resGetAByB = await fetch(`${baseUrl}/api/ai/conversations/${convIdA}?userId=${encodeURIComponent(userB)}`);
  if (resGetAByB.status !== 403 && resGetAByB.status !== 404) {
    throw new Error(`Expected 403/404 when User B accesses User A conv, got ${resGetAByB.status}`);
  }
  console.log('✓ IDOR Protection: User B prevented from accessing User A conversation');

  // 6. Document extraction endpoint
  const sampleText = 'Fourier series represents periodic functions as sums of sines and cosines.';
  const sampleBase64 = Buffer.from(sampleText).toString('base64');
  const resDoc = await fetch(`${baseUrl}/api/ai/extract-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userA,
      fileName: 'fourier_notes.txt',
      mimeType: 'text/plain',
      base64Data: sampleBase64,
    }),
  });
  if (!resDoc.ok) throw new Error('Document extraction failed');
  const docJson = await resDoc.json();
  if (!docJson.extractedText.includes('Fourier series')) {
    throw new Error('Extracted text does not match input document');
  }
  console.log('✓ Document text extraction passed:', docJson.fileName, `(${docJson.extractedText.length} chars)`);

  // 7. Message Feedback endpoint
  const resFeed = await fetch(`${baseUrl}/api/ai/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userA,
      messageId: `msg_${Date.now()}`,
      rating: 'up',
      comment: 'Very helpful explanation of Lagrange multipliers.',
    }),
  });
  if (!resFeed.ok) throw new Error('Feedback submission failed');
  console.log('✓ Message rating & feedback saved successfully');

  // 8. Delete Conversation
  const resDel = await fetch(`${baseUrl}/api/ai/conversations/${convIdA}?userId=${encodeURIComponent(userA)}`, {
    method: 'DELETE',
  });
  if (!resDel.ok) throw new Error('Delete conv failed');
  console.log('✓ Conversation deleted successfully');

  console.log('\n🎉 ALL 8 KAMPUS AI FULL-STACK TESTS PASSED 100%!');
  server.close();
  process.exit(0);
}

runAiTests().catch((err) => {
  console.error('❌ AI Test Failed:', err);
  server.close();
  process.exit(1);
});
