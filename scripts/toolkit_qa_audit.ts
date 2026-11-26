/**
 * KAMPUS Student Toolkit - Automated QA & Verification Suite
 * Tests all mathematical calculations, document analyzers, conversions,
 * backend endpoints, user data isolation, and security constraints.
 */

import express from 'express';
import { createServer } from 'http';
import {
  evaluateScientificExpression,
  calculateSGPA,
  calculateCGPA,
  calculateAttendance,
  calculatePercentage,
  analyzeText,
  convertTextCase,
  cleanText,
  compareTexts,
  convertNumberBase,
  convertUniversalUnits,
  convertDataSize,
  generateSecurePassword,
  calculateAge,
  calculateDateDifference,
  convertMarksToGrade,
} from '../src/utils/toolkitEngines.ts';
import { registerStudentToolkitBackend } from '../server/studentToolkitBackend.ts';

let passed = 0;
let failed = 0;

function assert(phase: string, testName: string, condition: boolean, extra?: any) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`, extra || '');
    failed++;
  }
}

async function runToolkitAudit() {
  console.log('====================================================');
  console.log('🛠️  KAMPUS STUDENT TOOLKIT - MASTER QA TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // PHASE 1: ACADEMIC CALCULATOR ENGINES
  // ----------------------------------------------------
  console.log('[Phase 1] Auditing Academic Calculator Engines');

  // Scientific Calculator
  const basicMath = evaluateScientificExpression('2 + 3 * 4');
  assert('Phase 1', 'Basic arithmetic order of operations (2 + 3 * 4 = 14)', basicMath.result === 14);

  const powerAndSqrt = evaluateScientificExpression('sqrt(16) + 2^3');
  assert('Phase 1', 'Square root and powers (sqrt(16) + 2^3 = 12)', powerAndSqrt.result === 12);

  const trigDeg = evaluateScientificExpression('sin(90)', 'deg');
  assert('Phase 1', 'Trig in Degree mode (sin(90 deg) = 1)', trigDeg.result === 1);

  const trigRad = evaluateScientificExpression('sin(pi / 2)', 'rad');
  assert('Phase 1', 'Trig in Radian mode (sin(pi/2 rad) = 1)', Math.abs((trigRad.result ?? 0) - 1) < 1e-6);

  const factorial = evaluateScientificExpression('5!');
  assert('Phase 1', 'Factorial expression (5! = 120)', factorial.result === 120);

  const divByZero = evaluateScientificExpression('10 / 0');
  assert('Phase 1', 'Zero division error safety', divByZero.error !== null);

  const invalidChar = evaluateScientificExpression('2 + alert(1)');
  assert('Phase 1', 'Malicious token rejection safety', invalidChar.error !== null);

  // SGPA Calculation
  const sgpaRes = calculateSGPA([
    { name: 'DSA', credits: 4, gradePoint: 9 }, // 36
    { name: 'OS', credits: 4, gradePoint: 8 },  // 32
    { name: 'DBMS', credits: 3, gradePoint: 9 },// 27
    { name: 'CN', credits: 3, gradePoint: 7 },  // 21 -> total pts 116 / 14 = 8.2857 -> 8.29
  ]);
  assert('Phase 1', 'Weighted SGPA calculation', Math.abs(sgpaRes.sgpa - 8.29) <= 0.02 && sgpaRes.totalCredits === 14);

  // CGPA Calculation
  const cgpaRes = calculateCGPA([
    { semester: 1, credits: 20, sgpa: 8.5 }, // 170
    { semester: 2, credits: 22, sgpa: 8.2 }, // 180.4
    { semester: 3, credits: 24, sgpa: 8.8 }, // 211.2 -> 561.6 / 66 = 8.509 -> 8.51
  ]);
  assert('Phase 1', 'Multi-semester weighted CGPA', Math.abs(cgpaRes.cgpa - 8.51) <= 0.02 && cgpaRes.totalCredits === 66);

  // Attendance Calculator
  // Safe zone: attended 40 of 48, target 75% -> current 83.3% -> can miss 5 classes
  const attSafe = calculateAttendance(40, 48, 75);
  assert('Phase 1', 'Attendance Safe Zone detection (83.3% >= 75%)', attSafe.isSafe === true && attSafe.maxSkippable === 5);

  // Shortage: attended 30 of 48, target 75% -> current 62.5% -> needs 24 consecutive classes
  const attShort = calculateAttendance(30, 48, 75);
  assert('Phase 1', 'Attendance Shortage detection (62.5% < 75%)', attShort.isSafe === false && attShort.classesNeeded === 24);

  // Percentage Calculations
  const marksPct = calculatePercentage('marks', 420, 500);
  assert('Phase 1', 'Marks percentage (420/500 = 84%)', marksPct.result === 84);

  const pctChange = calculatePercentage('change', 100, 125);
  assert('Phase 1', 'Percentage increase (from 100 to 125 = +25%)', pctChange.result === 25);

  // ----------------------------------------------------
  // PHASE 2: TEXT & DOCUMENT UTILITIES ENGINES
  // ----------------------------------------------------
  console.log('\n[Phase 2] Auditing Text & Document Utilities');

  const textSample = 'The quick brown fox jumps over the lazy dog. It was a sunny day!\n\nSecond paragraph begins here.';
  const analysis = analyzeText(textSample);
  assert('Phase 2', 'Word Counter analysis words count', analysis.words === 18);
  assert('Phase 2', 'Word Counter paragraphs count', analysis.paragraphs === 2);
  assert('Phase 2', 'Word Counter sentences count', analysis.sentences === 3);

  const upper = convertTextCase('kampus toolkit', 'upper');
  assert('Phase 2', 'Case conversion UPPERCASE', upper === 'KAMPUS TOOLKIT');

  const titleCase = convertTextCase('hello campus world', 'title');
  assert('Phase 2', 'Case conversion Title Case', titleCase === 'Hello Campus World');

  const snakeCase = convertTextCase('KAMPUS Student Life', 'snake');
  assert('Phase 2', 'Case conversion snake_case', snakeCase === 'kampus_student_life');

  const messyText = '  Too   many     spaces   \n\n\n\nDouble lines   ';
  const cleaned = cleanText(messyText);
  assert('Phase 2', 'Text Cleaner strips spaces and extra blank lines', cleaned === 'Too many spaces\nDouble lines');

  const diffs = compareTexts('Line 1\nLine 2', 'Line 1\nLine Modified');
  assert('Phase 2', 'Text compare detects modifications', diffs.some((d) => d.type === 'removed') && diffs.some((d) => d.type === 'added'));

  // ----------------------------------------------------
  // PHASE 3: PROGRAMMING & TECHNICAL UTILITIES
  // ----------------------------------------------------
  console.log('\n[Phase 3] Auditing Programming & Technical Utilities');

  const baseConv = convertNumberBase('255', 10);
  assert('Phase 3', 'Decimal to Binary (255 = 11111111)', baseConv.binary === '11111111');
  assert('Phase 3', 'Decimal to Hexadecimal (255 = FF)', baseConv.hex === 'FF');
  assert('Phase 3', 'Decimal to Octal (255 = 377)', baseConv.octal === '377');

  const binToDec = convertNumberBase('1010', 2);
  assert('Phase 3', 'Binary to Decimal (1010 = 10)', binToDec.decimal === '10');

  const unitLength = convertUniversalUnits(1, 'length', 'Kilometer', 'Meter');
  assert('Phase 3', 'Universal Unit Converter (1 km = 1000 m)', unitLength.toValue === 1000);

  const unitTemp = convertUniversalUnits(100, 'temp', 'Celsius', 'Fahrenheit');
  assert('Phase 3', 'Temperature Converter (100°C = 212°F)', unitTemp.toValue === 212);

  const dataSize = convertDataSize(1024, 'MB', 'GB', 'binary');
  assert('Phase 3', 'Data Size Converter (1024 MB = 1 GB binary)', dataSize.result === 1);

  const pwd = generateSecurePassword({ length: 18, includeSymbols: true });
  assert('Phase 3', 'Secure Password Generator produces correct length', pwd.length === 18);

  // ----------------------------------------------------
  // PHASE 4: COLLEGE & STUDENT UTILITIES
  // ----------------------------------------------------
  console.log('\n[Phase 4] Auditing College & Student Utilities');

  const ageRes = calculateAge('2000-01-01');
  assert('Phase 4', 'Age calculation produces valid years (> 20)', (ageRes?.years ?? 0) >= 20);

  const dateDiff = calculateDateDifference('2026-12-01', '2026-12-11');
  assert('Phase 4', 'Date difference calculation (10 days)', dateDiff?.totalDays === 10);

  const gradeO = convertMarksToGrade(94, '10-point');
  assert('Phase 4', 'Grade converter: 94% = Outstanding (O, 10 pts)', gradeO.grade === 'O' && gradeO.gradePoint === 10);

  const gradeF = convertMarksToGrade(35, '10-point');
  assert('Phase 4', 'Grade converter: 35% = Fail (F, 0 pts)', gradeF.grade === 'F');

  // ----------------------------------------------------
  // PHASE 5: BACKEND API & USER DATA ISOLATION
  // ----------------------------------------------------
  console.log('\n[Phase 5] Auditing Backend API & User Data Isolation');

  const app = express();
  app.use(express.json());
  registerStudentToolkitBackend(app);

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(5088, resolve));
  const baseUrl = 'http://127.0.0.1:5088';

  try {
    // 1. GET /api/toolkit/tools
    const toolsRes = await fetch(`${baseUrl}/api/toolkit/tools`);
    const toolsJson = await toolsRes.json();
    assert('Phase 5', 'GET /api/toolkit/tools returns HTTP 200 with catalog', toolsRes.status === 200 && toolsJson.data.length >= 20);

    // 2. Favorites Persistence (User A)
    const favRes = await fetch(`${baseUrl}/api/toolkit/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_audit_user_a' },
      body: JSON.stringify({ toolId: 'attendance-calc' }),
    });
    const favJson = await favRes.json();
    assert('Phase 5', 'User A adds attendance-calc to favorites', favRes.status === 200 && favJson.favorites.includes('attendance-calc'));

    // 3. User Data Isolation (User B should not have attendance-calc)
    const favUserBRes = await fetch(`${baseUrl}/api/toolkit/favorites`, {
      headers: { 'x-user-id': 'student_audit_user_b' },
    });
    const favUserBJson = await favUserBRes.json();
    assert('Phase 5', 'User B favorites are isolated from User A', !favUserBJson.favorites.includes('attendance-calc'));

    // 4. Task Creation (User A)
    const taskRes = await fetch(`${baseUrl}/api/toolkit/productivity/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_audit_user_a' },
      body: JSON.stringify({ title: 'Finish OS Lab 4', priority: 'high', subject: 'Operating Systems' }),
    });
    const taskJson = await taskRes.json();
    const createdTaskId = taskJson.task.id;
    assert('Phase 5', 'User A creates productivity task', taskRes.status === 201 && taskJson.task.title === 'Finish OS Lab 4');

    // 5. Cross-User Mutation Prevention (User B tries to edit User A task)
    const crossEditRes = await fetch(`${baseUrl}/api/toolkit/productivity/tasks/${createdTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_audit_user_b' },
      body: JSON.stringify({ title: 'Hacked by User B' }),
    });
    assert('Phase 5', 'User B blocked from editing User A task (HTTP 403 Forbidden)', crossEditRes.status === 403);

    // 6. Cross-User Delete Prevention (User B tries to delete User A task)
    const crossDeleteRes = await fetch(`${baseUrl}/api/toolkit/productivity/tasks/${createdTaskId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': 'student_audit_user_b' },
    });
    assert('Phase 5', 'User B blocked from deleting User A task (HTTP 403 Forbidden)', crossDeleteRes.status === 403);

    // 7. Pomodoro Session Completion Recording
    const pomoRes = await fetch(`${baseUrl}/api/toolkit/productivity/pomodoro/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'student_audit_user_a' },
      body: JSON.stringify({ focusMinutes: 25 }),
    });
    const pomoJson = await pomoRes.json();
    assert('Phase 5', 'Pomodoro session completion logs stats', pomoRes.status === 200 && pomoJson.stats.totalSessionsCompleted >= 1);

    // 8. Productivity Bootstrap
    const bootRes = await fetch(`${baseUrl}/api/toolkit/productivity/bootstrap`, {
      headers: { 'x-user-id': 'student_audit_user_a' },
    });
    const bootJson = await bootRes.json();
    assert('Phase 5', 'GET /api/toolkit/productivity/bootstrap returns synced student data', bootRes.status === 200 && bootJson.data.tasks.length >= 1);

  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(`📊 TOOLKIT QA AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runToolkitAudit().catch((err) => {
  console.error('Fatal Toolkit Audit Error:', err);
  process.exit(1);
});
