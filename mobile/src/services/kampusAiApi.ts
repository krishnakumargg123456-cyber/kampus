import API_BASE_URL from '../config/api';

export interface AiCitation {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface AiAttachmentItem {
  id: string;
  fileName: string;
  kind: 'pdf' | 'docx' | 'pptx' | 'text' | 'image' | 'studyhub';
  mimeType: string;
  sizeBytes?: number;
  extractedText?: string;
  base64Data?: string;
}

export interface AiChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: 'openai' | 'gemini' | 'system';
  model?: string;
  fallbackUsed?: boolean;
  mode?: 'normal' | 'study';
  webSearch?: boolean;
  citations?: AiCitation[];
  attachments?: AiAttachmentItem[];
  tokensUsed?: number;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  mode: 'normal' | 'study';
  webSearchEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageSnippet?: string;
}

export interface AiServiceStatus {
  success: boolean;
  available: boolean;
  primaryProvider: string;
  fallbackEnabled: boolean;
  providers: {
    openai: { configured: boolean; model: string };
    gemini: { configured: boolean; model: string };
  };
  webSearchEnabled: boolean;
  studyModeEnabled: boolean;
  userQuota: {
    requestsToday: number;
    dailyLimit: number;
    remaining: number;
  };
  message: string;
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

export const kampusAiApi = {
  async getStatus(token?: string | null, userId?: string | null): Promise<AiServiceStatus> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/status`, {
        headers: getHeaders(token, userId),
      });
      return await res.json();
    } catch {
      return {
        success: false,
        available: false,
        primaryProvider: 'openai',
        fallbackEnabled: false,
        providers: {
          openai: { configured: false, model: 'gpt-4o-mini' },
          gemini: { configured: false, model: 'gemini-2.5-flash' },
        },
        webSearchEnabled: true,
        studyModeEnabled: true,
        userQuota: { requestsToday: 0, dailyLimit: 100, remaining: 100 },
        message: 'Unable to connect to AI service.',
      };
    }
  },

  async getConversations(token?: string | null, userId?: string | null): Promise<AiConversation[]> {
    const res = await fetch(`${API_BASE_URL}/api/ai/conversations`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    return json.conversations || [];
  },

  async createConversation(
    params: { title?: string; mode?: 'normal' | 'study'; webSearchEnabled?: boolean },
    token?: string | null,
    userId?: string | null
  ): Promise<AiConversation> {
    const res = await fetch(`${API_BASE_URL}/api/ai/conversations`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(params),
    });
    const json = await res.json();
    return json.conversation;
  },

  async getConversation(
    conversationId: string,
    token?: string | null,
    userId?: string | null
  ): Promise<{ conversation: AiConversation; messages: AiChatMessage[] }> {
    const res = await fetch(`${API_BASE_URL}/api/ai/conversations/${conversationId}`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    return {
      conversation: json.conversation,
      messages: json.messages || [],
    };
  },

  async updateConversation(
    conversationId: string,
    patch: { title?: string; mode?: 'normal' | 'study'; webSearchEnabled?: boolean },
    token?: string | null,
    userId?: string | null
  ): Promise<AiConversation> {
    const res = await fetch(`${API_BASE_URL}/api/ai/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    return json.conversation;
  },

  async deleteConversation(
    conversationId: string,
    token?: string | null,
    userId?: string | null
  ): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/ai/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    return Boolean(json.success);
  },

  async sendMessage(
    params: {
      conversationId?: string;
      message: string;
      mode?: 'normal' | 'study';
      webSearch?: boolean;
      attachments?: AiAttachmentItem[];
      studentContext?: string;
    },
    token?: string | null,
    userId?: string | null
  ): Promise<{
    reply: string;
    conversationId: string;
    provider: 'openai' | 'gemini';
    model: string;
    fallbackUsed: boolean;
    citations: AiCitation[];
    message: AiChatMessage;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify(params),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to generate AI response.');
    }

    return json;
  },

  async extractDocument(
    fileBase64: string,
    fileName: string,
    mimeType?: string,
    token?: string | null,
    userId?: string | null
  ): Promise<AiAttachmentItem> {
    const res = await fetch(`${API_BASE_URL}/api/ai/extract-document`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ fileBase64, fileName, mimeType }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      throw new Error(json.message || 'Document processing failed.');
    }

    return {
      id: 'att_' + Date.now(),
      fileName: json.fileName,
      kind: json.kind,
      mimeType: json.mimeType,
      extractedText: json.extractedText,
      base64Data: json.base64Data,
      sizeBytes: fileBase64.length,
    };
  },

  async submitFeedback(
    messageId: string,
    rating: 'up' | 'down',
    comment?: string,
    token?: string | null,
    userId?: string | null
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/feedback`, {
        method: 'POST',
        headers: getHeaders(token, userId),
        body: JSON.stringify({ messageId, rating, comment }),
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch {
      return false;
    }
  },
};
