import { spawn } from 'child_process';

const server = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: '5002', NODE_ENV: 'production', ALLOW_OFFLINE_DB: 'true' },
});

server.stdout.on('data', (data) => {
  const str = data.toString();
  console.log('[Server Output]:', str.trim());
  if (str.includes('KAMPUS server running')) {
    console.log('--- Server is live on port 5002! Starting integration tests... ---');
    const testProc = spawn('npx', ['tsx', 'scripts/test_notifications_and_campus_life.ts'], {
      env: { ...process.env, API_BASE_URL: 'http://localhost:5002' },
      stdio: 'inherit',
      shell: true,
    });

    testProc.on('exit', (code) => {
      console.log(`Test exited with code: ${code}`);
      server.kill();
      process.exit(code || 0);
    });
  }
});

server.stderr.on('data', (data) => {
  console.error('[Server Error]:', data.toString().trim());
});
