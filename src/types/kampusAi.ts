export type AiLanguage = 'English' | 'Hindi' | 'Hinglish';
export type AiLearningLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type AiResponseStyle =
  | 'Simple Explanation'
  | 'Detailed Explanation'
  | 'Exam-Oriented Answer'
  | 'Short Revision Answer'
  | 'Beginner-Friendly Explanation';

export type AiToolId =
  | 'home'
  | 'chat'
  | 'explain'
  | 'notes'
  | 'quiz'
  | 'solver'
  | 'documents'
  | 'flashcards'
  | 'exam-prep'
  | 'planner'
  | 'ask-notes'
  | 'history'
  | 'saved';

export interface AiServiceStatus {
  available: boolean;
  model: string;
  provider: string;
  maxUploadBytes: number;
  supportedFormats: string[];
  message: string;
  checkedAt?: string;
}

export interface AiAttachment {
  id: string;
  fileName: string;
  kind: 'pdf' | 'docx' | 'pptx' | 'text' | 'image' | 'studyhub';
  mimeType: string;
  sizeBytes?: number;
  pageOrSlideCount?: number;
  extractedText?: string;
  base64Data?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: Array<{ fileName: string; kind: string }>;
  error?: boolean;
  followUps?: string[];
}

export interface AiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AiChatMessage[];
  attachments: AiAttachment[];
}

export interface TopicExplanationOutput {
  introduction: string;
  simpleDefinition: string;
  detailedExplanation: string;
  importantConcepts: string[];
  stepByStepBreakdown: string[];
  realLifeExamples: string[];
  importantFormulas: string[];
  keyPoints: string[];
  commonMistakes: string[];
  quickRevisionSummary: string;
}

export interface GeneratedNotesOutput {
  title: string;
  completeNotes: string;
  shortRevisionNotes: string;
  examOrientedNotes: string;
  definitions: string[];
  keyConcepts: string[];
  formulas: string[];
  diagramExplanation: string;
  importantQuestions: string[];
  quickRevisionPoints: string[];
}

export interface GeneratedQuizQuestion {
  id: string;
  type: 'MCQ' | 'MSQ' | 'True/False' | 'Fill in the Blanks' | 'Short Answer';
  difficulty: string;
  topicTag: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  modelAnswer?: string;
  explanation: string;
}

export interface GeneratedQuizOutput {
  title: string;
  questions: GeneratedQuizQuestion[];
}

export interface SolvedQuestionOutput {
  needsClarification: boolean;
  clarificationPrompt: string;
  questionUnderstanding: string;
  relevantConcepts: string[];
  formulas: string[];
  solutionSteps: string[];
  finalAnswer: string;
  whyCorrect: string;
}

export interface DocumentAnalysisOutput {
  title: string;
  markdownOutput: string;
  keyPoints: string[];
  references: string[];
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mastered: boolean;
  markedDifficult: boolean;
  bookmarked: boolean;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  sourceLabel: string;
  createdAt: string;
  cards: FlashcardItem[];
}

export interface ExamPrepOutput {
  officialSyllabusBoundaryNote: string;
  disclaimer: string;
  dailyTargets: string[];
  weeklyTimetable: Array<{ day: string; focus: string; hours: string }>;
  importantTopics: string[];
  revisionSchedule: string[];
  practiceRecommendations: string[];
}

export interface StudyPlanTask {
  id: string;
  timeSlot: string;
  task: string;
  subject: string;
  type: string;
  completed: boolean;
}

export interface StudyPlanOutput {
  title: string;
  dailyPlan: StudyPlanTask[];
  weeklyTimetable: string[];
  subjectAllocation: string[];
  revisionSessions: string[];
  practiceSessions: string[];
  breakRecommendations: string[];
}

export interface AskNotesOutput {
  foundInNotes: string;
  additionalAiExplanation: string;
  sourceReferences: string[];
  generatedQuestions: string[];
}

export type AiHistoryCategory =
  | 'Conversations'
  | 'Generated Notes'
  | 'Quizzes'
  | 'Flashcards'
  | 'Solved Questions'
  | 'PDF Summaries'
  | 'Study Plans'
  | 'Explanations';

export interface AiHistoryEntry {
  id: string;
  category: AiHistoryCategory;
  toolId: AiToolId;
  title: string;
  subtitle: string;
  createdAt: string;
  payload: any;
}

export type SavedCollectionName =
  | 'All'
  | 'Explanations'
  | 'Conversations'
  | 'Notes'
  | 'Quiz Results'
  | 'Flashcards'
  | 'Solutions'
  | 'Summaries'
  | 'Study Plans';

export interface AiSavedItem {
  id: string;
  collection: Exclude<SavedCollectionName, 'All'>;
  title: string;
  summary: string;
  savedAt: string;
  toolId: AiToolId;
  data: any;
}

export interface AiUserPreferences {
  language: AiLanguage;
  learningLevel: AiLearningLevel;
  responseStyle: AiResponseStyle;
}
