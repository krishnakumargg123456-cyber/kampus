import { execSync } from 'child_process';

interface SuiteResult {
  name: string;
  command: string;
  passed: boolean;
  durationMs: number;
  outputSnippet?: string;
}

const SUITES = [
  { name: '1. Authentication & Password Validation Suite', command: 'npx tsx scripts/test_auth_validation.ts' },
  { name: '2. Profile & Account Settings Integration Suite', command: 'npx tsx scripts/test_profile_settings_api.ts' },
  { name: '3. Kampus AI Full-Stack Integration Suite', command: 'npx tsx scripts/test_ai_fullstack.ts' },
  { name: '4. Study Hub 6-Module Full-Stack Suite', command: 'npx tsx scripts/test_studyhub_api.ts' },
  { name: '5. Marketplace Shared DB & Orders Suite', command: 'npx tsx scripts/test_market_fullstack.ts' },
  { name: '6. 21 Backend Modules Persistence & Integrity Audit', command: 'npx tsx scripts/test_all_modules_crud.ts' },
];

console.log('\n======================================================');
console.log('   KAMPUS UNIFIED AUTOMATED REGRESSION TEST RUNNER    ');
console.log('======================================================\n');

const results: SuiteResult[] = [];
let allPassed = true;

for (const suite of SUITES) {
  process.stdout.write(`⏳ Running [${suite.name}]... `);
  const start = Date.now();
  try {
    const out = execSync(suite.command, { encoding: 'utf8', stdio: 'pipe' });
    const duration = Date.now() - start;
    console.log(`✅ PASSED (${duration}ms)`);
    results.push({ name: suite.name, command: suite.command, passed: true, durationMs: duration });
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`❌ FAILED (${duration}ms)`);
    allPassed = false;
    const errOut = (err.stdout || '') + '\n' + (err.stderr || err.message || '');
    results.push({
      name: suite.name,
      command: suite.command,
      passed: false,
      durationMs: duration,
      outputSnippet: errOut.slice(-500),
    });
  }
}

console.log('\n======================================================');
console.log('                 REGRESSION TEST SUMMARY              ');
console.log('======================================================');
for (const r of results) {
  console.log(`${r.passed ? '✅ [PASS]' : '❌ [FAIL]'} ${r.name} (${r.durationMs}ms)`);
  if (!r.passed && r.outputSnippet) {
    console.log(`    Snippet: ${r.outputSnippet.trim().replace(/\n/g, '\n    ')}`);
  }
}

if (!allPassed) {
  console.error('\n❌ One or more regression suites failed.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL REGRESSION TEST SUITES PASSED FLAWLESSLY 100%!');
  process.exit(0);
}
