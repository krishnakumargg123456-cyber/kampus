/**
 * KAMPUS Student Toolkit - Core Mathematical & Technical Utilities Engine
 * Universal, precision-tested, zero-external-dependency algorithms.
 */

// ============================================================================
// 1. ACADEMIC CALCULATOR ENGINES
// ============================================================================

export interface ScientificCalcResult {
  result: number | null;
  error: string | null;
}

export function evaluateScientificExpression(
  expression: string,
  angleMode: 'deg' | 'rad' = 'deg'
): ScientificCalcResult {
  try {
    if (!expression || !expression.trim()) {
      return { result: 0, error: null };
    }

    let sanitized = expression.trim().toLowerCase();

    // Handle factorial n!
    sanitized = sanitized.replace(/(\d+(\.\d+)?)!/g, (_m, num) => {
      const n = parseInt(num, 10);
      if (n < 0 || n > 170) return 'NaN';
      let f = 1;
      for (let i = 2; i <= n; i++) f *= i;
      return `(${f})`;
    });

    // Powers ^ to **
    sanitized = sanitized.replace(/\^/g, '**');

    // Security check: Only allow safe math tokens
    const allowedTokens = /^[0-9+\-*/().,%\s*a-z_]+$/i;
    if (!allowedTokens.test(sanitized)) {
      return { result: null, error: 'Invalid mathematical expression or character.' };
    }

    // Build math context with full nested support
    const ctx: Record<string, any> = {
      sin: (x: number) => Math.sin(angleMode === 'deg' ? (x * Math.PI) / 180 : x),
      cos: (x: number) => Math.cos(angleMode === 'deg' ? (x * Math.PI) / 180 : x),
      tan: (x: number) => Math.tan(angleMode === 'deg' ? (x * Math.PI) / 180 : x),
      asin: (x: number) => (angleMode === 'deg' ? (Math.asin(x) * 180) / Math.PI : Math.asin(x)),
      acos: (x: number) => (angleMode === 'deg' ? (Math.acos(x) * 180) / Math.PI : Math.acos(x)),
      atan: (x: number) => (angleMode === 'deg' ? (Math.atan(x) * 180) / Math.PI : Math.atan(x)),
      sqrt: Math.sqrt,
      cbrt: Math.cbrt,
      log: Math.log10,
      ln: Math.log,
      abs: Math.abs,
      pi: Math.PI,
      e: Math.E,
    };

    const keys = Object.keys(ctx);
    const values = Object.values(ctx);

    // Evaluate in isolated Function scope
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `"use strict"; return (${sanitized});`);
    const computed = fn(...values);

    if (typeof computed !== 'number' || Number.isNaN(computed) || !Number.isFinite(computed)) {
      if (computed === Infinity || computed === -Infinity) {
        return { result: null, error: 'Division by zero or overflow.' };
      }
      return { result: null, error: 'Mathematical error (e.g. sqrt of negative).' };
    }

    // Round small floating inaccuracies (e.g. sin(180 deg) -> 0)
    const rounded = Math.abs(computed) < 1e-12 ? 0 : parseFloat(computed.toPrecision(12));
    return { result: rounded, error: null };
  } catch (err: any) {
    return { result: null, error: err.message || 'Invalid syntax.' };
  }
}

export interface SGPAItem {
  name: string;
  credits: number;
  gradePoint: number;
}

export interface SGPAResult {
  totalCredits: number;
  totalGradePoints: number;
  sgpa: number;
  percentageEstimate: number;
  formula: string;
}

export function calculateSGPA(courses: SGPAItem[]): SGPAResult {
  const validCourses = courses.filter((c) => c.credits > 0 && c.gradePoint >= 0);
  if (validCourses.length === 0) {
    return {
      totalCredits: 0,
      totalGradePoints: 0,
      sgpa: 0,
      percentageEstimate: 0,
      formula: 'SGPA = Σ(Credits × Grade Points) / Σ(Credits)',
    };
  }

  let totalCredits = 0;
  let totalGradePoints = 0;

  for (const c of validCourses) {
    totalCredits += c.credits;
    totalGradePoints += c.credits * c.gradePoint;
  }

  const sgpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
  // AICTE standardized SGPA to %: (SGPA - 0.75) * 10
  const percentageEstimate = parseFloat(Math.max(0, (sgpa - 0.75) * 10).toFixed(1));

  return {
    totalCredits,
    totalGradePoints,
    sgpa,
    percentageEstimate,
    formula: `SGPA = ${totalGradePoints.toFixed(1)} / ${totalCredits} = ${sgpa}`,
  };
}

