import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
  Clipboard,
  Platform,
} from 'react-native';
import {
  Calculator,
  GraduationCap,
  Award,
  Percent,
  CalendarCheck,
  Timer,
  CheckSquare,
  Hourglass,
  FileText,
  AlignLeft,
  Type,
  Sparkles,
  GitCompare,
  Binary,
  Cpu,
  Compass,
  HardDrive,
  Key,
  Palette,
  Code2,
  Cake,
  CalendarRange,
  FileCheck,
  Search,
  Star,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Play,
  Pause,
  X,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';
import { useAuth } from '@clerk/clerk-expo';
import { toolkitApi, type ToolkitToolMeta } from '../../services/toolkitApi';
import {
  evaluateScientificExpression,
  calculateSGPA,
  calculateCGPA,
  calculateAttendance,
  calculatePercentage,
  analyzeText,
  convertTextCase,
  cleanText,
  convertNumberBase,
  convertUniversalUnits,
  convertDataSize,
  generateSecurePassword,
  calculateAge,
  calculateDateDifference,
  convertMarksToGrade,
} from '../../utils/toolkitEngines';

interface MobileToolItem {
  id: string;
  name: string;
  category: 'calculators' | 'productivity' | 'documents' | 'programming' | 'college';
  description: string;
  icon: any;
  featured?: boolean;
  keywords: string[];
}

const MOBILE_TOOLS: MobileToolItem[] = [
  // Calculators
  { id: 'scientific-calc', name: 'Scientific Calculator', category: 'calculators', description: 'Trig, logarithms, square root, powers, deg/rad modes & calculation history tape.', icon: Calculator, keywords: ['math', 'trig', 'sin', 'cos', 'tan', 'log', 'ln', 'eval'], featured: true },
  { id: 'cgpa-calc', name: 'CGPA Calculator', category: 'calculators', description: 'Cumulative grade point average across semesters with configurable credit weightings.', icon: GraduationCap, keywords: ['cgpa', 'grades', 'semester', 'credits', 'gpa'], featured: true },
  { id: 'sgpa-calc', name: 'SGPA Calculator', category: 'calculators', description: 'Subject-wise semester GPA calculator with credit hours and grade points.', icon: Award, keywords: ['sgpa', 'semester', 'grade points', 'credits'] },
  { id: 'percentage-calc', name: 'Percentage Calculator', category: 'calculators', description: 'Percentage of numbers, % increase/decrease, marks percentage, and differences.', icon: Percent, keywords: ['percentage', 'marks', 'increase', 'discount', 'ratio'] },
  { id: 'attendance-calc', name: 'Attendance & Safe-Zone', category: 'calculators', description: 'Attendance tracker, required lectures to reach 75%/85%, and safe skippable bunks.', icon: CalendarCheck, keywords: ['attendance', 'bunk', 'safe zone', 'classes', 'lectures'], featured: true },

  // Productivity
  { id: 'pomodoro-timer', name: 'Pomodoro Focus Timer', category: 'productivity', description: '25m deep focus cycles with automated short & long breaks and session summaries.', icon: Timer, keywords: ['pomodoro', 'focus', 'timer', 'study', 'deep work'], featured: true },
  { id: 'todo-list', name: 'Academic To-Do & Tasks', category: 'productivity', description: 'Task organizer with priority flags, course tags, due dates, and completion status.', icon: CheckSquare, keywords: ['todo', 'tasks', 'homework', 'assignment', 'checklist'] },
  { id: 'exam-countdown', name: 'Exam Countdown Tracker', category: 'productivity', description: 'Days remaining countdowns for mid-terms, final exams, practicals, and tests.', icon: Hourglass, keywords: ['exam', 'countdown', 'finals', 'midterm', 'dates'] },
  { id: 'quick-notes', name: 'Quick Notes & Scratchpad', category: 'productivity', description: 'Fast auto-saving scratchpad for formulas, lecture pointers, and quick memos.', icon: FileText, keywords: ['notes', 'scratchpad', 'memo', 'lecture', 'draft'] },

  // Documents
  { id: 'word-counter', name: 'Word & Character Counter', category: 'documents', description: 'Count words, characters with/without spaces, sentences, and estimated reading time.', icon: AlignLeft, keywords: ['words', 'characters', 'count', 'essay', 'sentences'] },
  { id: 'case-converter', name: 'Text Case Converter', category: 'documents', description: 'Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case.', icon: Type, keywords: ['case', 'uppercase', 'lowercase', 'titlecase', 'transform'] },
  { id: 'text-cleaner', name: 'Text Cleaner & Formatter', category: 'documents', description: 'Strip multiple spaces, blank lines, tabs, and format messy copied lecture texts.', icon: Sparkles, keywords: ['clean', 'trim', 'whitespace', 'spaces', 'formatter'] },

  // Programming
  { id: 'binary-converter', name: 'Binary & Bitwise Converter', category: 'programming', description: 'Bidirectional conversion between Decimal and Binary representations with validation.', icon: Binary, keywords: ['binary', 'decimal', 'bits', 'base2', 'programming'] },
  { id: 'number-base-converter', name: 'Multi-Base Number Converter', category: 'programming', description: 'Convert values instantaneously across Decimal (10), Binary (2), Octal (8), and Hex (16).', icon: Cpu, keywords: ['hex', 'octal', 'binary', 'decimal', 'base'] },
  { id: 'unit-converter', name: 'Universal Unit Converter', category: 'programming', description: 'Accurate scientific conversion for Length, Mass, Temperature, Speed, and Time.', icon: Compass, keywords: ['unit', 'converter', 'metric', 'length', 'weight', 'temperature'] },
  { id: 'data-size-converter', name: 'Digital Data Size Converter', category: 'programming', description: 'Convert capacity across Bytes, KB, MB, GB, and TB in Binary (1024) & Decimal (1000).', icon: HardDrive, keywords: ['bytes', 'kb', 'mb', 'gb', 'tb', 'data size', 'storage'] },
  { id: 'password-generator', name: 'Secure Password Generator', category: 'programming', description: 'Generate cryptographically strong passwords locally with zero server transmission.', icon: Key, keywords: ['password', 'generator', 'security', 'crypto', 'random', 'pin'] },

  // College Utilities
  { id: 'age-calculator', name: 'Age & Milestone Calculator', category: 'college', description: 'Exact age in years, months, days, total hours lived, and countdown to next birthday.', icon: Cake, keywords: ['age', 'birthday', 'date of birth', 'calendar', 'years'] },
  { id: 'date-difference', name: 'Date Difference & Working Days', category: 'college', description: 'Calculate exact elapsed days, calendar weeks, and business days between two dates.', icon: CalendarRange, keywords: ['date difference', 'days between', 'working days', 'semester length'] },
  { id: 'marks-grade-calc', name: 'Marks & Letter Grade Scale', category: 'college', description: 'Convert percentage marks into standard university 10-point grades (O, A+, A, B, C, F).', icon: FileCheck, keywords: ['grades', 'marks', 'scale', 'letter grade', 'pass criteria'] },
];

export const StudentToolkitScreen = () => {
  const { colors, isDark } = useTheme();
  const { getToken, userId } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadFavs() {
      try {
        const token = await getToken();
        const favs = await toolkitApi.getFavorites(token, userId);
        if (isMounted) setFavorites(favs);
      } catch {}
    }
    loadFavs();
    return () => { isMounted = false; };
  }, [userId]);

  const toggleFavorite = async (toolId: string) => {
    const isFav = favorites.includes(toolId);
    const newFavs = isFav ? favorites.filter((id) => id !== toolId) : [...favorites, toolId];
    setFavorites(newFavs);

    try {
      const token = await getToken();
      await toolkitApi.toggleFavorite(toolId, isFav, token, userId);
    } catch {}
  };

  const handleOpenTool = (toolId: string) => {
    setActiveToolId(toolId);
    (async () => {
      try {
        const token = await getToken();
        await toolkitApi.recordHistory(toolId, undefined, token, userId);
      } catch {}
    })();
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Copied to clipboard.');
  };

  const filteredTools = useMemo(() => {
    return MOBILE_TOOLS.filter((t) => {
      if (onlyFavorites && !favorites.includes(t.id)) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesKeywords = t.keywords.some((k) => k.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesKeywords) return false;
      }
      return true;
    });
  }, [selectedCategory, onlyFavorites, favorites, searchQuery]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'calculators', label: 'Calculators' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'documents', label: 'Text & Docs' },
    { id: 'programming', label: 'Tech & Code' },
    { id: 'college', label: 'College' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Student Toolkit</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Academic Calculators, Study Timers & Tech Utilities
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search tools (e.g. attendance, cgpa, pomodoro)..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[
              styles.categoryPill,
              onlyFavorites
                ? { backgroundColor: '#f59e0b' }
                : { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => setOnlyFavorites(!onlyFavorites)}
          >
            <Star size={12} color={onlyFavorites ? '#ffffff' : colors.textMuted} fill={onlyFavorites ? '#ffffff' : 'transparent'} />
            <Text style={[styles.categoryText, { color: onlyFavorites ? '#ffffff' : colors.textSecondary }]}>
              Favorites ({favorites.length})
            </Text>
          </TouchableOpacity>

          {categories.map((c) => {
            const isSelected = selectedCategory === c.id && !onlyFavorites;
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.categoryPill,
                  isSelected
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => {
                  setSelectedCategory(c.id);
                  setOnlyFavorites(false);
                }}
              >
                <Text style={[styles.categoryText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tools List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredTools.map((tool) => {
          const IconComp = tool.icon;
          const isFav = favorites.includes(tool.id);

          return (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                Shadows.card,
              ]}
              onPress={() => handleOpenTool(tool.id)}
            >
              <View style={[styles.toolIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <IconComp size={22} color={colors.primary} />
              </View>

              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.toolName, { color: colors.text }]}>{tool.name}</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(tool.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Star size={18} color={isFav ? '#f59e0b' : colors.textMuted} fill={isFav ? '#f59e0b' : 'transparent'} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.toolDesc, { color: colors.textMuted }]} numberOfLines={2}>
                  {tool.description}
                </Text>
              </View>

              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Interactive Tool Modal */}
      {activeToolId && (
        <Modal visible={Boolean(activeToolId)} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Modal Top Bar */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {MOBILE_TOOLS.find((t) => t.id === activeToolId)?.name}
                </Text>
                <TouchableOpacity onPress={() => setActiveToolId(null)} style={styles.modalCloseBtn}>
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: Spacing.md }} showsVerticalScrollIndicator={false}>
                {activeToolId === 'scientific-calc' && <ScientificCalculatorMobile />}
                {activeToolId === 'attendance-calc' && <AttendanceCalculatorMobile />}
                {activeToolId === 'cgpa-calc' && <CgpaCalculatorMobile />}
                {activeToolId === 'sgpa-calc' && <SgpaCalculatorMobile />}
                {activeToolId === 'percentage-calc' && <PercentageCalculatorMobile />}
                {activeToolId === 'pomodoro-timer' && <PomodoroMobile />}
                {activeToolId === 'todo-list' && <TodoListMobile />}
                {activeToolId === 'word-counter' && <WordCounterMobile />}
                {activeToolId === 'case-converter' && <CaseConverterMobile copyToClipboard={copyToClipboard} />}
                {activeToolId === 'text-cleaner' && <TextCleanerMobile copyToClipboard={copyToClipboard} />}
                {activeToolId === 'password-generator' && <PasswordGeneratorMobile copyToClipboard={copyToClipboard} />}
                {activeToolId === 'binary-converter' && <BinaryConverterMobile copyToClipboard={copyToClipboard} />}
                {activeToolId === 'number-base-converter' && <NumberBaseConverterMobile />}
                {activeToolId === 'unit-converter' && <UnitConverterMobile />}
                {activeToolId === 'data-size-converter' && <DataSizeConverterMobile />}
                {activeToolId === 'age-calculator' && <AgeCalculatorMobile />}
                {activeToolId === 'date-difference' && <DateDifferenceMobile />}
                {activeToolId === 'marks-grade-calc' && <MarksGradeMobile />}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// ============================================================================
// MOBILE SUB-COMPONENTS
// ============================================================================

const ScientificCalculatorMobile: React.FC = () => {
  const { colors } = useTheme();
  const [expr, setExpr] = useState('');
  const [mode, setMode] = useState<'deg' | 'rad'>('deg');
  const { result, error } = evaluateScientificExpression(expr, mode);

  const append = (v: string) => setExpr((p) => p + v);

  return (
    <View>
      <View style={[styles.calcDisplay, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <TouchableOpacity onPress={() => setMode(mode === 'deg' ? 'rad' : 'deg')} style={styles.degBadge}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{mode.toUpperCase()}</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{expr || '0'}</Text>
        </View>
        <Text style={[styles.calcResultText, { color: colors.text }]}>
          {error ? <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text> : result ?? 0}
        </Text>
      </View>

      <View style={styles.calcGrid}>
        {['sin(', 'cos(', 'tan(', 'pi', 'AC', 'log(', 'ln(', 'sqrt(', '^', '⌫', '(', ')', '!', '%', '÷', '7', '8', '9', '×', '−', '4', '5', '6', '+', 'e', '1', '2', '3', '0', '.'].map((token) => (
          <TouchableOpacity
            key={token}
            style={[
              styles.calcBtn,
              token === 'AC' ? { backgroundColor: colors.error + '20' } : { backgroundColor: colors.surfaceElevated },
            ]}
            onPress={() => {
              if (token === 'AC') setExpr('');
              else if (token === '⌫') setExpr((p) => p.slice(0, -1));
              else if (token === '÷') append('/');
              else if (token === '×') append('*');
              else if (token === '−') append('-');
              else append(token);
            }}
          >
            <Text style={[styles.calcBtnText, { color: token === 'AC' ? colors.error : colors.text }]}>{token}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const AttendanceCalculatorMobile: React.FC = () => {
  const { colors } = useTheme();
  const [attended, setAttended] = useState('38');
  const [total, setTotal] = useState('48');
  const [target, setTarget] = useState('75');

  const res = calculateAttendance(parseInt(attended, 10) || 0, parseInt(total, 10) || 1, parseInt(target, 10) || 75);

  return (
    <View>
      <View style={[styles.heroCard, { backgroundColor: res.isSafe ? '#10b981' : '#ef4444' }]}>
        <Text style={{ color: '#ffffff', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' }}>Current Attendance</Text>
        <Text style={{ color: '#ffffff', fontSize: 36, fontWeight: '900', marginVertical: 4 }}>{res.currentPercentage}%</Text>
        <Text style={{ color: '#ffffff', fontSize: 12, lineHeight: 18 }}>{res.explanation}</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Attended Classes</Text>
        <TextInput
          keyboardType="numeric"
          value={attended}
          onChangeText={setAttended}
          style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
        />

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>Total Held Classes</Text>
        <TextInput
          keyboardType="numeric"
          value={total}
          onChangeText={setTotal}
          style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
        />

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>Target Percentage (%)</Text>
        <TextInput
          keyboardType="numeric"
          value={target}
          onChangeText={setTarget}
          style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
        />
      </View>
    </View>
  );
};

const CgpaCalculatorMobile: React.FC = () => {
  const { colors } = useTheme();
  const [sems, setSems] = useState([
    { semester: 1, credits: 20, sgpa: 8.5 },
    { semester: 2, credits: 22, sgpa: 8.2 },
    { semester: 3, credits: 24, sgpa: 8.8 },
  ]);

  const res = calculateCGPA(sems);

  return (
    <View>
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <Text style={{ color: '#ffffff', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' }}>Overall CGPA</Text>
        <Text style={{ color: '#ffffff', fontSize: 36, fontWeight: '900', marginVertical: 4 }}>{res.cgpa.toFixed(2)}</Text>
        <Text style={{ color: '#e0e7ff', fontSize: 12 }}>AICTE Equivalent: ~{res.percentageEstimate}% ({res.totalCredits} Credits)</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        {sems.map((s, i) => (
          <View key={i} style={[styles.rowItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: 'bold', width: 60, fontSize: 12 }}>Sem {s.semester}</Text>
            <View style={{ flex: 1, marginHorizontal: 6 }}>
              <TextInput
                placeholder="Credits"
                keyboardType="numeric"
                value={String(s.credits)}
                onChangeText={(v) => {
                  const val = parseFloat(v) || 0;
                  setSems((p) => p.map((item, idx) => (idx === i ? { ...item, credits: val } : item)));
                }}
                style={[styles.smallInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="SGPA"
                keyboardType="numeric"
                value={String(s.sgpa)}
                onChangeText={(v) => {
                  const val = parseFloat(v) || 0;
                  setSems((p) => p.map((item, idx) => (idx === i ? { ...item, sgpa: val } : item)));
                }}
                style={[styles.smallInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: colors.primary }]}
          onPress={() => setSems((p) => [...p, { semester: p.length + 1, credits: 20, sgpa: 8.0 }])}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>+ Add Semester</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SgpaCalculatorMobile: React.FC = () => {
  const { colors } = useTheme();
  const [courses, setCourses] = useState([
    { name: 'Subject 1', credits: 4, gradePoint: 9 },
    { name: 'Subject 2', credits: 4, gradePoint: 8 },
    { name: 'Subject 3', credits: 3, gradePoint: 9 },
  ]);

  const res = calculateSGPA(courses);

  return (
    <View>
      <View style={[styles.heroCard, { backgroundColor: '#0d9488' }]}>
        <Text style={{ color: '#ffffff', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' }}>Semester SGPA</Text>
        <Text style={{ color: '#ffffff', fontSize: 36, fontWeight: '900', marginVertical: 4 }}>{res.sgpa.toFixed(2)}</Text>
        <Text style={{ color: '#ccfbf1', fontSize: 12 }}>Total Credits: {res.totalCredits}</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        {courses.map((c, i) => (
          <View key={i} style={[styles.rowItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <TextInput
              placeholder="Subject"
              value={c.name}
              onChangeText={(v) => setCourses((p) => p.map((item, idx) => (idx === i ? { ...item, name: v } : item)))}
              style={[styles.smallInput, { flex: 2, marginRight: 6, backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder="Credits"
              keyboardType="numeric"
              value={String(c.credits)}
              onChangeText={(v) => setCourses((p) => p.map((item, idx) => (idx === i ? { ...item, credits: parseFloat(v) || 0 } : item)))}
              style={[styles.smallInput, { flex: 1, marginRight: 6, backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder="Grade Pt"
              keyboardType="numeric"
              value={String(c.gradePoint)}
              onChangeText={(v) => setCourses((p) => p.map((item, idx) => (idx === i ? { ...item, gradePoint: parseFloat(v) || 0 } : item)))}
              style={[styles.smallInput, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: '#0d9488' }]}
          onPress={() => setCourses((p) => [...p, { name: `Subject ${p.length + 1}`, credits: 3, gradePoint: 8 }])}
        >
          <Text style={{ color: '#0d9488', fontWeight: 'bold', fontSize: 12 }}>+ Add Course</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PercentageCalculatorMobile: React.FC = () => {
  const { colors } = useTheme();
  const [a, setA] = useState('420');
  const [b, setB] = useState('500');
  const res = calculatePercentage('marks', parseFloat(a) || 0, parseFloat(b) || 1);

  return (
    <View>
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>Marks Percentage</Text>
        <Text style={{ color: '#ffffff', fontSize: 36, fontWeight: '900', marginVertical: 4 }}>{res.result}%</Text>
        <Text style={{ color: '#e0e7ff', fontSize: 12 }}>{res.breakdown}</Text>
      </View>
      <View style={{ marginTop: 16 }}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Marks Obtained</Text>
        <TextInput keyboardType="numeric" value={a} onChangeText={setA} style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]} />
        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>Total Maximum Marks</Text>
        <TextInput keyboardType="numeric" value={b} onChangeText={setB} style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]} />
      </View>
    </View>
  );
};

const PomodoroMobile: React.FC = () => {
  const { colors } = useTheme();
  const [sec, setSec] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let t: any = null;
    if (running && sec > 0) t = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, sec]);

  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const time = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Text style={{ fontSize: 56, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'] }}>{time}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{running ? 'Focusing...' : 'Paused'}</Text>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: running ? colors.warning : colors.primary }]}
          onPress={() => setRunning(!running)}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{running ? 'Pause' : 'Start Focus'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: colors.border }]}
          onPress={() => { setRunning(false); setSec(25 * 60); }}
        >
          <RotateCcw size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TodoListMobile: React.FC = () => {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Complete Lab Viva preparation', done: false },
    { id: '2', title: 'Review DBMS Normalization notes', done: true },
  ]);
  const [input, setInput] = useState('');

  const add = () => {
    if (!input.trim()) return;
    setTasks((p) => [...p, { id: Date.now().toString(), title: input.trim(), done: false }]);
    setInput('');
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TextInput
          placeholder="New task..."
          value={input}
          onChangeText={setInput}
          style={[styles.inputBox, { flex: 1, backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
        />
        <TouchableOpacity onPress={add} style={[styles.primaryBtn, { backgroundColor: colors.primary, paddingHorizontal: 16 }]}>
          <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Add</Text>
        </TouchableOpacity>
      </View>

      {tasks.map((t) => (
        <View key={t.id} style={[styles.rowItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setTasks((p) => p.map((item) => (item.id === t.id ? { ...item, done: !item.done } : item)))}
            style={{ marginRight: 10 }}
          >
            {t.done ? <CheckSquare size={20} color={colors.success} /> : <View style={[styles.squareBox, { borderColor: colors.textMuted }]} />}
          </TouchableOpacity>
          <Text style={{ flex: 1, color: t.done ? colors.textMuted : colors.text, textDecorationLine: t.done ? 'line-through' : 'none', fontSize: 13 }}>
            {t.title}
          </Text>
          <TouchableOpacity onPress={() => setTasks((p) => p.filter((item) => item.id !== t.id))}>
            <Trash2 size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const WordCounterMobile: React.FC = () => {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const stats = analyzeText(text);

  return (
    <View>
      <TextInput
        multiline
        numberOfLines={6}
        placeholder="Paste text here to count words..."
        value={text}
        onChangeText={setText}
        style={[styles.textArea, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
      />
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 20 }}>{stats.words}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 10 }}>Words</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>{stats.charactersWithSpaces}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 10 }}>Chars</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>{stats.sentences}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 10 }}>Sentences</Text>
        </View>
      </View>
    </View>
  );
};

const CaseConverterMobile: React.FC<{ copyToClipboard: (t: string) => void }> = ({ copyToClipboard }) => {
  const { colors } = useTheme();
  const [text, setText] = useState('hello campus world');

  return (
    <View>
      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        style={[styles.textArea, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 12 }}>
        {['upper', 'lower', 'title', 'sentence', 'camel', 'snake'].map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setText((p) => convertTextCase(p, m as any))}
            style={[styles.pillBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: 'bold' }}>{m.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => copyToClipboard(text)} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Copy Result</Text>
      </TouchableOpacity>
    </View>
  );
};

const TextCleanerMobile: React.FC<{ copyToClipboard: (t: string) => void }> = ({ copyToClipboard }) => {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  return (
    <View>
      <TextInput
        multiline
        numberOfLines={6}
        placeholder="Paste text with excessive tabs, spacing, or empty lines..."
        value={text}
        onChangeText={setText}
        style={[styles.textArea, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
      />
      <TouchableOpacity
        onPress={() => setText((p) => cleanText(p))}
        style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
      >
        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Strip Extra Spaces & Clean</Text>
      </TouchableOpacity>
    </View>
  );
};

const PasswordGeneratorMobile: React.FC<{ copyToClipboard: (t: string) => void }> = ({ copyToClipboard }) => {
  const { colors } = useTheme();
  const [pwd, setPwd] = useState(() => generateSecurePassword({ length: 16 }));

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.pwdCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{pwd}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <TouchableOpacity
          onPress={() => setPwd(generateSecurePassword({ length: 16 }))}
          style={[styles.outlineBtn, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>Regenerate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => copyToClipboard(pwd)}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>Copy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BinaryConverterMobile: React.FC<{ copyToClipboard: (t: string) => void }> = ({ copyToClipboard }) => {
  const { colors } = useTheme();
  const [val, setVal] = useState('42');
  const res = convertNumberBase(val, 10);

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Decimal (Base 10)</Text>
      <TextInput
        keyboardType="numeric"
        value={val}
        onChangeText={setVal}
        style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
      />
      <View style={[styles.pwdCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>Binary (Base 2):</Text>
        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 20 }}>{res.binary || '0'}</Text>
      </View>
    </View>
  );
};

const NumberBaseConverterMobile: React.FC = () => {
  const { colors } = useTheme();
  const [val, setVal] = useState('255');
  const res = convertNumberBase(val, 10);

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Decimal Input</Text>
      <TextInput
        keyboardType="numeric"
        value={val}
        onChangeText={setVal}
        style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
      />
      <View style={{ marginTop: 12, gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 12 }}>Binary: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{res.binary}</Text></Text>
        <Text style={{ color: colors.text, fontSize: 12 }}>Octal: <Text style={{ fontWeight: 'bold', color: '#0d9488' }}>{res.octal}</Text></Text>
        <Text style={{ color: colors.text, fontSize: 12 }}>Hexadecimal: <Text style={{ fontWeight: 'bold', color: '#6366f1' }}>{res.hex}</Text></Text>
      </View>
    </View>
  );
};

const UnitConverterMobile: React.FC = () => {
  const { colors } = useTheme();
  const [val, setVal] = useState('10');
  const res = convertUniversalUnits(parseFloat(val) || 0, 'length', 'Kilometer', 'Mile');

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Length (Kilometers)</Text>
      <TextInput
        keyboardType="numeric"
        value={val}
        onChangeText={setVal}
        style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
      />
      <View style={[styles.pwdCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>Miles Equivalent:</Text>
        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 24 }}>{res.toValue} Miles</Text>
        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{res.formula}</Text>
      </View>
    </View>
  );
};

const DataSizeConverterMobile: React.FC = () => {
  const { colors } = useTheme();
  const [val, setVal] = useState('1024');
  const res = convertDataSize(parseFloat(val) || 0, 'MB', 'GB');

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Data in Megabytes (MB)</Text>
      <TextInput
        keyboardType="numeric"
        value={val}
        onChangeText={setVal}
        style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
      />
      <View style={[styles.pwdCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>Gigabytes (GB):</Text>
        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 24 }}>{res.result} GB</Text>
      </View>
    </View>
  );
};

const AgeCalculatorMobile: React.FC = () => {
  const { colors } = useTheme();
  const [dob, setDob] = useState('2004-06-15');
  const res = calculateAge(dob);

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date of Birth (YYYY-MM-DD)</Text>
      <TextInput
        value={dob}
        onChangeText={setDob}
        style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
      />
      {res && (
        <View style={[styles.pwdCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: 12 }]}>
          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 28 }}>{res.years} Years Old</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
            {res.months} months, {res.days} days ({res.totalDays.toLocaleString()} total days)
          </Text>
        </View>
      )}
    </View>
  );
};

const DateDifferenceMobile: React.FC = () => {
  const { colors } = useTheme();
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState('2026-12-15');
  const res = calculateDateDifference(start, end);

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Start Date (YYYY-MM-DD)</Text>
      <TextInput value={start} onChangeText={setStart} style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]} />
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>End Date (YYYY-MM-DD)</Text>
      <TextInput value={end} onChangeText={setEnd} style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]} />
      {res && (
        <View style={[styles.pwdCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: 12 }]}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 24 }}>{res.totalDays} Total Days</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{res.breakdown}</Text>
        </View>
      )}
    </View>
  );
};

const MarksGradeMobile: React.FC = () => {
  const { colors } = useTheme();
  const [marks, setMarks] = useState('84');
  const res = convertMarksToGrade(parseFloat(marks) || 0, '10-point');

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Marks Percentage (%)</Text>
      <TextInput keyboardType="numeric" value={marks} onChangeText={setMarks} style={[styles.inputBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]} />
      <View style={[styles.pwdCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>10-Point Grade:</Text>
        <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 32 }}>{res.grade}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{res.gradePoint} Grade Points ({res.description})</Text>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerRow: {
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 38,
    marginVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 0,
  },
  categoryScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: Spacing.md,
    gap: 10,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  toolIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolName: {
    fontSize: 14,
    fontWeight: '700',
  },
  toolDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    maxHeight: '85%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  heroCard: {
    padding: 16,
    borderRadius: BorderRadius.lg,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputBox: {
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  textArea: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    height: 100,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  smallInput: {
    height: 34,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 11,
  },
  outlineBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  pwdCard: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  calcDisplay: {
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  calcResultText: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'right',
  },
  degBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  calcBtn: {
    width: '18%',
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  squareBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
