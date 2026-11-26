import API_BASE_URL from '../config/api';

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

export interface ToolkitToolMeta {
  id: string;
  name: string;
  category: 'calculators' | 'productivity' | 'documents' | 'programming' | 'college';
  description: string;
  icon: string;
  keywords: string[];
  featured?: boolean;
}

export interface ToolkitHistoryItem {
  id: string;
  userId: string;
  toolId: string;
  toolName: string;
  actionSummary?: string;
  timestamp: string;
}

export interface ToolkitPreferences {
  calculatorAngleMode?: 'deg' | 'rad';
  defaultGradingScale?: '10-point' | '4-point';
  attendanceTargetPercent?: number;
  pomodoroWorkMinutes?: number;
  pomodoroBreakMinutes?: number;
  pomodoroLongBreakMinutes?: number;
  preferredTheme?: 'system' | 'light' | 'dark';
}

export interface ToolkitProductivityData {
  tasks: Array<{
    id: string;
    userId: string;
    title: string;
    subject?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    completed: boolean;
    createdAt: string;
  }>;
  timetable: Array<{
    id: string;
    userId: string;
    day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
    startTime: string;
    endTime: string;
    subject: string;
    room?: string;
    professor?: string;
  }>;
  exams: Array<{
    id: string;
    userId: string;
    examName: string;
    subject: string;
    examDate: string;
    room?: string;
    createdAt: string;
  }>;
  quickNotes: Array<{
    id: string;
    userId: string;
    title: string;
    content: string;
    category?: string;
    isPinned: boolean;
    updatedAt: string;
  }>;
  pomodoroStats: {
    totalSessionsCompleted: number;
    totalFocusMinutes: number;
    lastActiveDate: string;
  };
}

export const toolkitApi = {
  async getTools(): Promise<ToolkitToolMeta[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/toolkit/tools`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async getFavorites(token?: string | null, userId?: string | null): Promise<string[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/toolkit/favorites`, {
        headers: getHeaders(token, userId),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.favorites || [];
    } catch {
      return [];
    }
  },

  async toggleFavorite(toolId: string, isFav: boolean, token?: string | null, userId?: string | null): Promise<string[]> {
    try {
      const method = isFav ? 'DELETE' : 'POST';
      const url = isFav
        ? `${API_BASE_URL}/api/toolkit/favorites/${toolId}`
        : `${API_BASE_URL}/api/toolkit/favorites`;

      const res = await fetch(url, {
        method,
        headers: getHeaders(token, userId),
        body: isFav ? undefined : JSON.stringify({ toolId }),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.favorites || [];
    } catch {
      return [];
    }
  },

  async getHistory(token?: string | null, userId?: string | null): Promise<ToolkitHistoryItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/toolkit/history`, {
        headers: getHeaders(token, userId),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.history || [];
    } catch {
      return [];
    }
  },

  async recordHistory(toolId: string, actionSummary?: string, token?: string | null, userId?: string | null): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/toolkit/history`, {
        method: 'POST',
        headers: getHeaders(token, userId),
        body: JSON.stringify({ toolId, actionSummary }),
      });
    } catch {}
  },

  async getProductivityBootstrap(token?: string | null, userId?: string | null): Promise<ToolkitProductivityData> {
    const res = await fetch(`${API_BASE_URL}/api/toolkit/productivity/bootstrap`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) {
      throw new Error(`Failed to bootstrap productivity data: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  },

  async saveTask(task: any, token?: string | null, userId?: string | null): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/toolkit/productivity/tasks`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(task),
    });
    const json = await res.json();
    return json.task;
  },

  async updateTask(id: string, updates: any, token?: string | null, userId?: string | null): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/toolkit/productivity/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(token, userId),
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.task;
  },

  async deleteTask(id: string, token?: string | null, userId?: string | null): Promise<void> {
    await fetch(`${API_BASE_URL}/api/toolkit/productivity/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
  },

  async completePomodoroSession(minutes: number, token?: string | null, userId?: string | null): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/toolkit/productivity/pomodoro/complete`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ focusMinutes: minutes }),
    });
    return res.json();
  },

  async saveNote(note: any, token?: string | null, userId?: string | null): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/toolkit/productivity/notes`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(note),
    });
    const json = await res.json();
    return json.note;
  },

  async deleteNote(id: string, token?: string | null, userId?: string | null): Promise<void> {
    await fetch(`${API_BASE_URL}/api/toolkit/productivity/notes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
  },
};
