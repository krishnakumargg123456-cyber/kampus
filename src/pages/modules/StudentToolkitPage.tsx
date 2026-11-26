import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Search,
  Star,
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Play,
  Pause,
  Sparkles,
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
  GitCompare,
  QrCode,
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
  ArrowRight,
  X,
  ExternalLink,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
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
  convertColor,
  formatCode,
  calculateAge,
  calculateDateDifference,
  convertMarksToGrade,
  type DiffLine,
} from '../../utils/toolkitEngines';

interface ToolMeta {
  id: string;
  name: string;
  category: 'calculators' | 'productivity' | 'documents' | 'programming' | 'college';
  description: string;
  icon: any;
  keywords: string[];
  featured?: boolean;
}

const ALL_TOOLS: ToolMeta[] = [
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
  { id: 'text-compare', name: 'Text Diff & Compare', category: 'documents', description: 'Side-by-side text comparison tool highlighting added, modified, and removed lines.', icon: GitCompare, keywords: ['diff', 'compare', 'text compare', 'changes', 'revisions'] },
  { id: 'qr-generator', name: 'QR Code Generator', category: 'documents', description: 'Generate high-resolution scannable QR codes for links, Wi-Fi keys, and text with download.', icon: QrCode, keywords: ['qr', 'qrcode', 'barcode', 'generator', 'link', 'download'], featured: true },

  // Programming
  { id: 'binary-converter', name: 'Binary & Bitwise Converter', category: 'programming', description: 'Bidirectional conversion between Decimal and Binary representations with validation.', icon: Binary, keywords: ['binary', 'decimal', 'bits', 'base2', 'programming'] },
  { id: 'number-base-converter', name: 'Multi-Base Number Converter', category: 'programming', description: 'Convert values instantaneously across Decimal (10), Binary (2), Octal (8), and Hex (16).', icon: Cpu, keywords: ['hex', 'octal', 'binary', 'decimal', 'base'] },
  { id: 'unit-converter', name: 'Universal Unit Converter', category: 'programming', description: 'Accurate scientific conversion for Length, Mass, Temperature, Speed, and Time.', icon: Compass, keywords: ['unit', 'converter', 'metric', 'length', 'weight', 'temperature'] },
  { id: 'data-size-converter', name: 'Digital Data Size Converter', category: 'programming', description: 'Convert capacity across Bytes, KB, MB, GB, and TB in Binary (1024) & Decimal (1000).', icon: HardDrive, keywords: ['bytes', 'kb', 'mb', 'gb', 'tb', 'data size', 'storage'] },
  { id: 'password-generator', name: 'Secure Password Generator', category: 'programming', description: 'Generate cryptographically strong passwords locally with zero server transmission.', icon: Key, keywords: ['password', 'generator', 'security', 'crypto', 'random', 'pin'] },
  { id: 'color-converter', name: 'HEX / RGB / HSL Color Tools', category: 'programming', description: 'Live color picker and converter across HEX, RGB, HSL with visual preview swatches.', icon: Palette, keywords: ['color', 'hex', 'rgb', 'hsl', 'css', 'design', 'palette'] },
  { id: 'code-formatter', name: 'Code Beautifier & JSON Validator', category: 'programming', description: 'Format, indent, and validate JSON data structures, HTML, CSS, and JS snippets.', icon: Code2, keywords: ['code', 'format', 'json', 'beautify', 'validate', 'indent'] },

  // College Utilities
  { id: 'age-calculator', name: 'Age & Milestone Calculator', category: 'college', description: 'Exact age in years, months, days, total hours lived, and countdown to next birthday.', icon: Cake, keywords: ['age', 'birthday', 'date of birth', 'calendar', 'years'] },
  { id: 'date-difference', name: 'Date Difference & Working Days', category: 'college', description: 'Calculate exact elapsed days, calendar weeks, and business days between two dates.', icon: CalendarRange, keywords: ['date difference', 'days between', 'working days', 'semester length'] },
  { id: 'marks-grade-calc', name: 'Marks & Letter Grade Scale', category: 'college', description: 'Convert percentage marks into standard university 10-point grades (O, A+, A, B, C, F).', icon: FileCheck, keywords: ['grades', 'marks', 'scale', 'letter grade', 'pass criteria'] },
];

