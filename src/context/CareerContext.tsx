import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';
import type {
  AssessmentAttempt,
  AssessmentCategory,
  CareerOpportunity,
  CareerPreferences,
  CareerReport,
  CareerRoadmap,
  CareerRole,
  InterviewPracticeEntry,
  InterviewType,
  JobApplication,
  OrganizationProfile,
  PortfolioDocument,
  ResumeDocument,
  ScholarshipProgram,
} from '../types/career';

export interface CrossModuleCareerEvent {
  id: string;
  title: string;
  category: string;
  subType: string;
  startDateISO: string;
  startTime: string;
  venue: string;
  organizerName: string;
}

export interface CareerAiSuggestion {
  id: string;
  mode: string;
  title: string;
  proposedText: string;
  rationale: string;
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
}

export interface CareerContextType {
  loading: boolean;
  statusToast: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearToast: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  roleInfo: { role: CareerRole; label: string | null };
  organizations: OrganizationProfile[];
  opportunities: CareerOpportunity[];
  scholarships: ScholarshipProgram[];
  applications: JobApplication[];
  resumes: ResumeDocument[];
  portfolio: PortfolioDocument | null;
  roadmap: CareerRoadmap | null;
  preferences: CareerPreferences | null;
  savedOpportunityIds: string[];
  viewedOpportunityIds: string[];
  notInterestedIds: string[];
  interviewHistory: InterviewPracticeEntry[];
  assessmentAttempts: AssessmentAttempt[];
  learningProgress: { bookmarkedIds: string[]; completedIds: string[] };
  reports: CareerReport[];
  crossModule: {
    kampusIdNumber: string | null;
    careerEvents: CrossModuleCareerEvent[];
  };
  reload: () => Promise<void>;
  switchRoleSession: (passkey?: string, revert?: boolean) => Promise<boolean>;
  toggleSaveOpportunity: (opportunityId: string) => Promise<void>;
  markOpportunityViewed: (opportunityId: string) => Promise<void>;
  markNotInterested: (opportunityId: string) => Promise<void>;
  savePreferences: (patch: Partial<CareerPreferences>) => Promise<boolean>;
  manageAlert: (payload: { alert?: Record<string, unknown>; deleteAlertId?: string }) => Promise<boolean>;
  createApplication: (payload: Partial<JobApplication>) => Promise<boolean>;
  updateApplication: (id: string, patch: Partial<JobApplication>) => Promise<boolean>;
  createResume: (payload: Partial<ResumeDocument>) => Promise<ResumeDocument | null>;
  updateResume: (id: string, patch: Partial<ResumeDocument>) => Promise<boolean>;
  deleteResume: (id: string) => Promise<boolean>;
  uploadResumePdf: (file: File, resumeId?: string) => Promise<string | null>;
  updatePortfolio: (patch: Partial<PortfolioDocument>) => Promise<boolean>;
  updateRoadmap: (patch: Partial<CareerRoadmap>) => Promise<boolean>;
  logInterviewPractice: (payload: {
    questionId: string;
    questionPrompt: string;
    interviewType: InterviewType;
    answerText: string;
    aiFeedback?: InterviewPracticeEntry['aiFeedback'];
  }) => Promise<boolean>;
  logAssessmentAttempt: (payload: {
    category: AssessmentCategory;
    mode: 'Timed' | 'Untimed';
    totalQuestions: number;
    correctCount: number;
    weakTopics: string[];
    durationSeconds: number;
  }) => Promise<boolean>;
  toggleLearningResource: (resourceId: string, field: 'bookmark' | 'complete') => Promise<void>;
  submitSafetyReport: (payload: {
    targetType: 'opportunity' | 'organization';
    targetId: string;
    targetTitle: string;
    reason: string;
    details: string;
  }) => Promise<boolean>;
  createOrganization: (payload: Partial<OrganizationProfile>) => Promise<boolean>;
  publishOpportunity: (payload: Partial<CareerOpportunity>) => Promise<boolean>;
  moderateOpportunity: (id: string, status: 'Open' | 'Closed' | 'Removed') => Promise<boolean>;
  reviewReport: (id: string) => Promise<boolean>;
  scheduleCareerPlannerSession: (payload: {
    title: string;
    targetName: string;
    subject: string;
    dateISO: string;
    timeSlot: string;
    durationMinutes?: number;
  }) => void;
  runCareerAiResumeAssistant: (
    mode: 'improve-summary' | 'rewrite-bullets' | 'suggest-verbs' | 'review-structure' | 'missing-sections',
    resume: ResumeDocument,
    targetRole: string
  ) => Promise<{ suggestions: CareerAiSuggestion[]; sourceLabel: string }>;
  evaluateInterviewAnswerAi: (
    questionPrompt: string,
    answerText: string,
    interviewType: InterviewType
  ) => Promise<NonNullable<InterviewPracticeEntry['aiFeedback']> & { sourceLabel: string }>;
  runCareerAiAssistant: (
    mode:
      | 'career-paths'
      | 'skill-gaps'
      | 'project-ideas'
      | 'cover-letter'
      | 'email-draft'
      | 'interview-followup',
    promptText: string
  ) => Promise<{ reply: string; sourceLabel: string }>;
}

