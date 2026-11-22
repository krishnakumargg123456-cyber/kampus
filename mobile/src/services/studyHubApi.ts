import API_BASE_URL from '../config/api';

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyMaterial {
  id: string;
  userId: string;
  title: string;
  subject: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileSizeBytes: number;
  fileUri: string;
  isPublic: boolean;
  uploadedBy?: string;
  createdAt: string;
  lastOpenedAt?: string;
}

export interface StudyAssignment {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string; // YYYY-MM-DD
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface StudyPlannerSession {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  goals: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface QuizQuestion {
  id: string;
  subject: string;
  topic?: string;
  difficulty?: string;
  question: string;
  options: string[];
}

export interface QuizSubject {
  subject: string;
  questionCount: number;
  topics: string[];
}

export interface QuizSubmitReview {
  questionId: string;
  question: string;
  options: string[];
  selectedOption: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmitResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  review: QuizSubmitReview[];
  completedAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  subject: string;
  topic?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
}

export interface StudyProgressData {
  notes: { total: number; pinned: number };
  materials: { total: number };
  assignments: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
  planner: {
    total: number;
    completed: number;
    upcoming: number;
    estimatedStudyMinutes: number;
  };
  quiz: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
  };
  activityFeed: Array<{
    id: string;
    type: 'note' | 'assignment' | 'session' | 'quiz' | 'material';
    title: string;
    subtitle: string;
    timestamp: string;
  }>;
}

export interface StudyOverviewData {
  notesCount: number;
  materialsCount: number;
  assignmentsCount: number;
  pendingAssignmentsCount: number;
  todaySessionsCount: number;
  totalQuizAttempts: number;
  averageQuizScore: number;
  urgentAssignments: StudyAssignment[];
  todaySessions: StudyPlannerSession[];
}

function getHeaders(token?: string | null, userId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
}

// ----------------------------------------------------------------------
// 1. NOTES API
// ----------------------------------------------------------------------
export const notesApi = {
  async getNotes(params?: { search?: string; subject?: string }, token?: string | null, userId?: string | null) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.subject && params.subject !== 'All') query.append('subject', params.subject);

    const res = await fetch(`${API_BASE_URL}/api/studyhub/notes?${query.toString()}`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch notes');
    return json.data as StudyNote[];
  },

  async createNote(
    note: { title: string; content: string; subject: string; tags: string[]; pinned?: boolean },
    token?: string | null,
    userId?: string | null
  ) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/notes`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(note),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create note');
    return json.data as StudyNote;
  },

  async updateNote(
    id: string,
    updates: Partial<StudyNote>,
    token?: string | null,
    userId?: string | null
  ) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/notes/${id}`, {
      method: 'PUT',
      headers: getHeaders(token, userId),
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update note');
    return json.data as StudyNote;
  },

  async togglePin(id: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/notes/${id}/pin`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to toggle pin');
    return json.data as StudyNote;
  },

  async deleteNote(id: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/notes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete note');
    return true;
  },
};

// ----------------------------------------------------------------------
// 2. MATERIALS API
// ----------------------------------------------------------------------
export const materialsApi = {
  async getMaterials(params?: { search?: string; subject?: string }, token?: string | null, userId?: string | null) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.subject && params.subject !== 'All') query.append('subject', params.subject);

    const res = await fetch(`${API_BASE_URL}/api/studyhub/materials?${query.toString()}`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch materials');
    return json.data as StudyMaterial[];
  },

  async uploadMaterial(
    material: {
      title: string;
      subject: string;
      fileName: string;
      fileType: string;
      fileSize: string;
      fileBase64?: string;
      fileUri?: string;
      uploadedBy?: string;
    },
    token?: string | null,
    userId?: string | null
  ) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/materials`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(material),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to upload material');
    return json.data as StudyMaterial;
  },