export interface SemesterCGPAItem {
  semester: number;
  credits: number;
  sgpa: number;
}

export interface CGPAResult {
  totalCredits: number;
  cgpa: number;
  percentageEstimate: number;
  formula: string;
}

export function calculateCGPA(semesters: SemesterCGPAItem[]): CGPAResult {
  const validSems = semesters.filter((s) => s.credits > 0 && s.sgpa >= 0);
  if (validSems.length === 0) {
    return {
      totalCredits: 0,
      cgpa: 0,
      percentageEstimate: 0,
      formula: 'CGPA = Σ(Semester Credits × SGPA) / Σ(Total Credits)',
    };
  }

  let totalCredits = 0;
  let weightedPoints = 0;

  for (const s of validSems) {
    totalCredits += s.credits;
    weightedPoints += s.credits * s.sgpa;
  }

  const cgpa = totalCredits > 0 ? parseFloat((weightedPoints / totalCredits).toFixed(2)) : 0;
  const percentageEstimate = parseFloat(Math.max(0, (cgpa - 0.75) * 10).toFixed(1));

  return {
    totalCredits,
    cgpa,
    percentageEstimate,
    formula: `CGPA = ${weightedPoints.toFixed(2)} / ${totalCredits} = ${cgpa}`,
  };
}

export interface AttendanceResult {
  total: number;
  attended: number;
  currentPercentage: number;
  targetPercentage: number;
  isSafe: boolean;
  classesNeeded: number;
  maxSkippable: number;
  explanation: string;
}

export function calculateAttendance(
  attended: number,
  total: number,
  targetPercentage: number = 75
): AttendanceResult {
  const safeAttended = Math.max(0, attended);
  const safeTotal = Math.max(safeAttended, total);

  if (safeTotal === 0) {
    return {
      total: 0,
      attended: 0,
      currentPercentage: 100,
      targetPercentage,
      isSafe: true,
      classesNeeded: 0,
      maxSkippable: 0,
      explanation: 'No classes have taken place yet. Your attendance is at 100%.',
    };
  }

  const currentPercentage = parseFloat(((safeAttended / safeTotal) * 100).toFixed(1));
  const isSafe = currentPercentage >= targetPercentage;

  let classesNeeded = 0;
  let maxSkippable = 0;
  let explanation = '';

  if (isSafe) {
    // Formula: floor((100 * attended - target * total) / target)
    maxSkippable = Math.floor(
      (100 * safeAttended - targetPercentage * safeTotal) / targetPercentage
    );
    if (maxSkippable > 0) {
      explanation = `You are in the Safe Zone! You can skip the next ${maxSkippable} class${
        maxSkippable === 1 ? '' : 'es'
      } and still maintain at least ${targetPercentage}% attendance.`;
    } else {
      explanation = `You are on the safe border at ${currentPercentage}%. Do not miss any upcoming lectures to avoid dropping below ${targetPercentage}%.`;
    }
  } else {
    // Formula: ceil((target * total - 100 * attended) / (100 - target))
    if (targetPercentage >= 100) {
      classesNeeded = 999;
      explanation = 'Target of 100% is impossible if any class has been missed.';
    } else {
      classesNeeded = Math.ceil(
        (targetPercentage * safeTotal - 100 * safeAttended) / (100 - targetPercentage)
      );
      explanation = `Attendance Shortage! You must attend the next ${classesNeeded} consecutive class${
        classesNeeded === 1 ? '' : 'es'
      } without missing any to restore your attendance back to ${targetPercentage}%.`;
    }
  }

  return {
    total: safeTotal,
    attended: safeAttended,
    currentPercentage,
    targetPercentage,
    isSafe,
    classesNeeded,
    maxSkippable,
    explanation,
  };
}