const PLANNER_STORAGE_KEY = 'kampus_planner_partner_sessions_v1';

const CareerContext = createContext<CareerContextType | undefined>(undefined);

function computeResumeCompletenessNote(r: ResumeDocument): string[] {
  const missing: string[] = [];
  if (!r.summary.trim()) missing.push('Professional Summary is currently blank.');
  if (r.skills.length < 3) missing.push('Add at least 3 verified skills relevant to your target role.');
  if (r.projects.length === 0) missing.push('Add at least 1 real academic or personal project.');
  if (r.education.length === 0) missing.push('Add your current degree and institution.');
  if (!r.personalInfo.phone && !r.personalInfo.linkedin && !r.personalInfo.github) {
    missing.push('Include at least one verified contact or portfolio link (GitHub/LinkedIn).');
  }
  return missing;
}

export const CareerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const userId = user?.id || 'usr_22b030149';

  const [loading, setLoading] = useState(true);
  const [statusToast, setStatusToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [roleInfo, setRoleInfo] = useState<{ role: CareerRole; label: string | null }>({
    role: 'Student',
    label: null,
  });
  const [organizations, setOrganizations] = useState<OrganizationProfile[]>([]);
  const [opportunities, setOpportunities] = useState<CareerOpportunity[]>([]);
  const [scholarships, setScholarships] = useState<ScholarshipProgram[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioDocument | null>(null);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [preferences, setPreferences] = useState<CareerPreferences | null>(null);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<string[]>([]);
  const [viewedOpportunityIds, setViewedOpportunityIds] = useState<string[]>([]);
  const [notInterestedIds, setNotInterestedIds] = useState<string[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<InterviewPracticeEntry[]>([]);
  const [assessmentAttempts, setAssessmentAttempts] = useState<AssessmentAttempt[]>([]);
  const [learningProgress, setLearningProgress] = useState<{
    bookmarkedIds: string[];
    completedIds: string[];
  }>({ bookmarkedIds: [], completedIds: [] });
  const [reports, setReports] = useState<CareerReport[]>([]);
  const [crossModule, setCrossModule] = useState<{
    kampusIdNumber: string | null;
    careerEvents: CrossModuleCareerEvent[];
  }>({ kampusIdNumber: null, careerEvents: [] });

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setStatusToast({ type, message });
  }, []);

  const clearToast = useCallback(() => setStatusToast(null), []);

  useEffect(() => {
    if (!statusToast) return;
    const t = setTimeout(() => setStatusToast(null), 5000);
    return () => clearTimeout(t);
  }, [statusToast]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/career/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fullName: profile?.name || user?.name || 'KAMPUS Student',
          email: profile?.email || user?.email || '',
          college: profile?.college || user?.college || '',
          course: profile?.course || user?.course || '',
          semester: profile?.semester || user?.semester || '',
          interests: profile?.interests && profile.interests.length > 0 ? profile.interests : ['Software Development'],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load Career workspace.');
      setOrganizations(data.organizations || []);
      setOpportunities(data.opportunities || []);
      setScholarships(data.scholarships || []);
      setApplications(data.applications || []);
      setResumes(data.resumes || []);
      setPortfolio(data.portfolio || null);
      setRoadmap(data.roadmap || null);
      setPreferences(data.preferences || null);
      setSavedOpportunityIds(data.savedOpportunityIds || []);
      setViewedOpportunityIds(data.viewedOpportunityIds || []);
      setNotInterestedIds(data.notInterestedIds || []);
      setInterviewHistory(data.interviewHistory || []);
      setAssessmentAttempts(data.assessmentAttempts || []);
      setLearningProgress(data.learningProgress || { bookmarkedIds: [], completedIds: [] });
      setReports(data.reports || []);
      setRoleInfo(data.roleInfo || { role: 'Student', label: null });
      setCrossModule(data.crossModule || { kampusIdNumber: null, careerEvents: [] });
    } catch (err: any) {
      showToast('error', err?.message || 'Unable to load Career backend.');
    } finally {
      setLoading(false);
    }
  }, [userId, profile, user, showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const switchRoleSession = useCallback(
    async (passkey?: string, revert?: boolean) => {
      try {
        const res = await fetch('/api/career/auth/role-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, passkey, revert }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Invalid authorization code.');
          return false;
        }
        await reload();
        showToast(
          'success',
          revert
            ? 'Returned to Student view.'
            : `Authenticated role active: ${data.roleInfo?.role}`
        );
        return true;
      } catch {
        showToast('error', 'Failed to switch Career access role.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const toggleSaveOpportunity = useCallback(
    async (opportunityId: string) => {
      try {
        const res = await fetch('/api/career/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, opportunityId }),
        });
        const data = await res.json();
        if (res.ok) {
          setSavedOpportunityIds(data.savedOpportunityIds || []);
          const nowSaved = (data.savedOpportunityIds || []).includes(opportunityId);
          showToast('info', nowSaved ? 'Saved to your Career bookmarks.' : 'Removed from saved opportunities.');
        }
      } catch {
        showToast('error', 'Could not update saved list.');
      }
    },
    [userId, showToast]
  );

  const markOpportunityViewed = useCallback(
    async (opportunityId: string) => {
      try {
        const res = await fetch('/api/career/viewed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, opportunityId }),
        });
        const data = await res.json();
        if (res.ok) setViewedOpportunityIds(data.viewedOpportunityIds || []);
      } catch {
        // silent history update
      }
    },
    [userId]
  );

  const markNotInterested = useCallback(
    async (opportunityId: string) => {
      try {
        const res = await fetch('/api/career/not-interested', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, opportunityId }),
        });
        const data = await res.json();
        if (res.ok) {
          setNotInterestedIds(data.notInterestedIds || []);
          showToast('info', 'Listing hidden from your discovery feed.');
        }
      } catch {
        showToast('error', 'Unable to update preference.');
      }
    },
    [userId, showToast]
  );

  const savePreferences = useCallback(
    async (patch: Partial<CareerPreferences>) => {
      try {
        const res = await fetch('/api/career/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...patch }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to save career preferences.');
          return false;
        }
        setPreferences(data.preferences);
        showToast('success', 'Career preferences updated.');
        return true;
      } catch {
        showToast('error', 'Network error saving career preferences.');
        return false;
      }
    },
    [userId, showToast]
  );

  const manageAlert = useCallback(
    async (payload: { alert?: Record<string, unknown>; deleteAlertId?: string }) => {
      try {
        const res = await fetch('/api/career/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Unable to update career alert.');
          return false;
        }
        setPreferences(data.preferences);
        showToast('success', payload.deleteAlertId ? 'Career alert removed.' : 'Career alert saved.');
        if (payload.alert) {
          addNotification({
            title: 'Career Alert Configured',
            description: `Tracking ${String(payload.alert.roleKeyword || 'opportunities')} (${String(payload.alert.workFormat || 'All')})`,
            time: 'Just now',
            type: 'career',
          });
        }
        return true;
      } catch {
        showToast('error', 'Unable to save career alert.');
        return false;
      }
    },
    [userId, addNotification, showToast]
  );

  const createApplication = useCallback(
    async (payload: Partial<JobApplication>) => {
      try {
        const res = await fetch('/api/career/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not save application.');
          return false;
        }
        setApplications((prev) => [data.application, ...prev]);
        showToast('success', `Application recorded: ${data.application.roleTitle} (${data.application.status}).`);
        addNotification({
          title: 'Application Tracker Updated',
          description: `${data.application.roleTitle} at ${data.application.companyName} — ${data.application.status}`,
          time: 'Just now',
          type: 'career',
        });
        return true;
      } catch {
        showToast('error', 'Network error recording application.');
        return false;
      }
    },
    [userId, addNotification, showToast]
  );

  const updateApplication = useCallback(
    async (id: string, patch: Partial<JobApplication>) => {
      try {
        const res = await fetch(`/api/career/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not update application.');
          return false;
        }
        setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
        showToast('success', 'Application record updated.');
        return true;
      } catch {
        showToast('error', 'Failed to update application.');
        return false;
      }
    },
    [userId, showToast]
  );

  const createResume = useCallback(
    async (payload: Partial<ResumeDocument>) => {
      try {
        const res = await fetch('/api/career/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not create resume version.');
          return null;
        }
        setResumes((prev) => [data.resume, ...prev]);
        showToast('success', `Created resume version "${data.resume.versionName}".`);
        return data.resume as ResumeDocument;
      } catch {
        showToast('error', 'Failed to create resume version.');
        return null;
      }
    },
    [userId, showToast]
  );

  const updateResume = useCallback(
    async (id: string, patch: Partial<ResumeDocument>) => {
      try {
        const res = await fetch(`/api/career/resumes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to save resume.');
          return false;
        }
        setResumes((prev) => prev.map((r) => (r.id === id ? data.resume : r)));
        showToast('success', 'Resume saved.');
        return true;
      } catch {
        showToast('error', 'Network error saving resume.');
        return false;
      }
    },
    [userId, showToast]
  );

  const deleteResume = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/career/resumes/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to delete resume.');
          return false;
        }
        setResumes((prev) => prev.filter((r) => r.id !== id));
        showToast('info', 'Resume version deleted.');
        return true;
      } catch {
        showToast('error', 'Could not delete resume.');
        return false;
      }
    },
    [userId, showToast]
  );

  const uploadResumePdf = useCallback(
    async (file: File, resumeId?: string) => {
      if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        showToast('error', 'Uploaded PDF must be non-empty and under 5 MB.');
        return null;
      }
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Could not read PDF file.'));
          reader.readAsDataURL(file);
        });
        const res = await fetch('/api/career/upload-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fileName: file.name,
            base64Data,
            resumeId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Invalid PDF upload.');
          return null;
        }
        await reload();
        showToast('success', `Uploaded "${data.fileName}" privately.`);
        return data.fileUrl as string;
      } catch {
        showToast('error', 'Failed to upload resume PDF.');
        return null;
      }
    },
    [userId, reload, showToast]
  );

  const updatePortfolio = useCallback(
    async (patch: Partial<PortfolioDocument>) => {
      try {
        const res = await fetch('/api/career/portfolio', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not save portfolio.');
          return false;
        }
        setPortfolio(data.portfolio);
        showToast('success', 'Portfolio changes saved.');
        return true;
      } catch {
        showToast('error', 'Network error saving portfolio.');
        return false;
      }
    },
    [userId, showToast]
  );

  const updateRoadmap = useCallback(
    async (patch: Partial<CareerRoadmap>) => {
      try {
        const res = await fetch('/api/career/roadmap', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to update roadmap.');
          return false;
        }
        setRoadmap(data.roadmap);
        showToast('success', 'Career roadmap updated.');
        return true;
      } catch {
        showToast('error', 'Failed to save roadmap.');
        return false;
      }
    },
    [userId, showToast]
  );

  const logInterviewPractice = useCallback(
    async (payload: {
      questionId: string;
      questionPrompt: string;
      interviewType: InterviewType;
      answerText: string;
      aiFeedback?: InterviewPracticeEntry['aiFeedback'];
    }) => {
      try {
        const res = await fetch('/api/career/interview/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not save practice answer.');
          return false;
        }
        setInterviewHistory((prev) => [data.entry, ...prev]);
        showToast('success', 'Practice response saved to history.');
        return true;
      } catch {
        showToast('error', 'Failed to save practice response.');
        return false;
      }
    },
    [userId, showToast]
  );

  const logAssessmentAttempt = useCallback(
    async (payload: {
      category: AssessmentCategory;
      mode: 'Timed' | 'Untimed';
      totalQuestions: number;
      correctCount: number;
      weakTopics: string[];
      durationSeconds: number;
    }) => {
      try {
        const res = await fetch('/api/career/assessments/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to record assessment.');
          return false;
        }
        setAssessmentAttempts((prev) => [data.attempt, ...prev]);
        showToast('success', 'Assessment score recorded.');
        return true;
      } catch {
        showToast('error', 'Failed to save assessment attempt.');
        return false;
      }
    },
    [userId, showToast]
  );

  const toggleLearningResource = useCallback(
    async (resourceId: string, field: 'bookmark' | 'complete') => {
      try {
        const res = await fetch('/api/career/learning/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, resourceId, field }),
        });
        const data = await res.json();
        if (res.ok) {
          setLearningProgress(data.learningProgress);
        }
      } catch {
        showToast('error', 'Could not update learning progress.');
      }
    },
    [userId, showToast]
  );

  const submitSafetyReport = useCallback(
    async (payload: {
      targetType: 'opportunity' | 'organization';
      targetId: string;
      targetTitle: string;
      reason: string;
      details: string;
    }) => {
      try {
        const res = await fetch('/api/career/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            userId,
            userName: profile?.name || user?.name || 'Student',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to submit safety report.');
          return false;
        }
        setReports((prev) => [data.report, ...prev]);
        showToast('success', 'Safety report submitted to Career Moderation Team.');
        return true;
      } catch {
        showToast('error', 'Failed to submit safety report.');
        return false;
      }
    },
    [userId, profile, user, showToast]
  );

  const createOrganization = useCallback(
    async (payload: Partial<OrganizationProfile>) => {
      try {
        const res = await fetch('/api/career/recruiter/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Not authorized to create organization.');
          return false;
        }
        setOrganizations((prev) => [data.organization, ...prev]);
        showToast('success', `Organization "${data.organization.name}" added.`);
        return true;
      } catch {
        showToast('error', 'Failed to create organization.');
        return false;
      }
    },
    [userId, showToast]
  );

  const publishOpportunity = useCallback(
    async (payload: Partial<CareerOpportunity>) => {
      try {
        const res = await fetch('/api/career/recruiter/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Forbidden or invalid opportunity.');
          return false;
        }
        setOpportunities((prev) => [data.opportunity, ...prev]);
        showToast('success', `Published "${data.opportunity.title}".`);
        return true;
      } catch {
        showToast('error', 'Failed to publish opportunity.');
        return false;
      }
    },
    [userId, showToast]
  );

  const moderateOpportunity = useCallback(
    async (id: string, status: 'Open' | 'Closed' | 'Removed') => {
      try {
        const res = await fetch(`/api/career/admin/opportunities/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Permission denied.');
          return false;
        }
        setOpportunities((prev) => prev.map((o) => (o.id === id ? data.opportunity : o)));
        showToast('success', `Listing status updated to ${status}.`);
        return true;
      } catch {
        showToast('error', 'Failed to update listing status.');
        return false;
      }
    },
    [userId, showToast]
  );

  const reviewReport = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/career/admin/reports/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Admin permission required.');
          return false;
        }
        setReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
        showToast('success', 'Report marked Reviewed.');
        return true;
      } catch {
        showToast('error', 'Failed to review report.');
        return false;
      }
    },
    [userId, showToast]
  );

  const scheduleCareerPlannerSession = useCallback(
    (payload: {
      title: string;
      targetName: string;
      subject: string;
      dateISO: string;
      timeSlot: string;
      durationMinutes?: number;
    }) => {
      try {
        const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        const entry = {
          id: `ps_career_${Date.now()}`,
          title: payload.title,
          targetName: payload.targetName,
          subject: payload.subject,
          dateISO: payload.dateISO,
          timeSlot: payload.timeSlot,
          durationMinutes: payload.durationMinutes || 45,
          status: 'scheduled',
        };
        const updated = Array.isArray(existing) ? [entry, ...existing] : [entry];
        localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(updated));
        addNotification({
          title: 'Added to KAMPUS Planner',
          description: `${payload.title} scheduled for ${payload.dateISO} at ${payload.timeSlot}.`,
          time: 'Just now',
          type: 'career',
        });
        showToast('success', `Scheduled "${payload.title}" in KAMPUS Planner & Notification Center.`);
      } catch {
        showToast('error', 'Could not schedule into KAMPUS Planner.');
      }
    },
    [addNotification, showToast]
  );

  const runCareerAiResumeAssistant = useCallback(
    async (
      mode: 'improve-summary' | 'rewrite-bullets' | 'suggest-verbs' | 'review-structure' | 'missing-sections',
      resume: ResumeDocument,
      targetRole: string
    ): Promise<{ suggestions: CareerAiSuggestion[]; sourceLabel: string }> => {
      const missingChecks = computeResumeCompletenessNote(resume);
      const baseContext = `Student Resume (${resume.personalInfo.headline}), Skills: ${resume.skills.join(', ') || 'None entered yet'}, Projects: ${resume.projects.map((p) => p.title).join('; ') || 'None entered yet'}, Summary: ${resume.summary || 'Blank'}.`;
      const instruction = `You are KAMPUS AI Resume Assistant. STRICT RULE: NEVER invent companies, jobs, degrees, metrics, or unverified experience. NEVER claim a guaranteed ATS score or guaranteed shortlist. Provide concrete, editable draft suggestions only based on what the student already provided for target role "${targetRole}". Mode: ${mode}. Resume data: ${baseContext}. Return 2 short concise suggestions separated by "---".`;

      try {
        const res = await sendAiChatMessage({
          messages: [{ role: 'user', content: instruction }],
          language: 'English',
          learningLevel: 'Intermediate',
          responseStyle: 'Detailed Explanation',
          studentContext: `${profile?.course || 'Undergraduate'} (${profile?.semester || ''})`,
        });
        const chunks = res.reply
          .split('---')
          .map((c) => c.trim())
          .filter(Boolean)
          .slice(0, 3);
        const suggestions: CareerAiSuggestion[] = chunks.map((text, idx) => ({
          id: `aisug_${Date.now()}_${idx}`,
          mode,
          title:
            mode === 'improve-summary'
              ? 'Editable Summary Draft'
              : mode === 'rewrite-bullets'
              ? 'Stronger Action Bullet Option'
              : mode === 'suggest-verbs'
              ? 'Action Verb & Clarity Enhancement'
              : mode === 'review-structure'
              ? 'ATS Formatting & Section Order Note'
              : 'Completeness Observation',
          proposedText: text,
          rationale: 'AI-generated suggestion — review for accuracy before accepting.',
          status: 'pending',
        }));
        return { suggestions, sourceLabel: `KAMPUS AI (${res.model})` };
      } catch {
        // Honest deterministic suggestion without inventing experience or fake scores
        const fallback: CareerAiSuggestion[] = [];
        if (mode === 'improve-summary') {
          fallback.push({
            id: `aisug_${Date.now()}_0`,
            mode,
            title: 'Honest Student Summary Template (Edit brackets)',
            proposedText: `${resume.education[0]?.degree || 'Undergraduate'} student focused on ${targetRole}. Built hands-on projects using ${resume.skills.slice(0, 4).join(', ') || '[add your real tools]'}; seeking an entry-level opportunity to contribute and learn.`,
            rationale: 'Uses only your entered degree and skills — verify every phrase before applying.',
            status: 'pending',
          });
        } else if (mode === 'rewrite-bullets') {
          const sampleTitle = resume.projects[0]?.title || '[Your Project Title]';
          fallback.push({
            id: `aisug_${Date.now()}_0`,
            mode,
            title: 'Structured Action + Mechanism + Outcome Bullet',
            proposedText: `Designed and implemented ${sampleTitle} using ${resume.skills.slice(0, 3).join(', ') || '[your stack]'}, adding input validation and modular components verified through end-to-end testing.`,
            rationale: 'Rewrites structure clearly without inventing unverified percentages.',
            status: 'pending',
          });
        } else if (mode === 'suggest-verbs') {
          fallback.push({
            id: `aisug_${Date.now()}_0`,
            mode,
            title: 'Precision Action Verbs for Student Resumes',
            proposedText: 'Engineering: Implemented, Refactored, Profiled, Validated, Automated. Analysis & Research: Analyzed, Synthesized, Benchmarked, Documented.',
            rationale: 'Replace passive phrases like "Worked on" with accurate action verbs.',
            status: 'pending',
          });
        } else if (mode === 'review-structure') {
          fallback.push({
            id: `aisug_${Date.now()}_0`,
            mode,
            title: 'ATS Readability Check (No score guarantee)',
            proposedText:
              'Keep sections single-column with standard headings (Education, Skills, Projects, Experience). Avoid images or multi-column tables in exported ATS PDFs.',
            rationale: 'Standard single-column structure improves text extraction across ATS parsers.',
            status: 'pending',
          });
        } else {
          fallback.push({
            id: `aisug_${Date.now()}_0`,
            mode,
            title: 'Missing Section & Clarity Checks',
            proposedText:
              missingChecks.length > 0
                ? missingChecks.join(' ')
                : 'Core sections (Education, Skills, Projects, Summary) are populated. Verify dates and links are accurate.',
            rationale: 'Direct check of your current draft fields.',
            status: 'pending',
          });
        }
        return { suggestions: fallback, sourceLabel: 'KAMPUS AI Guidance (Structured Review)' };
      }
    },
    [profile]
  );

  const evaluateInterviewAnswerAi = useCallback(
    async (
      questionPrompt: string,
      answerText: string,
      interviewType: InterviewType
    ): Promise<NonNullable<InterviewPracticeEntry['aiFeedback']> & { sourceLabel: string }> => {
      const prompt = `Evaluate this student ${interviewType} practice answer constructively. Do not pretend to be a hiring decision. Question: "${questionPrompt}". Student Answer: "${answerText}". Respond concisely with sections: CLARITY:, STRUCTURE:, MISSING CONCEPTS:, IMPROVEMENT AREAS:, FOLLOW-UP QUESTIONS:.`;
      try {
        const res = await sendAiChatMessage({
          messages: [{ role: 'user', content: prompt }],
          language: 'English',
          learningLevel: 'Intermediate',
          responseStyle: 'Detailed Explanation',
          studentContext: `${profile?.course || 'Student'}`,
        });
        const raw = res.reply;
        return {
          clarity: raw.slice(0, 260),
          structureSuggestions: ['Follow Context -> Your Action -> Concrete Result flow clearly.'],
          missingConcepts: ['Verify you explained tradeoffs or edge cases relevant to the prompt.'],
          improvementAreas: [raw],
          followUpQuestions: [
            'What tradeoff would you revisit if load or team constraints doubled?',
            'How did you verify the outcome of your approach?',
          ],
          sourceLabel: `AI-Generated Guidance (${res.model})`,
        };
      } catch {
        const wordCount = answerText.trim().split(/\s+/).length;
        return {
          clarity:
            wordCount < 25
              ? 'Your response is quite brief — expand on the exact steps you took and why.'
              : 'Clear draft length. Tighten opening context to 1-2 sentences before diving into technical or behavioral actions.',
          structureSuggestions: [
            'Use a 3-part arc: (1) Problem & constraint, (2) Your concrete decision/action, (3) Verified outcome or lesson.',
          ],
          missingConcepts: [
            interviewType.includes('Technical')
              ? 'Explicitly mention failure handling, complexity, or data validation tradeoffs.'
              : 'Highlight what you personally executed vs what the team did collectively.',
          ],
          improvementAreas: [
            'State one measurable verification step or concrete reflection at the end.',
          ],
          followUpQuestions: [
            'Which edge case or obstacle took the longest to resolve?',
            'If repeating this task next week, what would you do differently?',
          ],
          sourceLabel: 'AI-Generated Practice Feedback (Structured Rubric)',
        };
      }
    },
    [profile]
  );

  const runCareerAiAssistant = useCallback(
    async (
      mode:
        | 'career-paths'
        | 'skill-gaps'
        | 'project-ideas'
        | 'cover-letter'
        | 'email-draft'
        | 'interview-followup',
      promptText: string
    ) => {
      const systemGuard = `You are KAMPUS AI Career Assistant. Student: ${profile?.name || 'Student'}, Course: ${profile?.course || ''}, Skills: ${(preferences?.skills || []).join(', ') || 'not specified'}, Target Roles: ${(preferences?.targetRoles || []).join(', ') || 'not specified'}. STRICT RULES: Never fabricate jobs, employers, salaries, placement odds, or unverified experience. Provide realistic drafts and guidance labeled for student review. Mode: ${mode}. Request: ${promptText}`;
      try {
        const res = await sendAiChatMessage({
          messages: [{ role: 'user', content: systemGuard }],
          language: 'English',
          learningLevel: 'Intermediate',
          responseStyle: 'Detailed Explanation',
          studentContext: `${profile?.course || ''} ${profile?.semester || ''}`,
        });
        return { reply: res.reply, sourceLabel: `AI-Generated Guidance (${res.model})` };
      } catch {
        const role = preferences?.targetRoles?.[0] || 'Software / Analyst Intern';
        const skills = preferences?.skills?.join(', ') || 'core fundamentals & version control';
        const templates: Record<typeof mode, string> = {
          'career-paths': `Based on your background (${profile?.course || 'current degree'}) and focus (${promptText || role}), compare roles that match your daily work preference:\n1. Hands-on Building: Software / Web / App Developer\n2. Analytical Modeling: Data Analyst / Business Analyst\n3. Research & Exploration: Undergraduate Research Assistant.\nNote: Formal hiring eligibility varies by employer — check each listing directly.`,
          'skill-gaps': `Skill Gap Check for ${role}:\n• Current listed skills: ${skills}\n• Recommended focus areas to verify through projects: SQL/Data modeling, clean Git workflow, automated testing, and structured problem explanation.\nUse the Technical Skill Assessments tab to identify weak topics objectively.`,
          'project-ideas': `Reproducible Project Ideas for ${role}:\n1. Campus Resource Booking Tool with conflict checks and unit tests.\n2. Public Dataset Analysis Notebook with clear methodology and limitations section.\nKeep code documented with setup instructions and screenshots.`,
          'cover-letter': `Draft Cover Note (Edit bracketed facts before sending):\n\nDear [Hiring Manager / Team Name],\n\nI am a ${profile?.semester || 'current'} ${profile?.course || 'university'} student at ${profile?.college || '[Your College]'} applying for [Role Name]. Through my coursework and projects in ${skills}, I have practiced building and testing structured solutions.\n\nI would welcome the opportunity to contribute and learn with your team.\n\nSincerely,\n${profile?.name || '[Your Name]'}`,
          'email-draft': `Subject: Application / Inquiry — [Role Name] | ${profile?.name || '[Your Name]'}\n\nHello [Recipient Name],\n\nI hope you are well. I am a ${profile?.course || 'student'} at ${profile?.college || '[Your College]'} interested in [specific team or opportunity]. Attached is my resume for reference.\n\nThank you for your time and consideration.\nBest regards,\n${profile?.name || '[Your Name]'}`,
          'interview-followup': `Subject: Thank you — [Role Name] Interview\n\nDear [Interviewer Name],\n\nThank you for speaking with me on [Date] regarding the [Role Name] opportunity. I appreciated learning about [specific topic discussed] and remain enthusiastic about contributing to the team.\n\nBest regards,\n${profile?.name || '[Your Name]'}`,
        };
        return {
          reply: templates[mode],
          sourceLabel: 'AI-Generated Career Guidance Draft (Review & edit before use)',
        };
      }
    },
    [profile, preferences]
  );

  const value = useMemo<CareerContextType>(
    () => ({
      loading,
      statusToast,
      clearToast,
      showToast,
      roleInfo,
      organizations,
      opportunities,
      scholarships,
      applications,
      resumes,
      portfolio,
      roadmap,
      preferences,
      savedOpportunityIds,
      viewedOpportunityIds,
      notInterestedIds,
      interviewHistory,
      assessmentAttempts,
      learningProgress,
      reports,
      crossModule,
      reload,
      switchRoleSession,
      toggleSaveOpportunity,
      markOpportunityViewed,
      markNotInterested,
      savePreferences,
      manageAlert,
      createApplication,
      updateApplication,
      createResume,
      updateResume,
      deleteResume,
      uploadResumePdf,
      updatePortfolio,
      updateRoadmap,
      logInterviewPractice,
      logAssessmentAttempt,
      toggleLearningResource,
      submitSafetyReport,
      createOrganization,
      publishOpportunity,
      moderateOpportunity,
      reviewReport,
      scheduleCareerPlannerSession,
      runCareerAiResumeAssistant,
      evaluateInterviewAnswerAi,
      runCareerAiAssistant,
    }),
    [
      loading,
      statusToast,
      clearToast,
      showToast,
      roleInfo,
      organizations,
      opportunities,
      scholarships,
      applications,
      resumes,
      portfolio,
      roadmap,
      preferences,
      savedOpportunityIds,
      viewedOpportunityIds,
      notInterestedIds,
      interviewHistory,
      assessmentAttempts,
      learningProgress,
      reports,
      crossModule,
      reload,
      switchRoleSession,
      toggleSaveOpportunity,
      markOpportunityViewed,
      markNotInterested,
      savePreferences,
      manageAlert,
      createApplication,
      updateApplication,
      createResume,
      updateResume,
      deleteResume,
      uploadResumePdf,
      updatePortfolio,
      updateRoadmap,
      logInterviewPractice,
      logAssessmentAttempt,
      toggleLearningResource,
      submitSafetyReport,
      createOrganization,
      publishOpportunity,
      moderateOpportunity,
      reviewReport,
      scheduleCareerPlannerSession,
      runCareerAiResumeAssistant,
      evaluateInterviewAnswerAi,
      runCareerAiAssistant,
    ]
  );

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
};

export const useCareer = () => {
  const ctx = useContext(CareerContext);
  if (!ctx) throw new Error('useCareer must be used within a CareerProvider');
  return ctx;
};
