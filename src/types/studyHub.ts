export type EducationLevel =
  | 'School'
  | 'Class 11 & 12'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Competitive Exams';

export type StudyHubTab =
  | 'dashboard'
  | 'subjects'
  | 'library'
  | 'notes'
  | 'pyqs'
  | 'qbank'
  | 'tests'
  | 'analytics'
  | 'saved'
  | 'reminders';

export type MaterialCategory =
  | 'PDF Notes'
  | 'Text Notes'
  | 'Study Guides'
  | 'Reference Books'
  | 'Handwritten Notes'
  | 'Presentations'
  | 'Previous Year Papers'
  | 'Important Questions'
  | 'Subject-wise Resources';

export type QuestionType =
  | 'MCQ'
  | 'MSQ'
  | 'True/False'
  | 'Fill in the Blanks'
  | 'Short Answer'
  | 'Long Answer';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface StudyTopic {
  id: string;
  title: string;
  summary: string;
  keyConcepts: string[];
  studyNotes: string;
  estimatedMinutes: number;
  completed: boolean;
  bookmarked: boolean;
}

export interface StudyChapter {
  id: string;
  number: number;
  title: string;
  overview: string;
  learningObjectives: string[];
  topics: StudyTopic[];
  relatedMaterialIds: string[];
  completed: boolean;
  bookmarked: boolean;
  lastTopicId?: string;
  personalChapterNotes: string;
}

export interface StudySubject {
  id: string;
  code: string;
  name: string;
  level: EducationLevel;
  course: string;
  semesterOrClass: string;
  description: string;
  imageUrl: string;
  accentColor: 'blue' | 'orange' | 'emerald' | 'indigo' | 'slate';
  chapters: StudyChapter[];
  isCustom?: boolean;
  lastAccessedAt: string;
}

export interface StudyMaterialItem {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  chapterName: string;
  semester: string;
  category: MaterialCategory;
  uploadedBy: string;
  uploadDate: string;
  fileType: 'PDF' | 'DOCX' | 'PPTX' | 'TXT' | 'MD';
  fileSize: string;
  pages: number;
  downloads: number;
  description: string;
  previewContent: string;
  bookmarked: boolean;
  isVerifiedSample: boolean;
  reportedReason?: string;
}

export interface PersonalNote {
  id: string;
  title: string;
  description: string;
  content: string;
  subjectId: string;
  chapterId?: string;
  pinned: boolean;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  course: string;
  semester: string;
  year: number;
  examType: 'Mid-Sem' | 'End-Sem' | 'Unit Test' | 'Mock Archive';
  durationMinutes: number;
  totalMarks: number;
  fileSize: string;
  bookmarked: boolean;
  isVerifiedSample: boolean;
  isUserUploaded?: boolean;
  paperTextPreview: string;
  questionIds: string[];
}

export interface QuestionBankItem {
  id: string;
  subjectId: string;
  chapterId: string;
  chapterName: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  question: string;
  options?: string[];
  correctAnswer?: string; // for MCQ, True/False, Fill in the Blanks
  correctAnswers?: string[]; // for MSQ
  modelAnswer?: string; // for Short/Long Answer
  explanation: string;
  marks: number;
  isImportant: boolean;
  isPyq?: boolean;
  pyqYear?: number;
  bookmarked: boolean;
}

export interface PracticeTestAnswerRecord {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  markedForReview: boolean;
}

export interface PracticeTestResult {
  id: string;
  title: string;
  mode: 'Chapter Test' | 'Subject Test' | 'Custom Test' | 'PYQ Practice';
  subjectId: string;
  date: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracyPercent: number;
  timeTakenSeconds: number;
  answersDetail: PracticeTestAnswerRecord[];
}

export interface UploadedResource {
  id: string;
  name: string;
  originalName: string;
  fileType: 'PDF' | 'DOC' | 'PPT' | 'IMAGE' | 'TXT';
  mimeType: string;
  sizeBytes: number;
  sizeLabel: string;
  subjectId: string;
  category: MaterialCategory;
  uploadedAt: string;
  previewDataUrl?: string;
  textPreview?: string;
}

export interface StudyReminder {
  id: string;
  title: string;
  type: 'Chapter Completion' | 'Practice Test' | 'Daily Goal' | 'Revision';
  subjectId?: string;
  dueDateTime: string;
  completed: boolean;
  syncedToNotifications: boolean;
  notes?: string;
}

export interface DailyStudyLog {
  dayLabel: string; // e.g., 'Mon'
  dateIso: string;
  minutes: number;
  isRecordedUserActivity: boolean;
}

export interface StudyHubState {
  subjects: StudySubject[];
  materials: StudyMaterialItem[];
  notes: PersonalNote[];
  papers: QuestionPaper[];
  questions: QuestionBankItem[];
  testHistory: PracticeTestResult[];
  uploads: UploadedResource[];
  reminders: StudyReminder[];
  weeklyLogs: DailyStudyLog[];
  dailyGoalMinutes: number;
  recentSearches: string[];
  activeReadingPosition: {
    subjectId: string;
    chapterId: string;
    topicId: string;
  };
}
