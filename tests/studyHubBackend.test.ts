import express from 'express';
import { registerStudyHubBackend } from '../server/studyHubBackend.ts';

async function runStudyHubTests() {
  console.log('--- Running KAMPUS Study Hub Backend Unit Tests ---');
  const app = express();
  app.use(express.json());
  registerStudyHubBackend(app);

  // Directly test through Express app routing logic
  const mockReq = (body: any = {}, params: any = {}, query: any = {}) => ({
    body,
    params,
    query,
  }) as any;

  const mockRes = () => {
    const res: any = {};
    res.statusCode = 200;
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      res.data = data;
      return res;
    };
    return res;
  };

  try {
    // 1. Test Bootstrap
    console.log('[Test 1] Testing /api/studyhub/bootstrap...');
    const bootstrapHandler = (app._router.stack as any[])
      .find((r) => r.route?.path === '/api/studyhub/bootstrap')?.route.stack[0].handle;

    if (!bootstrapHandler) throw new Error('Bootstrap handler not registered');

    const res1 = mockRes();
    bootstrapHandler(mockReq(), res1);
    console.log('Bootstrap success:', res1.data?.success, 'Subjects loaded:', res1.data?.data?.subjects?.length);
    if (!res1.data?.success || !res1.data?.data?.subjects) {
      throw new Error('Bootstrap failed to return valid data');
    }

    // 2. Test Adding a Note
    console.log('[Test 2] Testing /api/studyhub/note creation...');
    const noteHandler = (app._router.stack as any[])
      .find((r) => r.route?.path === '/api/studyhub/note' && r.route?.methods?.post)?.route.stack[0].handle;

    if (!noteHandler) throw new Error('Note handler not registered');

    const res2 = mockRes();
    noteHandler(
      mockReq({
        title: 'Master Theorem Test Note',
        description: 'Test note description',
        content: '# Test Content\n\nTesting live note persistence.',
        subjectId: 'subj-cs302',
        pinned: true,
        bookmarked: true,
      }),
      res2
    );
    console.log('Note creation status:', res2.statusCode, 'Created Note ID:', res2.data?.data?.id);
    if (res2.statusCode !== 201 || !res2.data?.data?.id) {
      throw new Error('Failed to create note');
    }

    // 3. Test Logging Study Minutes
    console.log('[Test 3] Testing /api/studyhub/log-minutes...');
    const logHandler = (app._router.stack as any[])
      .find((r) => r.route?.path === '/api/studyhub/log-minutes' && r.route?.methods?.post)?.route.stack[0].handle;

    if (!logHandler) throw new Error('Log minutes handler not registered');

    const res3 = mockRes();
    logHandler(mockReq({ minutes: 30 }), res3);
    console.log('Log minutes success:', res3.data?.success, 'Weekly logs count:', res3.data?.weeklyLogs?.length);
    if (!res3.data?.success) {
      throw new Error('Failed to log study minutes');
    }

    console.log('>>> ALL STUDY HUB BACKEND TESTS PASSED SUCCESSFULLY! <<<');
  } catch (err: any) {
    console.error('Study Hub Test Failed:', err.message);
    process.exit(1);
  }
}

runStudyHubTests();