export function calculatePercentage(
  type: 'of_number' | 'change' | 'marks' | 'diff',
  a: number,
  b: number
): { result: number; breakdown: string } {
  if (type === 'of_number') {
    // a% of b
    const res = (a / 100) * b;
    return {
      result: parseFloat(res.toFixed(2)),
      breakdown: `${a}% of ${b} = (${a} / 100) × ${b} = ${res.toFixed(2)}`,
    };
  }
  if (type === 'marks') {
    // a marks out of b
    if (b <= 0) return { result: 0, breakdown: 'Maximum marks must be greater than zero.' };
    const pct = (a / b) * 100;
    return {
      result: parseFloat(pct.toFixed(2)),
      breakdown: `(${a} / ${b}) × 100 = ${pct.toFixed(2)}%`,
    };
  }
  if (type === 'change') {
    // from a to b
    if (a === 0) return { result: 0, breakdown: 'Original value cannot be zero for percentage change.' };
    const diff = b - a;
    const change = (diff / a) * 100;
    const label = change >= 0 ? 'Increase' : 'Decrease';
    return {
      result: parseFloat(change.toFixed(2)),
      breakdown: `${label} of ${Math.abs(change).toFixed(2)}% (from ${a} to ${b})`,
    };
  }
  // Difference
  const avg = (a + b) / 2;
  if (avg === 0) return { result: 0, breakdown: 'Average is zero.' };
  const diffPct = (Math.abs(a - b) / avg) * 100;
  return {
    result: parseFloat(diffPct.toFixed(2)),
    breakdown: `|${a} - ${b}| / ((${a} + ${b}) / 2) × 100 = ${diffPct.toFixed(2)}%`,
  };
}

// ============================================================================
// 2. TEXT & DOCUMENT UTILITIES ENGINES
// ============================================================================

export interface TextAnalysis {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export function analyzeText(text: string): TextAnalysis {
  if (!text || !text.trim()) {
    return {
      words: 0,
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    };
  }

  const trimmed = text.trim();
  const wordsArray = trimmed.match(/\S+/g) || [];
  const words = wordsArray.length;

  const charactersWithSpaces = text.length;
  const charactersWithoutSpaces = text.replace(/\s/g, '').length;

  const sentences = (trimmed.match(/[^.!?]+[.!?]+(\s|$)/g) || [trimmed]).length;
  const paragraphs = trimmed.split(/\n+/).filter((p) => p.trim().length > 0).length;

  // Average reading speed: 200 words/min; Speaking: 130 words/min
  const readingTimeMinutes = parseFloat((words / 200).toFixed(1));
  const speakingTimeMinutes = parseFloat((words / 130).toFixed(1));

  return {
    words,
    charactersWithSpaces,
    charactersWithoutSpaces,
    sentences,
    paragraphs,
    readingTimeMinutes,
    speakingTimeMinutes,
  };
}

export function convertTextCase(
  text: string,
  mode: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'snake'
): string {
  if (!text) return '';

  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );
    case 'sentence':
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    case 'camel': {
      const words = text
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
      return words
        .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join('');
    }
    case 'snake':
      return text
        .trim()
        .toLowerCase()
        .replace(/[\s\W]+/g, '_')
        .replace(/^_+|_+$/g, '');
    default:
      return text;
  }
}

export function cleanText(
  text: string,
  options: {
    removeExtraSpaces?: boolean;
    removeBlankLines?: boolean;
    trimLines?: boolean;
  } = { removeExtraSpaces: true, removeBlankLines: true, trimLines: true }
): string {
  if (!text) return '';
  let cleaned = text;

  if (options.trimLines) {
    cleaned = cleaned
      .split('\n')
      .map((l) => l.trim())
      .join('\n');
  }

  if (options.removeExtraSpaces) {
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
  }

  if (options.removeBlankLines) {
    cleaned = cleaned.replace(/\n\s*\n+/g, '\n');
  }

  return cleaned.trim();
}

export interface DiffLine {
  type: 'same' | 'added' | 'removed';
  content: string;
  lineNumberA?: number;
  lineNumberB?: number;
}

