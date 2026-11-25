import API_BASE_URL from '../config/api';
import type {
  CareerOpportunity,
  JobApplication,
  ResumeDocument,
  CareerRoadmap,
} from '../../../src/types/career';

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

export interface CareerBootstrapResponse {
  opportunities: CareerOpportunity[];
  applications: JobApplication[];
  savedOpportunityIds: string[];
  resumes: ResumeDocument[];
  roadmap: CareerRoadmap;
  role: string;
}

export const careerApi = {
  async getBootstrap(token?: string | null, userId?: string | null): Promise<CareerBootstrapResponse> {
    const res = await fetch(`${API_BASE_URL}/api/career/bootstrap`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      throw new Error(`Failed to load career data: HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      opportunities: data.opportunities || [],
      applications: data.applications || [],
      savedOpportunityIds: data.savedOpportunityIds || [],
      resumes: data.resumes || [],
      roadmap: data.roadmap || { currentYearSemester: 'Semester 4', targetDomain: 'Full-Stack Engineering', completedTopics: [] },
      role: data.role || 'Student',
    };
  },

  async applyToOpportunity(
    opportunityId: string,
    roleTitle: string,
    companyName: string,
    personalNotes: string = '',
    token?: string | null,
    userId?: string | null
  ): Promise<JobApplication> {
    const res = await fetch(`${API_BASE_URL}/api/career/applications`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({
        userId,
        opportunityId,
        roleTitle,
        companyName,
        personalNotes,
        consentConfirmed: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.application) {
      throw new Error(data.message || 'Failed to submit application.');
    }
    return data.application;
  },

  async toggleSavedOpportunity(
    opportunityId: string,
    token?: string | null,
    userId?: string | null
  ): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/api/career/saved`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ userId, opportunityId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update saved opportunity.');
    }
    return data.savedOpportunityIds || [];
  },

  async createResume(
    title: string,
    summary: string,
    skills: string[],
    token?: string | null,
    userId?: string | null
  ): Promise<ResumeDocument> {
    const res = await fetch(`${API_BASE_URL}/api/career/resumes`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({
        userId,
        title,
        summary,
        skills,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.resume) {
      throw new Error(data.message || 'Failed to create resume.');
    }
    return data.resume;
  },

  async deleteResume(
    resumeId: string,
    token?: string | null,
    userId?: string | null
  ): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/career/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      throw new Error('Failed to delete resume.');
    }
    return true;
  },
};
