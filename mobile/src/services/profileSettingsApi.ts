import API_BASE_URL from '../config/api';

export type ProfileVisibility = 'Public' | 'KAMPUS Members' | 'Private';

export interface ProfilePrivacySettings {
  visibility: ProfileVisibility;
  showPhoto: boolean;
  showBio: boolean;
  showAcademic: boolean;
  showSkills: boolean;
  showAchievements: boolean;
  showProjects: boolean;
  showActivity: boolean;
  showContactInfo?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  username: string;
  headline?: string;
  avatarUrl: string;
  coverUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  preferredLanguage?: string;
  bio?: string;
  careerGoals?: string;
  college: string;
  university?: string;
  course: string;
  specialization?: string;
  semester: string;
  enrollmentNo: string;
  isVerified: boolean;
  verificationSource?: string | null;
  graduationYear?: string;
  academicInterests?: string[];
  privacy: ProfilePrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletionSummary {
  percentage: number;
  missingSections: string[];
  suggestedActions: string[];
}

export interface RealProfileStats {
  notesUploaded: number;
  communityContributions: number;
  eventsParticipated: number;
  projectsCompleted: number;
  achievementsEarned: number;
  studyGoalsCompleted: number;
}

export interface ConsolidatedActivityItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  dateISO: string;
  linkRoute?: string;
}

export interface UserSettings {
  userId: string;
  account: {
    status: 'Active' | 'Deactivated' | 'Deletion Requested';
    emailVerified: boolean;
    phoneVerified: boolean;
    passwordLastChangedAt: string | null;
    loginMethods: string[];
    createdAt: string;
  };
  privacy: {
    profileVisibility: ProfileVisibility;
    activityVisibility: {
      community: boolean;
      notes: boolean;
      achievements: boolean;
      events: boolean;
      projects: boolean;
    };
    discovery: {
      searchableByStudents: boolean;
      studyPartnerDiscovery: boolean;
      allowProfileSharing: boolean;
      allowMentions: boolean;
    };
    messaging: {
      messageRequestsFrom: 'Everyone' | 'College Peers' | 'Connections Only';
      postInteractionsFrom: 'Everyone' | 'KAMPUS Members';
    };
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    density: 'comfortable' | 'compact';
    reduceMotion: boolean;
    sidebarBehavior: 'expanded' | 'collapsed';
  };
  languageRegion: {
    language: 'en' | 'hi';
    country: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    weekStartDay: string;
  };
  accessibility: {
    textSize: string;
    highContrast: boolean;
    reduceMotion: boolean;
  };
  updatedAt: string;
}

export interface NotificationPreferences {
  studyReminders: boolean;
  assignmentDeadlines: boolean;
  campusEvents: boolean;
  communityAlerts: boolean;
  announcements: boolean;
  general: boolean;
}

export interface AccountSummary {
  userId: string;
  email: string;
  phone?: string;
  fullName: string;
  username: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  passwordLastChangedAt: string | null;
  createdAt: string;
  loginMethods: string[];
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
// 1. PROFILE API
// ----------------------------------------------------------------------
export const profileApi = {
  async getProfile(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success && !json.profile) {
      throw new Error(json.message || 'Failed to fetch student profile.');
    }
    return {
      profile: (json.profile || json) as StudentProfile,
      completion: (json.completion || { percentage: 80, missingSections: [], suggestedActions: [] }) as ProfileCompletionSummary,
      stats: (json.stats || { notesUploaded: 0, communityContributions: 0, eventsParticipated: 0, projectsCompleted: 0, achievementsEarned: 0, studyGoalsCompleted: 0 }) as RealProfileStats,
      activity: (json.activity || []) as ConsolidatedActivityItem[],
    };
  },

  async updateProfile(patch: Partial<StudentProfile>, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!json.success && !json.profile) {
      throw new Error(json.message || 'Failed to update profile.');
    }
    return json.profile as StudentProfile;
  },

  async uploadAvatar(fileBase64: string, fileName?: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ fileBase64, fileName: fileName || 'avatar.jpg' }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to upload profile photo.');
    }
    return json.avatarUrl as string;
  },

  async removeAvatar(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to remove profile photo.');
    }
    return true;
  },

  async checkUsername(username: string, token?: string | null, userId?: string | null) {
    const cleanUser = encodeURIComponent(username.trim());
    const res = await fetch(`${API_BASE_URL}/api/profile/username-check?username=${cleanUser}`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    return {
      available: Boolean(json.available),
      username: String(json.username || username),
      message: json.message as string | undefined,
    };
  },
};

// ----------------------------------------------------------------------
// 2. SETTINGS API
// ----------------------------------------------------------------------
export const settingsApi = {
  async getSettings(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success && !json.settings) {
      throw new Error(json.message || 'Failed to fetch settings.');
    }
    return (json.settings || json) as UserSettings;
  },

  async updateSettings(patch: Partial<UserSettings>, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!json.success && !json.settings) {
      throw new Error(json.message || 'Failed to update settings.');
    }
    return (json.settings || json) as UserSettings;
  },

  async getPrivacy(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/settings/privacy`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    return {
      privacy: json.privacy,
      profilePrivacy: json.profilePrivacy,
    };
  },

  async updatePrivacy(patch: Partial<ProfilePrivacySettings> & Record<string, any>, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/settings/privacy`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update privacy settings.');
    return json;
  },

  async getNotifications(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/settings/notifications`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success && !json.preferences) {
      throw new Error(json.message || 'Failed to load notification settings.');
    }
    return json.preferences as NotificationPreferences;
  },

  async updateNotifications(patch: Partial<NotificationPreferences>, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/settings/notifications`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!json.success && !json.preferences) {
      throw new Error(json.message || 'Failed to update notification settings.');
    }
    return json.preferences as NotificationPreferences;
  },
};

// ----------------------------------------------------------------------
// 3. ACCOUNT API
// ----------------------------------------------------------------------
export const accountApi = {
  async getAccount(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/account`, {
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success && !json.account) {
      throw new Error(json.message || 'Failed to load account details.');
    }
    return json.account as AccountSummary;
  },

  async exportData(token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/account/export`, {
      method: 'POST',
      headers: getHeaders(token, userId),
    });
    const json = await res.json();
    if (!json.success && !json.data) {
      throw new Error(json.message || 'Failed to export account data.');
    }
    return json.data;
  },

  async deleteAccount(confirmationPhrase: string, reason?: string, token?: string | null, userId?: string | null) {
    const res = await fetch(`${API_BASE_URL}/api/account/delete`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ confirmationPhrase, reason }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to delete account.');
    }
    return true;
  },
};