export function compareTexts(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const results: DiffLine[] = [];

  const maxLen = Math.max(linesA.length, linesB.length);
  let lineA = 1;
  let lineB = 1;

  for (let i = 0; i < maxLen; i++) {
    const a = linesA[i];
    const b = linesB[i];

    if (a === b) {
      if (a !== undefined) {
        results.push({ type: 'same', content: a, lineNumberA: lineA++, lineNumberB: lineB++ });
      }
    } else {
      if (a !== undefined && b !== undefined) {
        results.push({ type: 'removed', content: a, lineNumberA: lineA++ });
        results.push({ type: 'added', content: b, lineNumberB: lineB++ });
      } else if (a !== undefined) {
        results.push({ type: 'removed', content: a, lineNumberA: lineA++ });
      } else if (b !== undefined) {
        results.push({ type: 'added', content: b, lineNumberB: lineB++ });
      }
    }
  }

  return results;
}

// ============================================================================
// 3. PROGRAMMING & TECHNICAL UTILITIES ENGINES
// ============================================================================

export interface NumberBaseResult {
  decimal: string;
  binary: string;
  octal: string;
  hex: string;
  error?: string;
}

export function convertNumberBase(
  input: string,
  fromBase: 2 | 8 | 10 | 16
): NumberBaseResult {
  const clean = input.trim();
  if (!clean) {
    return { decimal: '0', binary: '0', octal: '0', hex: '0' };
  }

  let dec: number;
  try {
    if (fromBase === 2) {
      if (!/^[01]+$/.test(clean)) return { decimal: '', binary: '', octal: '', hex: '', error: 'Invalid binary number.' };
      dec = parseInt(clean, 2);
    } else if (fromBase === 8) {
      if (!/^[0-7]+$/.test(clean)) return { decimal: '', binary: '', octal: '', hex: '', error: 'Invalid octal number.' };
      dec = parseInt(clean, 8);
    } else if (fromBase === 16) {
      if (!/^[0-9a-fA-F]+$/.test(clean)) return { decimal: '', binary: '', octal: '', hex: '', error: 'Invalid hexadecimal number.' };
      dec = parseInt(clean, 16);
    } else {
      if (!/^-?\d+$/.test(clean)) return { decimal: '', binary: '', octal: '', hex: '', error: 'Invalid decimal number.' };
      dec = parseInt(clean, 10);
    }

    if (Number.isNaN(dec)) {
      return { decimal: '', binary: '', octal: '', hex: '', error: 'Value exceeds integer limits.' };
    }

    return {
      decimal: dec.toString(10),
      binary: dec.toString(2),
      octal: dec.toString(8),
      hex: dec.toString(16).toUpperCase(),
    };
  } catch {
    return { decimal: '', binary: '', octal: '', hex: '', error: 'Parsing error.' };
  }
}

export interface UnitConversionResult {
  fromValue: number;
  fromUnit: string;
  toValue: number;
  toUnit: string;
  formula: string;
}

export function convertUniversalUnits(
  value: number,
  category: 'length' | 'mass' | 'temp' | 'speed' | 'time',
  fromUnit: string,
  toUnit: string
): UnitConversionResult {
  if (category === 'temp') {
    let celsius = value;
    if (fromUnit === 'Fahrenheit') celsius = ((value - 32) * 5) / 9;
    if (fromUnit === 'Kelvin') celsius = value - 273.15;

    let target = celsius;
    if (toUnit === 'Fahrenheit') target = (celsius * 9) / 5 + 32;
    if (toUnit === 'Kelvin') target = celsius + 273.15;

    return {
      fromValue: value,
      fromUnit,
      toValue: parseFloat(target.toFixed(2)),
      toUnit,
      formula: `${value}° ${fromUnit} = ${target.toFixed(2)}° ${toUnit}`,
    };
  }

  // Base conversions:
  // Length to meters
  const lengthToMeters: Record<string, number> = {
    Meter: 1,
    Kilometer: 1000,
    Centimeter: 0.01,
    Millimeter: 0.001,
    Mile: 1609.344,
    Yard: 0.9144,
    Foot: 0.3048,
    Inch: 0.0254,
  };

  // Mass to grams
  const massToGrams: Record<string, number> = {
    Gram: 1,
    Kilogram: 1000,
    Milligram: 0.001,
    Pound: 453.59237,
    Ounce: 28.3495,
  };

  // Speed to m/s
  const speedToMs: Record<string, number> = {
    'm/s': 1,
    'km/h': 0.277778,
    mph: 0.44704,
    Knot: 0.514444,
  };

  // Time to seconds
  const timeToSeconds: Record<string, number> = {
    Second: 1,
    Minute: 60,
    Hour: 3600,
    Day: 86400,
    Week: 604800,
  };

  let rates: Record<string, number> = lengthToMeters;
  if (category === 'mass') rates = massToGrams;
  if (category === 'speed') rates = speedToMs;
  if (category === 'time') rates = timeToSeconds;

  const baseRateFrom = rates[fromUnit] || 1;
  const baseRateTo = rates[toUnit] || 1;

  const inBase = value * baseRateFrom;
  const finalVal = inBase / baseRateTo;

  return {
    fromValue: value,
    fromUnit,
    toValue: parseFloat(finalVal.toFixed(4)),
    toUnit,
    formula: `1 ${fromUnit} = ${(baseRateFrom / baseRateTo).toPrecision(6)} ${toUnit}`,
  };
}

