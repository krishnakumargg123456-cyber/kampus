import * as fs from 'fs';
import * as path from 'path';

// Exact duplicate of production validation logic for standalone Node execution test
export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isValid: boolean;
  strength: 'weak' | 'fair' | 'strong';
  strengthLabel: string;
  strengthColor: string;
  strengthPercent: number;
  firstMissingError?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  const cleanPassword = password || '';
  const hasMinLength = cleanPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(cleanPassword);
  const hasNumber = /[0-9]/.test(cleanPassword);

  const hasUpper = /[A-Z]/.test(cleanPassword);
  const hasLower = /[a-z]/.test(cleanPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(cleanPassword);
  const isLonger = cleanPassword.length >= 10;

  let bonus = 0;
  if (hasUpper && hasLower) bonus += 1;
  if (hasSpecial) bonus += 1;
  if (isLonger) bonus += 1;

  let strength: 'weak' | 'fair' | 'strong' = 'weak';
  let strengthLabel = 'Weak';
  let strengthColor = '#64748b';
  let strengthPercent = 0;

  if (!cleanPassword) {
    strength = 'weak';
    strengthLabel = 'Weak';
    strengthColor = '#64748b';
    strengthPercent = 0;
  } else if (!hasMinLength || (!hasLetter && !hasNumber)) {
    strength = 'weak';
    strengthLabel = 'Weak';
    strengthColor = '#ef4444';
    strengthPercent = 25;
  } else if (hasMinLength && hasLetter && hasNumber) {
    if (bonus >= 2 || cleanPassword.length >= 12) {
      strength = 'strong';
      strengthLabel = 'Strong';
      strengthColor = '#22c55e';
      strengthPercent = 100;
    } else {
      strength = 'fair';
      strengthLabel = 'Fair';
      strengthColor = '#f59e0b';
      strengthPercent = 65;
    }
  } else {
    strength = 'weak';
    strengthLabel = 'Weak';
    strengthColor = '#f97316';
    strengthPercent = 40;
  }

  let firstMissingError: string | undefined;
  if (!cleanPassword) {
    firstMissingError = 'Please enter a password.';
  } else if (!hasMinLength) {
    firstMissingError = 'Your password must contain at least 8 characters.';
  } else if (!hasLetter) {
    firstMissingError = 'Add at least one letter to your password.';
  } else if (!hasNumber) {
    firstMissingError = 'Add at least one number to your password.';
  }

  return {
    hasMinLength,
    hasLetter,
    hasNumber,
    isValid: hasMinLength && hasLetter && hasNumber,
    strength,
    strengthLabel,
    strengthColor,
    strengthPercent,
    firstMissingError,
  };
}

export function parseClerkAuthError(err: any): string {
  const clerkErr = err?.errors?.[0];
  if (!clerkErr) {
    return err?.message || 'Authentication error. Please retry.';
  }

  switch (clerkErr.code) {
    case 'form_password_length_too_short':
      return 'Your password must contain at least 8 characters.';
    case 'form_password_pwned':
      return 'This password has been detected in a public data breach. For your security, please choose a different password.';
    case 'form_password_validation_failed':
      return (
        clerkErr.longMessage ||
        clerkErr.message ||
        'This password does not meet the password requirements configured for your account.'
      );
    case 'form_password_incorrect':
      return 'Incorrect password. Please verify and try again, or use Forgot Password.';
    case 'form_identifier_not_found':
      return 'No student account found with this email. Tap Register to create one.';
    case 'form_identifier_exists':
      return 'An account with this email already exists. Please log in.';
    case 'form_code_incorrect':
      return 'Incorrect verification code. Please check your email.';
    case 'verification_expired':
      return 'Verification code has expired. Please tap Resend Code.';
    default:
      return clerkErr.longMessage || clerkErr.message || 'Authentication error.';
  }
}