export const StudentToolkitPage: React.FC = () => {
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync favorites with backend
  useEffect(() => {
    let isMounted = true;
    async function loadFavorites() {
      try {
        const res = await fetch('/api/toolkit/favorites', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(user?.id ? { 'x-user-id': user.id } : {}),
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.favorites) {
            setFavorites(json.favorites);
          }
        }
      } catch {}
    }
    loadFavorites();
    return () => { isMounted = false; };
  }, [user?.id, token]);

  const toggleFavorite = async (toolId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isFav = favorites.includes(toolId);
    const newFavs = isFav ? favorites.filter((id) => id !== toolId) : [...favorites, toolId];
    setFavorites(newFavs);

    try {
      await fetch(isFav ? `/api/toolkit/favorites/${toolId}` : '/api/toolkit/favorites', {
        method: isFav ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(user?.id ? { 'x-user-id': user.id } : {}),
        },
        body: isFav ? undefined : JSON.stringify({ toolId }),
      });
    } catch {}
  };

  const recordUsage = async (toolId: string) => {
    try {
      await fetch('/api/toolkit/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(user?.id ? { 'x-user-id': user.id } : {}),
        },
        body: JSON.stringify({ toolId }),
      });
    } catch {}
  };

  const handleOpenTool = (toolId: string) => {
    setActiveToolId(toolId);
    recordUsage(toolId);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((t) => {
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
    { id: 'all', label: 'All Utilities', count: ALL_TOOLS.length },
    { id: 'calculators', label: 'Calculators', count: ALL_TOOLS.filter((t) => t.category === 'calculators').length },
    { id: 'productivity', label: 'Productivity', count: ALL_TOOLS.filter((t) => t.category === 'productivity').length },
    { id: 'documents', label: 'Text & Docs', count: ALL_TOOLS.filter((t) => t.category === 'documents').length },
    { id: 'programming', label: 'Tech & Code', count: ALL_TOOLS.filter((t) => t.category === 'programming').length },
    { id: 'college', label: 'College & Dates', count: ALL_TOOLS.filter((t) => t.category === 'college').length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
            <Wrench className="w-80 h-80 text-white" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official KAMPUS Academic Utility Suite</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Student Toolkit</h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              30+ instant tools for everyday calculations, semester grades, attendance safe-zones, focus sessions, document formatting, QR codes, and tech utilities.
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tools (e.g. attendance, cgpa, qr, diff)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                onlyFavorites
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
              <span>Favorites ({favorites.length})</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching tools found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search terms or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTools.map((tool) => {
              const IconComp = tool.icon;
              const isFav = favorites.includes(tool.id);

              return (
                <div
                  key={tool.id}
                  onClick={() => handleOpenTool(tool.id)}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(tool.id, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    <span className="capitalize text-slate-400 dark:text-slate-500">{tool.category}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Open Tool <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal / Overlay for Active Tool */}
        {activeToolId && (
          <ToolModal
            toolId={activeToolId}
            onClose={() => setActiveToolId(null)}
            copyToClipboard={copyToClipboard}
            copiedKey={copiedKey}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MODAL WORKSPACE FOR ACTIVE TOOL
// ============================================================================

interface ToolModalProps {
  toolId: string;
  onClose: () => void;
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

const ToolModal: React.FC<ToolModalProps> = ({ toolId, onClose, copyToClipboard, copiedKey }) => {
  const tool = ALL_TOOLS.find((t) => t.id === toolId);
  if (!tool) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <tool.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{tool.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tool.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {toolId === 'scientific-calc' && <ScientificCalculatorView />}
          {toolId === 'cgpa-calc' && <CgpaCalculatorView />}
          {toolId === 'sgpa-calc' && <SgpaCalculatorView />}
          {toolId === 'percentage-calc' && <PercentageCalculatorView />}
          {toolId === 'attendance-calc' && <AttendanceCalculatorView />}
          {toolId === 'pomodoro-timer' && <PomodoroTimerView />}
          {toolId === 'todo-list' && <TodoListView />}
          {toolId === 'exam-countdown' && <ExamCountdownView />}
          {toolId === 'quick-notes' && <QuickNotesView />}
          {toolId === 'word-counter' && <WordCounterView />}
          {toolId === 'case-converter' && <CaseConverterView copyToClipboard={copyToClipboard} copiedKey={copiedKey} />}
          {toolId === 'text-cleaner' && <TextCleanerView copyToClipboard={copyToClipboard} copiedKey={copiedKey} />}
          {toolId === 'text-compare' && <TextCompareView />}
          {toolId === 'qr-generator' && <QrGeneratorView copyToClipboard={copyToClipboard} copiedKey={copiedKey} />}
          {toolId === 'binary-converter' && <BinaryConverterView copyToClipboard={copyToClipboard} copiedKey={copiedKey} />}
          {toolId === 'number-base-converter' && <NumberBaseConverterView copyToClipboard={copyToClipboard} copiedKey={copiedKey} />}
          {toolId === 'unit-converter' && <UnitConverterView />}
          {toolId === 'data-size-converter' && <DataSizeConverterView />}
          {toolId === 'password-generator' && <PasswordGeneratorView copyToClipboard={copyToClipboard} copiedKey={copiedKey} />}
          {toolId === 'color-converter' && <ColorConverterView copyToClipboard={copyToClipboard} copiedKey={copiedKey} />}
          {toolId === 'code-formatter' && <CodeFormatterView copyToClipboard={copyToClipboard} copiedKey={copiedKey} />}
          {toolId === 'age-calculator' && <AgeCalculatorView />}
          {toolId === 'date-difference' && <DateDifferenceView />}
          {toolId === 'marks-grade-calc' && <MarksGradeView />}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 1. SCIENTIFIC CALCULATOR COMPONENT
// ============================================================================
const ScientificCalculatorView: React.FC = () => {
  const [expr, setExpr] = useState('');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [history, setHistory] = useState<string[]>([]);
  const { result, error } = evaluateScientificExpression(expr, angleMode);

  const append = (val: string) => setExpr((prev) => prev + val);
  const clear = () => setExpr('');
  const backspace = () => setExpr((prev) => prev.slice(0, -1));

  const handleEqual = () => {
    if (result !== null && !error) {
      setHistory((prev) => [`${expr} = ${result}`, ...prev].slice(0, 8));
      setExpr(String(result));
    }
  };

  const btnClass = "py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-all active:scale-95";
  const opClass = "py-2.5 px-3 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200 font-bold text-xs sm:text-sm transition-all active:scale-95";

  return (
    <div className="space-y-4">
      {/* Display */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <button
            onClick={() => setAngleMode(angleMode === 'deg' ? 'rad' : 'deg')}
            className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold"
          >
            {angleMode.toUpperCase()}
          </button>
          <span>{expr || '0'}</span>
        </div>
        <div className="text-right text-2xl font-black text-slate-900 dark:text-slate-100">
          {error ? <span className="text-red-500 text-sm font-semibold">{error}</span> : result ?? '0'}
        </div>
      </div>

      {/* Calculator Buttons Grid */}
      <div className="grid grid-cols-5 gap-2">
        <button onClick={() => append('sin(')} className={btnClass}>sin</button>
        <button onClick={() => append('cos(')} className={btnClass}>cos</button>
        <button onClick={() => append('tan(')} className={btnClass}>tan</button>
        <button onClick={() => append('pi')} className={btnClass}>π</button>
        <button onClick={clear} className="py-2.5 px-3 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 font-bold text-xs">AC</button>

        <button onClick={() => append('log(')} className={btnClass}>log</button>
        <button onClick={() => append('ln(')} className={btnClass}>ln</button>
        <button onClick={() => append('sqrt(')} className={btnClass}>√</button>
        <button onClick={() => append('^')} className={btnClass}>x^y</button>
        <button onClick={backspace} className={btnClass}>⌫</button>

        <button onClick={() => append('(')} className={btnClass}>(</button>
        <button onClick={() => append(')')} className={btnClass}>)</button>
        <button onClick={() => append('!')} className={btnClass}>n!</button>
        <button onClick={() => append('%')} className={btnClass}>%</button>
        <button onClick={() => append('/')} className={opClass}>÷</button>

        <button onClick={() => append('7')} className={btnClass}>7</button>
        <button onClick={() => append('8')} className={btnClass}>8</button>
        <button onClick={() => append('9')} className={btnClass}>9</button>
        <button onClick={() => append('*')} className={opClass}>×</button>
        <button onClick={() => append('-')} className={opClass}>−</button>

        <button onClick={() => append('4')} className={btnClass}>4</button>
        <button onClick={() => append('5')} className={btnClass}>5</button>
        <button onClick={() => append('6')} className={btnClass}>6</button>
        <button onClick={() => append('+')} className={opClass}>+</button>
        <button onClick={() => append('e')} className={btnClass}>e</button>

        <button onClick={() => append('1')} className={btnClass}>1</button>
        <button onClick={() => append('2')} className={btnClass}>2</button>
        <button onClick={() => append('3')} className={btnClass}>3</button>
        <button onClick={() => append('0')} className={btnClass}>0</button>
        <button onClick={() => append('.')} className={btnClass}>.</button>
      </div>

      <button
        onClick={handleEqual}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-sm active:scale-95 transition-all"
      >
        = Calculate
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="pt-2">
          <div className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
            <span>Calculation History</span>
            <button onClick={() => setHistory([])} className="text-red-500 hover:underline">Clear</button>
          </div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {h}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. CGPA CALCULATOR COMPONENT
// ============================================================================
const CgpaCalculatorView: React.FC = () => {
  const [semesters, setSemesters] = useState([
    { semester: 1, credits: 20, sgpa: 8.5 },
    { semester: 2, credits: 22, sgpa: 8.2 },
    { semester: 3, credits: 24, sgpa: 8.8 },
  ]);

  const addSemester = () => {
    setSemesters((prev) => [
      ...prev,
      { semester: prev.length + 1, credits: 20, sgpa: 8.0 },
    ]);
  };

  const removeSemester = (idx: number) => {
    setSemesters((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSem = (idx: number, field: 'credits' | 'sgpa', val: number) => {
    setSemesters((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    );
  };

  const result = calculateCGPA(semesters);

  return (
    <div className="space-y-4">
      {/* Result Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-200">Cumulative CGPA</span>
          <div className="text-3xl font-black">{result.cgpa.toFixed(2)}</div>
          <span className="text-xs text-blue-100">AICTE Equivalent: {result.percentageEstimate}%</span>
        </div>
        <div className="text-right text-xs text-blue-200">
          <div>Total Credits: {result.totalCredits}</div>
          <div>{semesters.length} Semesters</div>
        </div>
      </div>

      {/* Semesters list */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {semesters.map((sem, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold w-16">Sem {sem.semester}</span>
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 block">Credits</label>
              <input
                type="number"
                value={sem.credits}
                onChange={(e) => updateSem(idx, 'credits', parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-semibold p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 block">SGPA (out of 10)</label>
              <input
                type="number"
                step="0.01"
                max="10"
                value={sem.sgpa}
                onChange={(e) => updateSem(idx, 'sgpa', parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-semibold p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            {semesters.length > 1 && (
              <button onClick={() => removeSemester(idx)} className="text-slate-400 hover:text-red-500 pt-3">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addSemester}
        className="w-full py-2.5 rounded-xl border border-dashed border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-bold flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Add Semester
      </button>
    </div>
  );
};

// ============================================================================
// 3. SGPA CALCULATOR COMPONENT
// ============================================================================
const SgpaCalculatorView: React.FC = () => {
  const [courses, setCourses] = useState([
    { name: 'Data Structures & Algorithms', credits: 4, gradePoint: 9 },
    { name: 'Operating Systems', credits: 4, gradePoint: 8 },
    { name: 'Database Management Systems', credits: 3, gradePoint: 9 },
    { name: 'Computer Networks', credits: 3, gradePoint: 7 },
  ]);

  const addCourse = () => {
    setCourses((prev) => [...prev, { name: `Subject ${prev.length + 1}`, credits: 3, gradePoint: 8 }]);
  };

  const removeCourse = (idx: number) => {
    setCourses((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCourse = (idx: number, field: string, val: any) => {
    setCourses((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c)));
  };

  const result = calculateSGPA(courses);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-200">Semester SGPA</span>
          <div className="text-3xl font-black">{result.sgpa.toFixed(2)}</div>
          <span className="text-xs text-emerald-100">Estimated Marks: ~{result.percentageEstimate}%</span>
        </div>
        <div className="text-right text-xs text-emerald-200">
          <div>Total Credits: {result.totalCredits}</div>
          <div>{courses.length} Courses</div>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {courses.map((c, idx) => (
          <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 block">Course Name</label>
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateCourse(idx, 'name', e.target.value)}
                className="w-full text-xs font-semibold p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="w-20">
              <label className="text-[10px] text-slate-400 block">Credits</label>
              <input
                type="number"
                value={c.credits}
                onChange={(e) => updateCourse(idx, 'credits', parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-semibold p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="w-24">
              <label className="text-[10px] text-slate-400 block">Grade Point</label>
              <input
                type="number"
                step="0.5"
                max="10"
                value={c.gradePoint}
                onChange={(e) => updateCourse(idx, 'gradePoint', parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-semibold p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            {courses.length > 1 && (
              <button onClick={() => removeCourse(idx)} className="text-slate-400 hover:text-red-500 pt-3">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addCourse}
        className="w-full py-2.5 rounded-xl border border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Add Course
      </button>
    </div>
  );
};

// ============================================================================
// 4. ATTENDANCE & SAFE ZONE CALCULATOR COMPONENT
// ============================================================================
const AttendanceCalculatorView: React.FC = () => {
  const [attended, setAttended] = useState(38);
  const [total, setTotal] = useState(48);
  const [target, setTarget] = useState(75);

  const res = calculateAttendance(attended, total, target);

  return (
    <div className="space-y-4">
      <div className={`p-5 rounded-2xl text-white ${res.isSafe ? 'bg-gradient-to-r from-emerald-600 to-green-600' : 'bg-gradient-to-r from-amber-600 to-red-600'}`}>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider opacity-80">Current Attendance</span>
            <div className="text-3xl font-black">{res.currentPercentage}%</div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
              {res.isSafe ? 'SAFE ZONE' : 'ATTENDANCE SHORTAGE'}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/95">{res.explanation}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Attended Classes</label>
          <input
            type="number"
            value={attended}
            onChange={(e) => setAttended(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Total Held</label>
          <input
            type="number"
            value={total}
            onChange={(e) => setTotal(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Target %</label>
          <select
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value, 10))}
            className="w-full text-sm font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value={75}>75% (Standard)</option>
            <option value={80}>80% (Strict)</option>
            <option value={85}>85% (Scholar)</option>
            <option value={60}>60% (Medical waiver)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. PERCENTAGE CALCULATOR COMPONENT
// ============================================================================
const PercentageCalculatorView: React.FC = () => {
  const [mode, setMode] = useState<'of_number' | 'marks' | 'change' | 'diff'>('marks');
  const [valA, setValA] = useState(420);
  const [valB, setValB] = useState(500);

  const res = calculatePercentage(mode, valA, valB);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
        <button onClick={() => setMode('marks')} className={`flex-1 py-1.5 rounded-lg font-bold ${mode === 'marks' ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}>Marks %</button>
        <button onClick={() => setMode('of_number')} className={`flex-1 py-1.5 rounded-lg font-bold ${mode === 'of_number' ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}>% of Number</button>
        <button onClick={() => setMode('change')} className={`flex-1 py-1.5 rounded-lg font-bold ${mode === 'change' ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}>% Change</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">{mode === 'marks' ? 'Marks Obtained' : mode === 'of_number' ? 'Percentage %' : 'Original Value'}</label>
          <input
            type="number"
            value={valA}
            onChange={(e) => setValA(parseFloat(e.target.value) || 0)}
            className="w-full text-sm font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">{mode === 'marks' ? 'Total Maximum Marks' : mode === 'of_number' ? 'Total Number' : 'New Value'}</label>
          <input
            type="number"
            value={valB}
            onChange={(e) => setValB(parseFloat(e.target.value) || 0)}
            className="w-full text-sm font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Calculation Result</span>
        <div className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">{res.result}%</div>
        <p className="text-xs text-slate-500 mt-1">{res.breakdown}</p>
      </div>
    </div>
  );
};

// ============================================================================
// 6. POMODORO TIMER COMPONENT
// ============================================================================
const PomodoroTimerView: React.FC = () => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    let t: any = null;
    if (isRunning && seconds > 0) {
      t = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
      setSessionCount((c) => c + 1);
    }
    return () => clearInterval(t);
  }, [isRunning, seconds]);

  const setTimer = (mins: number) => {
    setIsRunning(false);
    setSeconds(mins * 60);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center gap-2">
        <button onClick={() => setTimer(25)} className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 text-xs font-bold">Focus (25m)</button>
        <button onClick={() => setTimer(5)} className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-xs font-bold">Short Break (5m)</button>
        <button onClick={() => setTimer(15)} className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 text-xs font-bold">Long Break (15m)</button>
      </div>

      <div className="py-8">
        <div className="text-6xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-wider">{timeStr}</div>
        <span className="text-xs text-slate-500 mt-2 block">{isRunning ? 'Deep focus session active...' : 'Session paused'}</span>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-6 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-sm ${isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Pause Session' : 'Start Focus'}
        </button>
        <button
          onClick={() => setTimer(25)}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-slate-400">Completed Sessions Today: <span className="font-bold text-slate-700 dark:text-slate-200">{sessionCount}</span></div>
    </div>
  );
};

// ============================================================================
// 7. TO-DO & TASKS COMPONENT
// ============================================================================
const TodoListView: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Revise Graph Algorithms for Midterm', subject: 'CS301', priority: 'high', done: false },
    { id: '2', title: 'Submit Operating Systems Lab 4', subject: 'CS304', priority: 'medium', done: true },
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newTitle.trim(), subject: newSubject, priority, done: false },
    ]);
    setNewTitle('');
  };

  const toggleDone = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New study task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
        />
        <select
          value={priority}
          onChange={(e: any) => setPriority(e.target.value)}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button onClick={addTask} className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs">Add</button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleDone(task.id)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <div className="flex-1">
              <span className={`text-xs font-semibold block ${task.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {task.title}
              </span>
              <span className="text-[10px] text-slate-400">{task.subject} • Priority: {task.priority}</span>
            </div>
            <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 8. EXAM COUNTDOWN COMPONENT
// ============================================================================
const ExamCountdownView: React.FC = () => {
  const [exams, setExams] = useState([
    { id: '1', name: 'Algorithms End-Semester', subject: 'CS301', date: '2026-12-15' },
    { id: '2', name: 'Machine Learning Lab Viva', subject: 'CS308', date: '2026-12-08' },
  ]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const addExam = () => {
    if (!name.trim() || !date) return;
    setExams((prev) => [...prev, { id: Date.now().toString(), name: name.trim(), subject: 'General', date }]);
    setName('');
    setDate('');
  };

  const getDaysLeft = (targetDate: string) => {
    const d = new Date(targetDate);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Exam name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
        />
        <button onClick={addExam} className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs">Add</button>
      </div>

      <div className="space-y-2">
        {exams.map((ex) => {
          const days = getDaysLeft(ex.date);
          return (
            <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">{ex.name}</span>
                <span className="text-[10px] text-slate-400">{ex.date}</span>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${days <= 3 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {days > 0 ? `${days} Days Left` : 'Exam Today'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 9. QUICK NOTES COMPONENT
// ============================================================================
const QuickNotesView: React.FC = () => {
  const [content, setContent] = useState(() => localStorage.getItem('kampus_quick_note_draft') || '');

  const handleChange = (val: string) => {
    setContent(val);
    localStorage.setItem('kampus_quick_note_draft', val);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Auto-saving student scratchpad</span>
        <button onClick={() => handleChange('')} className="text-red-500 hover:underline">Clear</button>
      </div>
      <textarea
        rows={8}
        placeholder="Type quick lecture formulas, homework pointers, or thoughts here..."
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

// ============================================================================
// 10. WORD COUNTER COMPONENT
// ============================================================================
const WordCounterView: React.FC = () => {
  const [text, setText] = useState('');
  const stats = analyzeText(text);

  return (
    <div className="space-y-4">
      <textarea
        rows={6}
        placeholder="Paste essay, assignment, or paper draft here to analyze..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block">Words</span>
          <span className="text-base font-black text-blue-600">{stats.words}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block">Characters</span>
          <span className="text-base font-black text-slate-700 dark:text-slate-200">{stats.charactersWithSpaces}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block">No Spaces</span>
          <span className="text-base font-black text-slate-700 dark:text-slate-200">{stats.charactersWithoutSpaces}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block">Sentences</span>
          <span className="text-base font-black text-slate-700 dark:text-slate-200">{stats.sentences}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block">Paragraphs</span>
          <span className="text-base font-black text-slate-700 dark:text-slate-200">{stats.paragraphs}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block">Reading Time</span>
          <span className="text-base font-black text-emerald-600">~{stats.readingTimeMinutes}m</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 11. CASE CONVERTER COMPONENT
// ============================================================================
const CaseConverterView: React.FC<{ copyToClipboard: (text: string, key: string) => void; copiedKey: string | null }> = ({ copyToClipboard, copiedKey }) => {
  const [text, setText] = useState('');

  const applyMode = (mode: any) => {
    setText((prev) => convertTextCase(prev, mode));
  };

  return (
    <div className="space-y-4">
      <textarea
        rows={5}
        placeholder="Type or paste text to transform..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => applyMode('upper')} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200">UPPERCASE</button>
        <button onClick={() => applyMode('lower')} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200">lowercase</button>
        <button onClick={() => applyMode('title')} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200">Title Case</button>
        <button onClick={() => applyMode('sentence')} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200">Sentence case</button>
        <button onClick={() => applyMode('camel')} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200">camelCase</button>
        <button onClick={() => applyMode('snake')} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200">snake_case</button>
      </div>
      <button
        onClick={() => copyToClipboard(text, 'case-copy')}
        className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
      >
        {copiedKey === 'case-copy' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
        {copiedKey === 'case-copy' ? 'Copied to Clipboard!' : 'Copy Converted Text'}
      </button>
    </div>
  );
};

// ============================================================================
// 12. TEXT CLEANER COMPONENT
// ============================================================================
const TextCleanerView: React.FC<{ copyToClipboard: (text: string, key: string) => void; copiedKey: string | null }> = ({ copyToClipboard, copiedKey }) => {
  const [text, setText] = useState('');
  const [removeSpaces, setRemoveSpaces] = useState(true);
  const [removeBlank, setRemoveBlank] = useState(true);

  const clean = () => {
    setText((prev) => cleanText(prev, { removeExtraSpaces: removeSpaces, removeBlankLines: removeBlank, trimLines: true }));
  };

  return (
    <div className="space-y-4">
      <textarea
        rows={6}
        placeholder="Paste text with messy formatting, duplicate lines or extra tabs..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-4 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={removeSpaces} onChange={(e) => setRemoveSpaces(e.target.checked)} className="rounded text-blue-600" />
          <span>Strip Extra Spaces</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={removeBlank} onChange={(e) => setRemoveBlank(e.target.checked)} className="rounded text-blue-600" />
          <span>Strip Multiple Blank Lines</span>
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={clean} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs">Clean Text</button>
        <button onClick={() => copyToClipboard(text, 'clean-copy')} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          {copiedKey === 'clean-copy' ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 13. TEXT COMPARE (DIFF) COMPONENT
// ============================================================================
const TextCompareView: React.FC = () => {
  const [orig, setOrig] = useState('First draft of project proposal.\nTarget deadline is Dec 1st.');
  const [revised, setRevised] = useState('Final draft of university project proposal.\nTarget deadline is Dec 5th.');
  const diffs = compareTexts(orig, revised);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Original Text</label>
          <textarea
            rows={4}
            value={orig}
            onChange={(e) => setOrig(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Revised Text</label>
          <textarea
            rows={4}
            value={revised}
            onChange={(e) => setRevised(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-h-52 overflow-y-auto font-mono text-xs space-y-1">
        {diffs.map((d, i) => (
          <div
            key={i}
            className={`p-1 rounded flex items-start gap-2 ${
              d.type === 'added' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' :
              d.type === 'removed' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="font-bold">{d.type === 'added' ? '+' : d.type === 'removed' ? '−' : ' '}</span>
            <span className="flex-1">{d.content || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 14. QR CODE GENERATOR COMPONENT
// ============================================================================
const QrGeneratorView: React.FC<{ copyToClipboard: (text: string, key: string) => void; copiedKey: string | null }> = () => {
  const [inputVal, setInputVal] = useState('https://kampus-student.edu');
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!inputVal.trim()) {
      setDataUrl('');
      return;
    }
    QRCode.toDataURL(inputVal.trim(), { width: 250, margin: 2 }, (err, url) => {
      if (!err && url) setDataUrl(url);
    });
  }, [inputVal]);

  const downloadQr = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'kampus_qr_code.png';
    a.click();
  };

  return (
    <div className="space-y-4 text-center">
      <input
        type="text"
        placeholder="Enter URL, text, or phone number to generate QR..."
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
      />

      {dataUrl && (
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm inline-block">
            <img src={dataUrl} alt="QR Code" className="w-48 h-48" />
          </div>
          <button
            onClick={downloadQr}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Download QR Code PNG
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 15. BINARY & NUMBER BASE CONVERTERS
// ============================================================================
const BinaryConverterView: React.FC<{ copyToClipboard: (text: string, key: string) => void; copiedKey: string | null }> = ({ copyToClipboard, copiedKey }) => {
  const [dec, setDec] = useState('42');
  const res = convertNumberBase(dec, 10);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-1">Decimal (Base 10)</label>
        <input
          type="number"
          value={dec}
          onChange={(e) => setDec(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
        />
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">Binary (Base 2)</span>
            <span className="text-base font-mono font-bold text-blue-600">{res.binary || '0'}</span>
          </div>
          <button onClick={() => copyToClipboard(res.binary, 'bin')} className="text-xs text-slate-400 hover:text-blue-500">
            {copiedKey === 'bin' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

const NumberBaseConverterView: React.FC<{ copyToClipboard: (text: string, key: string) => void; copiedKey: string | null }> = ({ copyToClipboard, copiedKey }) => {
  const [inputVal, setInputVal] = useState('255');
  const [base, setBase] = useState<2 | 8 | 10 | 16>(10);
  const res = convertNumberBase(inputVal, base);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 block mb-1">Value</label>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
          />
        </div>
        <div className="w-28">
          <label className="text-xs font-bold text-slate-500 block mb-1">Base</label>
          <select
            value={base}
            onChange={(e: any) => setBase(parseInt(e.target.value, 10) as any)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <option value={10}>Decimal (10)</option>
            <option value={2}>Binary (2)</option>
            <option value={8}>Octal (8)</option>
            <option value={16}>Hex (16)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block font-sans">Decimal (10)</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{res.decimal}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block font-sans">Binary (2)</span>
          <span className="font-bold text-blue-600">{res.binary}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block font-sans">Octal (8)</span>
          <span className="font-bold text-indigo-600">{res.octal}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 block font-sans">Hexadecimal (16)</span>
          <span className="font-bold text-emerald-600">{res.hex}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 16. UNIT CONVERTER COMPONENT
// ============================================================================
const UnitConverterView: React.FC = () => {
  const [category, setCategory] = useState<'length' | 'mass' | 'temp' | 'speed'>('length');
  const [val, setVal] = useState(10);
  const [fromUnit, setFromUnit] = useState('Kilometer');
  const [toUnit, setToUnit] = useState('Mile');

  const unitOptions: Record<string, string[]> = {
    length: ['Meter', 'Kilometer', 'Centimeter', 'Millimeter', 'Mile', 'Yard', 'Foot', 'Inch'],
    mass: ['Kilogram', 'Gram', 'Milligram', 'Pound', 'Ounce'],
    temp: ['Celsius', 'Fahrenheit', 'Kelvin'],
    speed: ['m/s', 'km/h', 'mph', 'Knot'],
  };

  const handleCategoryChange = (c: any) => {
    setCategory(c);
    setFromUnit(unitOptions[c][0]);
    setToUnit(unitOptions[c][1] || unitOptions[c][0]);
  };

  const res = convertUniversalUnits(val, category, fromUnit, toUnit);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
        {['length', 'mass', 'temp', 'speed'].map((c) => (
          <button
            key={c}
            onClick={() => handleCategoryChange(c)}
            className={`flex-1 py-1.5 rounded-lg capitalize font-bold ${category === c ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 items-center">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Value</label>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">From</label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          >
            {unitOptions[category].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">To</label>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          >
            {unitOptions[category].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
        <span className="text-xs text-slate-400 font-bold">Converted Output</span>
        <div className="text-2xl font-black text-blue-600 mt-1">{res.toValue} {res.toUnit}</div>
        <p className="text-[10px] text-slate-400 mt-1">{res.formula}</p>
      </div>
    </div>
  );
};

// ============================================================================
// 17. DATA SIZE CONVERTER COMPONENT
// ============================================================================
const DataSizeConverterView: React.FC = () => {
  const [val, setVal] = useState(1024);
  const [from, setFrom] = useState<'B' | 'KB' | 'MB' | 'GB' | 'TB'>('MB');
  const [to, setTo] = useState<'B' | 'KB' | 'MB' | 'GB' | 'TB'>('GB');
  const res = convertDataSize(val, from, to);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Size</label>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">From</label>
          <select
            value={from}
            onChange={(e: any) => setFrom(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          >
            {['B', 'KB', 'MB', 'GB', 'TB'].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">To</label>
          <select
            value={to}
            onChange={(e: any) => setTo(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          >
            {['B', 'KB', 'MB', 'GB', 'TB'].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
        <div className="text-2xl font-black text-blue-600">{res.result} {to}</div>
        <p className="text-[10px] text-slate-400 mt-1">{res.formula}</p>
      </div>
    </div>
  );
};

// ============================================================================
// 18. PASSWORD GENERATOR COMPONENT
// ============================================================================
const PasswordGeneratorView: React.FC<{ copyToClipboard: (text: string, key: string) => void; copiedKey: string | null }> = ({ copyToClipboard, copiedKey }) => {
  const [len, setLen] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [num, setNum] = useState(true);
  const [sym, setSym] = useState(true);
  const [pwd, setPwd] = useState('');

  const generate = () => {
    setPwd(generateSecurePassword({ length: len, includeUpper: upper, includeLower: lower, includeNumbers: num, includeSymbols: sym }));
  };

  useEffect(() => {
    generate();
  }, [len, upper, lower, num, sym]);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 break-all select-all">{pwd}</span>
        <button onClick={generate} className="p-2 text-slate-500 hover:text-blue-500" title="Regenerate">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <div className="flex justify-between mb-1">
            <span>Password Length</span>
            <span className="font-bold">{len} chars</span>
          </div>
          <input
            type="range"
            min="8"
            max="40"
            value={len}
            onChange={(e) => setLen(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="rounded text-blue-600" />
            <span>Uppercase (A-Z)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} className="rounded text-blue-600" />
            <span>Lowercase (a-z)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={num} onChange={(e) => setNum(e.target.checked)} className="rounded text-blue-600" />
            <span>Numbers (0-9)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={sym} onChange={(e) => setSym(e.target.checked)} className="rounded text-blue-600" />
            <span>Symbols (!@#$)</span>
          </label>
        </div>
      </div>

      <button
        onClick={() => copyToClipboard(pwd, 'pwd')}
        className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
      >
        {copiedKey === 'pwd' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
        {copiedKey === 'pwd' ? 'Password Copied!' : 'Copy Secure Password'}
      </button>
    </div>
  );
};

// ============================================================================
// 19. COLOR CONVERTER COMPONENT
// ============================================================================
const ColorConverterView: React.FC<{ copyToClipboard: (text: string, key: string) => void; copiedKey: string | null }> = ({ copyToClipboard, copiedKey }) => {
  const [colorInput, setColorInput] = useState('#2563EB');
  const res = convertColor(colorInput);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={res.isValid ? res.hex : '#000000'}
          onChange={(e) => setColorInput(e.target.value)}
          className="w-12 h-12 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5"
        />
        <input
          type="text"
          value={colorInput}
          onChange={(e) => setColorInput(e.target.value)}
          placeholder="#HEX or rgb(r, g, b)"
          className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
        />
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
          <span className="text-slate-400">HEX:</span>
          <span className="font-bold">{res.hex}</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
          <span className="text-slate-400">RGB:</span>
          <span className="font-bold">{res.rgb}</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
          <span className="text-slate-400">HSL:</span>
          <span className="font-bold">{res.hsl}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 20. CODE FORMATTER COMPONENT
// ============================================================================
const CodeFormatterView: React.FC<{ copyToClipboard: (text: string, key: string) => void; copiedKey: string | null }> = ({ copyToClipboard, copiedKey }) => {
  const [code, setCode] = useState('{"university":"KAMPUS","tools":30,"status":"production"}');
  const [lang, setLang] = useState<'json' | 'html' | 'css' | 'js'>('json');
  const res = formatCode(code, lang);

  const applyFormat = () => {
    if (!res.error) setCode(res.formatted);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs">
        <div className="flex gap-2">
          {['json', 'html', 'css', 'js'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l as any)}
              className={`px-2.5 py-1 rounded font-bold uppercase ${lang === l ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <button onClick={applyFormat} className="text-blue-600 font-bold hover:underline">Format & Beautify</button>
      </div>

      <textarea
        rows={7}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none"
      />

      {res.error && (
        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 text-xs font-semibold">
          {res.error}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 21. AGE CALCULATOR COMPONENT
// ============================================================================
const AgeCalculatorView: React.FC = () => {
  const [dob, setDob] = useState('2004-06-15');
  const res = calculateAge(dob);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-1">Date of Birth</label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        />
      </div>

      {res && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <span className="text-[10px] text-slate-400 block">Years</span>
            <span className="text-2xl font-black text-blue-600">{res.years}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <span className="text-[10px] text-slate-400 block">Months</span>
            <span className="text-2xl font-black text-blue-600">{res.months}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <span className="text-[10px] text-slate-400 block">Days</span>
            <span className="text-2xl font-black text-blue-600">{res.days}</span>
          </div>
        </div>
      )}

      {res && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-center text-slate-500">
          Total lived: <span className="font-bold text-slate-800 dark:text-slate-200">{res.totalDays.toLocaleString()} days</span> ({res.totalHours.toLocaleString()} hours) • Next birthday in <span className="font-bold text-emerald-600">{res.nextBirthdayDays} days</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 22. DATE DIFFERENCE COMPONENT
// ============================================================================
const DateDifferenceView: React.FC = () => {
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState('2026-12-15');
  const res = calculateDateDifference(start, end);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Start Date</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">End Date</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          />
        </div>
      </div>

      {res && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
          <div className="text-2xl font-black text-blue-600">{res.totalDays} Total Days</div>
          <p className="text-xs text-slate-500 mt-1">{res.breakdown}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 23. MARKS & GRADE SCALE COMPONENT
// ============================================================================
const MarksGradeView: React.FC = () => {
  const [marks, setMarks] = useState(84);
  const res10 = convertMarksToGrade(marks, '10-point');
  const res4 = convertMarksToGrade(marks, '4-point');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-1">Marks Percentage (out of 100)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={marks}
          onChange={(e) => setMarks(parseFloat(e.target.value) || 0)}
          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
          <span className="text-xs text-slate-400 font-bold">10-Point UGC Scale</span>
          <div className="text-3xl font-black text-blue-600 mt-1">{res10.grade}</div>
          <span className="text-xs text-slate-500">{res10.gradePoint} Points • {res10.description}</span>
        </div>
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
          <span className="text-xs text-slate-400 font-bold">4.0 GPA Scale</span>
          <div className="text-3xl font-black text-indigo-600 mt-1">{res4.grade}</div>
          <span className="text-xs text-slate-500">{res4.gradePoint} GPA • {res4.description}</span>
        </div>
      </div>
    </div>
  );
};