export function convertDataSize(
  value: number,
  fromUnit: 'B' | 'KB' | 'MB' | 'GB' | 'TB',
  toUnit: 'B' | 'KB' | 'MB' | 'GB' | 'TB',
  standard: 'decimal' | 'binary' = 'binary'
): { result: number; formula: string } {
  const base = standard === 'binary' ? 1024 : 1000;
  const powers: Record<string, number> = { B: 0, KB: 1, MB: 2, GB: 3, TB: 4 };

  const diff = (powers[fromUnit] ?? 0) - (powers[toUnit] ?? 0);
  const factor = Math.pow(base, diff);
  const result = parseFloat((value * factor).toFixed(4));

  return {
    result,
    formula: `Multiplied by ${base}^${diff} (${standard} base ${base})`,
  };
}

export function generateSecurePassword(options: {
  length: number;
  includeUpper?: boolean;
  includeLower?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}): string {
  const length = Math.max(6, Math.min(64, options.length || 16));
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  let charPool = '';
  if (options.includeUpper !== false) charPool += upper;
  if (options.includeLower !== false) charPool += lower;
  if (options.includeNumbers !== false) charPool += numbers;
  if (options.includeSymbols !== false) charPool += symbols;

  if (!charPool) charPool = lower + numbers;

  // Use cryptographic random values
  let password = '';
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;

  if (cryptoObj && cryptoObj.getRandomValues) {
    const randomBuffer = new Uint32Array(length);
    cryptoObj.getRandomValues(randomBuffer);
    for (let i = 0; i < length; i++) {
      password += charPool[randomBuffer[i] % charPool.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      password += charPool[Math.floor(Math.random() * charPool.length)];
    }
  }

  return password;
}

export function convertColor(colorInput: string): {
  hex: string;
  rgb: string;
  hsl: string;
  isValid: boolean;
} {
  const clean = colorInput.trim();
  let r = 0;
  let g = 0;
  let b = 0;

  // Test HEX
  if (/^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(clean)) {
    const raw = clean.replace('#', '');
    if (raw.length === 3) {
      r = parseInt(raw[0] + raw[0], 16);
      g = parseInt(raw[1] + raw[1], 16);
      b = parseInt(raw[2] + raw[2], 16);
    } else {
      r = parseInt(raw.substring(0, 2), 16);
      g = parseInt(raw.substring(2, 4), 16);
      b = parseInt(raw.substring(4, 6), 16);
    }
  } else if (/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.test(clean)) {
    const match = clean.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (match) {
      r = Math.min(255, parseInt(match[1], 10));
      g = Math.min(255, parseInt(match[2], 10));
      b = Math.min(255, parseInt(match[3], 10));
    }
  } else {
    return { hex: '#000000', rgb: 'rgb(0, 0, 0)', hsl: 'hsl(0, 0%, 0%)', isValid: false };
  }

  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  const rgb = `rgb(${r}, ${g}, ${b})`;

  // Calculate HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

  return { hex, rgb, hsl, isValid: true };
}

export function formatCode(
  code: string,
  lang: 'json' | 'html' | 'css' | 'js'
): { formatted: string; error?: string } {
  if (!code.trim()) return { formatted: '' };

  if (lang === 'json') {
    try {
      const parsed = JSON.parse(code);
      return { formatted: JSON.stringify(parsed, null, 2) };
    } catch (err: any) {
      return { formatted: code, error: `Invalid JSON: ${err.message}` };
    }
  }

  // Safe line-indentation formatter for code
  const lines = code.split('\n');
  let indent = 0;
  const formattedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      formattedLines.push('');
      continue;
    }

    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith('</')) {
      indent = Math.max(0, indent - 1);
    }

    formattedLines.push('  '.repeat(indent) + trimmed);

    if (
      (trimmed.endsWith('{') || trimmed.endsWith('[') || (trimmed.startsWith('<') && !trimmed.endsWith('/>') && !trimmed.includes('</'))) &&
      !trimmed.startsWith('<!--')
    ) {
      indent++;
    }
  }

  return { formatted: formattedLines.join('\n') };
}

