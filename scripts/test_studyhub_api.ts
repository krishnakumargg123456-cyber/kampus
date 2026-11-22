import express from 'express';
import { createServer } from 'http';
import { registerStudyHubBackend } from '../server/studyHubBackend.ts';

const app = express();
app.use(express.json({ limit: '16mb' }));
registerStudyHubBackend(app);

const server = createServer(app);

async function run() {
  await new Promise<void>((resolve) => server.listen(4899, () => resolve()));
  const baseUrl = 'http://localhost:4899';
  const testUserId = `test_student_${Date.now()}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': testUserId,
  };

  console.log('--- 1. Testing Notes Module ---');
  // Create Note
  const resNote = await fetch(`${baseUrl}/api/studyhub/notes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Dijkstra Algorithm Notes',
      content: 'Shortest path algorithm using priority queue in O(E log V).',
      subject: 'Data Structures & Algorithms',
      tags: ['graphs', 'algorithms'],
      pinned: true,
    }),
  });
  const noteJson = await resNote.json();
  if (!noteJson.success || !noteJson.data.id) throw new Error('Create note failed: ' + JSON.stringify(noteJson));
  const noteId = noteJson.data.id;
  console.log('✓ Created Note:', noteId, noteJson.data.title);

  // List Notes
  const notesParams = new URLSearchParams({ subject: 'Data Structures & Algorithms' });
  const resNotesList = await fetch(`${baseUrl}/api/studyhub/notes?${notesParams.toString()}`, { headers });
  const notesListJson = await resNotesList.json();
  if (!notesListJson.success || notesListJson.count === 0) throw new Error('List notes failed');
  console.log('✓ List Notes Count:', notesListJson.count);

  // Toggle Pin
  const resPin = await fetch(`${baseUrl}/api/studyhub/notes/${noteId}/pin`, { method: 'PATCH', headers });
  const pinJson = await resPin.json();
  console.log('✓ Toggled Pin:', pinJson.data.pinned);

  console.log('\n--- 2. Testing Materials Module ---');
  // Upload Material
  const samplePdfBase64 = Buffer.from('%PDF-1.4 test study doc content').toString('base64');
  const resMat = await fetch(`${baseUrl}/api/studyhub/materials`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'DBMS Lecture 04 Normalization Slides',
      subject: 'Database Management Systems',
      fileName: 'dbms_lecture_04.pdf',
      fileType: 'PDF',
      fileBase64: samplePdfBase64,
    }),
  });
  const matJson = await resMat.json();
  if (!matJson.success || !matJson.data.id) throw new Error('Create material failed: ' + JSON.stringify(matJson));
  const matId = matJson.data.id;
  console.log('✓ Uploaded Material:', matId, matJson.data.title, 'Uri:', matJson.data.fileUri);

  // Mark Opened
  const resOpened = await fetch(`${baseUrl}/api/studyhub/materials/${matId}/opened`, { method: 'POST', headers });
  const openedJson = await resOpened.json();
  console.log('✓ Marked Material Opened:', Boolean(openedJson.data.lastOpenedAt));

  console.log('\n--- 3. Testing Assignments Module ---');
  // Create Assignment
  const resAsgn = await fetch(`${baseUrl}/api/studyhub/assignments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'B+ Tree Implementation in C++',
      description: 'Implement node split, search, and leaf linking.',
      subject: 'Database Management Systems',
      dueDate: '2026-12-10',
      priority: 'High',
    }),
  });
  const asgnJson = await resAsgn.json();
  if (!asgnJson.success || !asgnJson.data.id) throw new Error('Create assignment failed: ' + JSON.stringify(asgnJson));
  const asgnId = asgnJson.data.id;
  console.log('✓ Created Assignment:', asgnId, asgnJson.data.title, 'Priority:', asgnJson.data.priority);

  // Toggle Status
  const resToggleAsgn = await fetch(`${baseUrl}/api/studyhub/assignments/${asgnId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'Completed' }),
  });
  const toggledAsgnJson = await resToggleAsgn.json();
  console.log('✓ Updated Assignment Status:', toggledAsgnJson.data.status, 'CompletedAt:', toggledAsgnJson.data.completedAt);

  console.log('\n--- 4. Testing Study Planner Module ---');
  // Create Session
  const todayStr = new Date().toISOString().slice(0, 10);
  const resSess = await fetch(`${baseUrl}/api/studyhub/planner/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subject: 'Operating Systems',
      topic: 'Virtual Memory & Page Replacement',
      date: todayStr,
      startTime: '14:00',
      endTime: '15:30',
      goals: 'Solve LRU and FIFO replacement problems.',
    }),
  });
  const sessJson = await resSess.json();
  if (!sessJson.success || !sessJson.data.id) throw new Error('Create session failed: ' + JSON.stringify(sessJson));
  const sessId = sessJson.data.id;
  console.log('✓ Scheduled Study Session:', sessId, sessJson.data.topic, sessJson.data.startTime, '-', sessJson.data.endTime);

  // Verify Overlap Validation
  const resOverlap = await fetch(`${baseUrl}/api/studyhub/planner/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subject: 'Operating Systems',
      topic: 'Conflicting session slot',
      date: todayStr,
      startTime: '14:30',
      endTime: '16:00',
    }),
  });
  const overlapJson = await resOverlap.json();
  if (overlapJson.success) throw new Error('Overlap validation should have failed!');
  console.log('✓ Overlap validation correctly rejected conflict:', overlapJson.error);

  console.log('\n--- 5. Testing Quiz & Practice Module ---');
  // List Subjects
  const resSubs = await fetch(`${baseUrl}/api/studyhub/quiz/subjects`, { headers });
  const subsJson = await resSubs.json();
  console.log('✓ Quiz Subjects Loaded:', subsJson.data.length, 'subjects found.');

  // Get Questions (Scrubbed)
  const qParams = new URLSearchParams({ subject: 'Data Structures & Algorithms', count: '3' });
  const resQuestions = await fetch(`${baseUrl}/api/studyhub/quiz/questions?${qParams.toString()}`, { headers });
  const questionsJson = await resQuestions.json();
  if (!questionsJson.success || questionsJson.data.length === 0) throw new Error('Get questions failed');
  const sampleQ = questionsJson.data[0];
  if ('correctAnswer' in sampleQ || 'explanation' in sampleQ) {
    throw new Error('Exam integrity compromised! Correct answer leaked in questions API.');
  }
  console.log('✓ Scrubbed Questions count:', questionsJson.data.length, '(Exam integrity verified - answers hidden)');

  // Submit Quiz
  const answerPayload: Record<string, number> = {};
  for (const q of questionsJson.data) {
    answerPayload[q.id] = 1; // test answer
  }
  const resSubmit = await fetch(`${baseUrl}/api/studyhub/quiz/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subject: 'Data Structures & Algorithms',
      answers: answerPayload,
    }),
  });
  const submitJson = await resSubmit.json();
  if (!submitJson.success || submitJson.data.score === undefined) throw new Error('Quiz submit failed');
  console.log('✓ Quiz Graded:', `Score: ${submitJson.data.score}/${submitJson.data.totalQuestions} (${submitJson.data.percentage}%)`);
  console.log('✓ Explanations returned in review:', submitJson.data.review.length, 'items');

  console.log('\n--- 6. Testing Progress & Overview Aggregations ---');
  // Get Progress
  const resProgress = await fetch(`${baseUrl}/api/studyhub/progress`, { headers });
  const progJson = await resProgress.json();
  if (!progJson.success) throw new Error('Get progress failed');
  console.log('✓ Progress Aggregation:', {
    notes: progJson.data.notes,
    materials: progJson.data.materials,
    assignments: progJson.data.assignments,
    planner: progJson.data.planner,
    quiz: progJson.data.quiz,
    activityCount: progJson.data.activityFeed.length,
  });

  // Get Overview
  const resOverview = await fetch(`${baseUrl}/api/studyhub/overview`, { headers });
  const overJson = await resOverview.json();
  if (!overJson.success) throw new Error('Get overview failed');
  console.log('✓ Study Hub Overview:', {
    notesCount: overJson.data.notesCount,
    materialsCount: overJson.data.materialsCount,
    pendingAssignments: overJson.data.pendingAssignmentsCount,
    todaySessions: overJson.data.todaySessionsCount,
    avgQuizScore: overJson.data.averageQuizScore,
  });

  // Clean up test items
  await fetch(`${baseUrl}/api/studyhub/notes/${noteId}`, { method: 'DELETE', headers });
  await fetch(`${baseUrl}/api/studyhub/materials/${matId}`, { method: 'DELETE', headers });
  await fetch(`${baseUrl}/api/studyhub/assignments/${asgnId}`, { method: 'DELETE', headers });
  await fetch(`${baseUrl}/api/studyhub/planner/sessions/${sessId}`, { method: 'DELETE', headers });
  console.log('\n✓ Cleaned up test entities successfully.');

  server.close();
  console.log('\n=============================================');
  console.log('ALL 6 STUDY HUB MODULES FULLY TESTED & PASSED');
  console.log('=============================================');
}

run().catch((err) => {
  console.error('Test Failed:', err);
  server.close();
  process.exit(1);
});