  async markOpened(id: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/materials/${id}/opened`, {
      method: 'POST',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update opened status');
    return json.data as StudyMaterial;
  },

  async deleteMaterial(id: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/materials/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete material');
    return true;
  },
};

// ----------------------------------------------------------------------
// 3. ASSIGNMENTS API
// ----------------------------------------------------------------------
export const assignmentsApi = {
  async getAssignments(
    params?: { search?: string; status?: string; priority?: string; subject?: string; sort?: string },
    token?: string | null,
    userId?: string | null
  ) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params?.subject && params.subject !== 'All') query.append('subject', params.subject);
    if (params?.sort) query.append('sort', params.sort);

    const res = await fetch(`${API_BASE_URL}/api/studyhub/assignments?${query.toString()}`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch assignments');
    return json.data as StudyAssignment[];
  },

  async createAssignment(
    asgn: {
      title: string;
      description?: string;
      subject: string;
      dueDate: string;
      priority: 'Low' | 'Medium' | 'High';
      status?: 'Pending' | 'In Progress' | 'Completed';
    },
    token?: string | null,
    userId?: string | null
  ) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/assignments`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(asgn),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create assignment');
    return json.data as StudyAssignment;
  },

  async updateAssignment(
    id: string,
    updates: Partial<StudyAssignment>,
    token?: string | null,
    userId?: string | null
  ) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/assignments/${id}`, {
      method: 'PUT',
      headers: getHeaders(token, userId),
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update assignment');
    return json.data as StudyAssignment;
  },

  async toggleStatus(
    id: string,
    status?: 'Pending' | 'In Progress' | 'Completed',
    token?: string | null,
    userId?: string | null
  ) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/assignments/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update assignment status');
    return json.data as StudyAssignment;
  },

  async deleteAssignment(id: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/assignments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete assignment');
    return true;
  },
};

// ----------------------------------------------------------------------
// 4. PLANNER API
// ----------------------------------------------------------------------
export const plannerApi = {
  async getSessions(
    params?: { date?: string; startDate?: string; endDate?: string; subject?: string },
    token?: string | null,
    userId?: string | null
  ) {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.subject && params.subject !== 'All') query.append('subject', params.subject);

    const res = await fetch(`${API_BASE_URL}/api/studyhub/planner/sessions?${query.toString()}`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch planner sessions');
    return json.data as StudyPlannerSession[];
  },

  async createSession(
    sess: {
      subject: string;
      topic: string;
      date: string;
      startTime: string;
      endTime: string;
      goals?: string;
    },
    token?: string | null,
    userId?: string | null
  ) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/planner/sessions`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(sess),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create study session');
    return json.data as StudyPlannerSession;
  },

  async toggleComplete(id: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/planner/sessions/${id}/complete`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to toggle session');
    return json.data as StudyPlannerSession;
  },

  async deleteSession(id: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/planner/sessions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete session');
    return true;
  },
};

// ----------------------------------------------------------------------
// 5. QUIZ & PRACTICE API
// ----------------------------------------------------------------------
export const quizApi = {
  async getSubjects(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/quiz/subjects`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load quiz subjects');
    return json.data as QuizSubject[];
  },

  async getQuestions(subject?: string, count: number = 5, token?: string | null, userId?: string | null) {
    const query = new URLSearchParams();
    if (subject && subject !== 'All') query.append('subject', subject);
    query.append('count', String(count));

    const res = await fetch(`${API_BASE_URL}/api/studyhub/quiz/questions?${query.toString()}`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load questions');
    return json.data as QuizQuestion[];
  },

  async submitQuiz(
    payload: {
      subject: string;
      topic?: string;
      answers: Record<string, number>;
    },
    token?: string | null,
    userId?: string | null
  ) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/quiz/submit`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to submit quiz');
    return json.data as QuizSubmitResult;
  },

  async getHistory(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/quiz/history`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch quiz history');
    return json.data as QuizAttempt[];
  },
};

// ----------------------------------------------------------------------
// 6. PROGRESS & OVERVIEW API
// ----------------------------------------------------------------------
export const studyHubApi = {
  async getProgress(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/progress`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load progress data');
    return json.data as StudyProgressData;
  },

  async getOverview(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/studyhub/overview`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load overview data');
    return json.data as StudyOverviewData;
  },
};