// ============================================================================
// 4. COLLEGE & STUDENT UTILITIES ENGINES
// ============================================================================

export interface AgeCalculationResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalHours: number;
  nextBirthdayDays: number;
}

export function calculateAge(birthDateStr: string): AgeCalculationResult | null {
  const birth = new Date(birthDateStr);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  if (birth > now) return null;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diffMs = now.getTime() - birth.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));

  // Next birthday calculation
  const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < now) {
    nextBirthday.setFullYear(now.getFullYear() + 1);
  }
  const nextBirthdayDays = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    years,
    months,
    days,
    totalDays,
    totalHours,
    nextBirthdayDays,
  };
}

export function calculateDateDifference(
  startDateStr: string,
  endDateStr: string
): {
  totalDays: number;
  weekdays: number;
  weeks: number;
  breakdown: string;
} | null {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Count weekdays
  let weekdays = 0;
  const cur = new Date(Math.min(start.getTime(), end.getTime()));
  const target = new Date(Math.max(start.getTime(), end.getTime()));

  while (cur <= target) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) weekdays++;
    cur.setDate(cur.getDate() + 1);
  }

  const weeks = parseFloat((totalDays / 7).toFixed(1));

  return {
    totalDays,
    weekdays,
    weeks,
    breakdown: `${totalDays} calendar days (${weekdays} working days / ~${weeks} weeks)`,
  };
}

export function convertMarksToGrade(
  percentage: number,
  scale: '10-point' | '4-point' = '10-point'
): { grade: string; gradePoint: number; description: string } {
  const p = Math.max(0, Math.min(100, percentage));

  if (scale === '10-point') {
    if (p >= 90) return { grade: 'O', gradePoint: 10, description: 'Outstanding' };
    if (p >= 80) return { grade: 'A+', gradePoint: 9, description: 'Excellent' };
    if (p >= 70) return { grade: 'A', gradePoint: 8, description: 'Very Good' };
    if (p >= 60) return { grade: 'B+', gradePoint: 7, description: 'Good' };
    if (p >= 50) return { grade: 'B', gradePoint: 6, description: 'Above Average' };
    if (p >= 40) return { grade: 'C', gradePoint: 5, description: 'Average / Pass' };
    return { grade: 'F', gradePoint: 0, description: 'Fail / Reappear' };
  }

  // 4.0 GPA scale (US standard)
  if (p >= 93) return { grade: 'A', gradePoint: 4.0, description: 'Exceptional' };
  if (p >= 90) return { grade: 'A-', gradePoint: 3.7, description: 'Superior' };
  if (p >= 87) return { grade: 'B+', gradePoint: 3.3, description: 'Very Good' };
  if (p >= 83) return { grade: 'B', gradePoint: 3.0, description: 'Good' };
  if (p >= 80) return { grade: 'B-', gradePoint: 2.7, description: 'Competent' };
  if (p >= 77) return { grade: 'C+', gradePoint: 2.3, description: 'Fair' };
  if (p >= 70) return { grade: 'C', gradePoint: 2.0, description: 'Passing' };
  return { grade: 'F', gradePoint: 0.0, description: 'Failing' };
}