function runValidationTests() {
  console.log('=== KAMPUS AUTH & PASSWORD VALIDATION TEST SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. Empty password
  const emptyRes = validatePassword('');
  assert(!emptyRes.isValid, 'Empty password is not valid');
  assert(emptyRes.firstMissingError === 'Please enter a password.', 'Empty password returns "Please enter a password."');
  assert(!emptyRes.hasMinLength, 'Empty password hasMinLength is false');

  // 2. Short password (e.g. 5 chars)
  const shortRes = validatePassword('Pass1');
  assert(!shortRes.isValid, 'Short password (5 chars) is not valid');
  assert(!shortRes.hasMinLength, 'Short password hasMinLength is false');
  assert(shortRes.firstMissingError === 'Your password must contain at least 8 characters.', 'Short password error is "Your password must contain at least 8 characters."');

  // 3. 8 chars without letter (e.g. "12345678")
  const noLetterRes = validatePassword('12345678');
  assert(!noLetterRes.isValid, 'Password without letters is not valid');
  assert(noLetterRes.hasMinLength, '8 chars hasMinLength is true');
  assert(!noLetterRes.hasLetter, 'hasLetter is false');
  assert(noLetterRes.firstMissingError === 'Add at least one letter to your password.', 'Reports missing letter');

  // 4. 8 chars without number (e.g. "abcdefgh")
  const noNumRes = validatePassword('abcdefgh');
  assert(!noNumRes.isValid, 'Password without numbers is not valid');
  assert(noNumRes.hasMinLength, '8 chars hasMinLength is true');
  assert(!noNumRes.hasNumber, 'hasNumber is false');
  assert(noNumRes.firstMissingError === 'Add at least one number to your password.', 'Reports missing number');

  // 5. Valid 8-char password (e.g. "campus26")
  const valid8Res = validatePassword('campus26');
  assert(valid8Res.isValid, 'Valid 8-char password passes');
  assert(valid8Res.hasMinLength && valid8Res.hasLetter && valid8Res.hasNumber, 'All 3 criteria pass');
  assert(valid8Res.firstMissingError === undefined, 'No missing error on valid 8-char password');

  // 6. User photo case (11 chars, e.g. "Kampus@2026")
  const photoPassRes = validatePassword('Kampus@2026');
  assert(photoPassRes.isValid, '11-character password is valid');
  assert(photoPassRes.hasMinLength, 'hasMinLength is true');
  assert(photoPassRes.hasLetter, 'hasLetter is true');
  assert(photoPassRes.hasNumber, 'hasNumber is true');
  assert(photoPassRes.strength === 'strong', 'Password strength is Strong');
  assert(photoPassRes.strengthLabel === 'Strong', 'Strength label is Strong');
  assert(photoPassRes.firstMissingError === undefined, 'No missing error exists for 11-char password');

  // 7. Error clearing regex test (ensures stale password errors are matched and dismissed)
  const regex = /character|letter|number|password requirement|must contain/i;
  assert(regex.test('Your password must contain at least 8 characters.'), 'Regex matches stale length error');
  assert(regex.test('Add at least one letter to your password.'), 'Regex matches missing letter error');
  assert(regex.test('Add at least one number to your password.'), 'Regex matches missing number error');
  assert(regex.test('Please meet all password requirements.'), 'Regex matches general requirement error');
  assert(!regex.test('An account with this email already exists.'), 'Regex does NOT match server-side email error');

  // 8. Clerk Error Parser Tests
  const clerkShort = parseClerkAuthError({ errors: [{ code: 'form_password_length_too_short' }] });
  assert(clerkShort.includes('8 characters'), 'Parses form_password_length_too_short');

  const clerkPwned = parseClerkAuthError({ errors: [{ code: 'form_password_pwned' }] });
  assert(clerkPwned.includes('public data breach'), 'Parses form_password_pwned');

  const clerkExists = parseClerkAuthError({ errors: [{ code: 'form_identifier_exists' }] });
  assert(clerkExists.includes('already exists'), 'Parses form_identifier_exists');

  // 9. Android intentFilters in app.json
  const appJsonPath = path.resolve(process.cwd(), 'mobile/app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  assert(appJson.expo.scheme === 'kampus', 'app.json has scheme kampus');
  assert(Array.isArray(appJson.expo.android?.intentFilters), 'app.json has android.intentFilters');
  const filter = appJson.expo.android?.intentFilters?.[0];
  assert(filter?.action === 'VIEW', 'intentFilter action is VIEW');
  assert(filter?.data?.[0]?.scheme === 'kampus', 'intentFilter scheme is kampus');
  assert(filter?.category?.includes('DEFAULT') && filter?.category?.includes('BROWSABLE'), 'intentFilter category includes DEFAULT and BROWSABLE');

  console.log(`\n=== RESULTS: ${passed}/${total} assertions passed ===`);
  if (passed === total) {
    console.log('ALL AUTH & VALIDATION TESTS PASSED SUCCESSFULLY!');
  }
}

runValidationTests();
