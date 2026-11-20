import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BadgeName,
  CommunityAttachment,
  CommunityCategory,
  CommunityGroup,
  CommunityLanguage,
  CommunityMemberRole,
  CommunityNotificationPrefs,
  CommunityPost,
  CommunityPostDraft,
  CommunityState,
  PostType,
  PublicStudentProfile,
  QuestionSubject,
  ReportReason,
  SafetyReport,
} from '../types/community';
import { INITIAL_COMMUNITY_STATE, COMMUNITY_COVERS } from '../data/communityData';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';

const STORAGE_KEY = 'kampus_community_state_v1';
const STUDY_HUB_STORAGE_KEY = 'kampus_studyhub_state_v1';

export interface ContributorStats {
  student: PublicStudentProfile;
  postsCount: number;
  answersCount: number;
  acceptedAnswersCount: number;
  helpfulVotesCount: number;
  upvotesReceivedCount: number;
  score: number;
  badges: BadgeName[];
}

interface CreatePostPayload {
  communityId: string;
  type: PostType;
  title: string;
  content: string;
  subject?: QuestionSubject;
  academicLevel?: string;
  topicTag?: string;
  tags: string[];
  attachment?: CommunityAttachment;
  hasPoll?: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
  pollAllowMultiple?: boolean;
  pollExpiresAt?: string;
  linkedResourceType?: 'Notes' | 'Book' | 'Guide' | 'PYQ';
  linkedResourceTitle?: string;
  linkedResourceSummary?: string;
  isPinned?: boolean;
  isOfficialAnnouncement?: boolean;
}

interface CommunityContextType {
  state: CommunityState;
  language: CommunityLanguage;
  setLanguage: (lang: CommunityLanguage) => void;
  currentStudentId: string;
  currentPublicProfile: PublicStudentProfile;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Derived data
  visiblePosts: CommunityPost[];
  contributorStats: ContributorStats[];
  trendingTags: Array<{ tag: string; count: number }>;

  // Helpers
  getStudentById: (id: string) => PublicStudentProfile | undefined;
  getCommunityById: (id: string) => CommunityGroup | undefined;
  getUserRoleInCommunity: (communityId: string, studentId?: string) => CommunityMemberRole | null;
  isMemberOfCommunity: (communityId: string) => boolean;
  isFollowingStudent: (studentId: string) => boolean;
  isBlockedStudent: (studentId: string) => boolean;
  isCommunityMuted: (communityId: string) => boolean;
  isPostMuted: (postId: string) => boolean;
  hasVotedInPoll: (postId: string) => boolean;

  // Actions: Communities & Membership
  joinCommunity: (communityId: string) => void;
  leaveCommunity: (communityId: string) => void;
  createCommunity: (payload: {
    name: string;
    category: CommunityCategory;
    description: string;
    rules: string[];
  }) => string;
  updateCommunityDetails: (
    communityId: string,
    updates: Partial<Pick<CommunityGroup, 'name' | 'description' | 'category' | 'rules' | 'requirePostApproval'>>
  ) => void;
  assignCommunityRole: (communityId: string, targetStudentId: string, role: CommunityMemberRole) => void;
  removeCommunityMember: (communityId: string, targetStudentId: string) => void;

  // Actions: Posts & Drafts
  createPost: (payload: CreatePostPayload) => string;
  updatePost: (postId: string, updates: Partial<Pick<CommunityPost, 'title' | 'content' | 'tags' | 'subject' | 'topicTag' | 'academicLevel'>>) => void;
  deletePost: (postId: string) => void;
  togglePinPost: (postId: string) => void;
  approvePendingPost: (postId: string) => void;
  togglePostUpvote: (postId: string) => void;
  togglePostHelpful: (postId: string) => void;
  togglePostBookmark: (postId: string) => void;
  saveDraft: (draft: Omit<CommunityPostDraft, 'id' | 'savedAt'> & { id?: string }) => string;
  deleteDraft: (draftId: string) => void;

  // Actions: Polls
  voteInPoll: (postId: string, optionIds: string[]) => void;

  // Actions: Q&A Answers & Nested Replies
  submitAnswer: (postId: string, content: string, attachment?: CommunityAttachment) => string;
  editAnswer: (postId: string, answerId: string, content: string) => void;
  deleteAnswer: (postId: string, answerId: string) => void;
  toggleAnswerUpvote: (postId: string, answerId: string) => void;
  toggleAnswerHelpful: (postId: string, answerId: string) => void;
  acceptAnswer: (postId: string, answerId: string) => void;
  addCommentOrReply: (postId: string, content: string, answerId?: string, parentReplyId?: string) => void;
  editCommentOrReply: (postId: string, replyId: string, content: string, answerId?: string) => void;
  deleteCommentOrReply: (postId: string, replyId: string, answerId?: string) => void;
  toggleReplyUpvote: (postId: string, replyId: string, answerId?: string) => void;

  // Actions: Social, Search, Safety & Notifications
  toggleFollowStudent: (studentId: string) => void;
  toggleBlockStudent: (studentId: string) => void;
  toggleMuteCommunity: (communityId: string) => void;
  toggleMutePost: (postId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  submitSafetyReport: (payload: {
    targetType: SafetyReport['targetType'];
    targetId: string;
    targetTitle: string;
    reason: ReportReason;
    details: string;
  }) => void;
  updateNotificationPrefs: (updates: Partial<CommunityNotificationPrefs>) => void;

  // Cross-module actions
  saveResourceToStudyHub: (post: CommunityPost) => void;
  askAiHelper: (mode: 'summarize' | 'explain' | 'related-questions' | 'improve-clarity', inputText: string) => Promise<{ text: string; error?: string }>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

function computeBadges(stats: Omit<ContributorStats, 'badges'>): BadgeName[] {
  const badges: BadgeName[] = [];
  if (stats.helpfulVotesCount >= 2 || stats.acceptedAnswersCount >= 1) {
    badges.push('Helpful Member');
  }
  if (stats.answersCount >= 1 && stats.postsCount >= 1) {
    badges.push('Knowledge Sharer');
  }
  if (stats.postsCount >= 2) {
    badges.push('Discussion Starter');
  }
  if (stats.upvotesReceivedCount >= 3) {
    badges.push('Community Supporter');
  }
  if (stats.score >= 12) {
    badges.push('Top Contributor');
  }
  return badges;
}

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const currentStudentId = user?.id || 'usr_22b030149';

  const [language, setLanguage] = useState<CommunityLanguage>('en');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [state, setState] = useState<CommunityState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CommunityState;
        if (parsed && Array.isArray(parsed.communities) && Array.isArray(parsed.posts)) {
          return {
            ...INITIAL_COMMUNITY_STATE,
            ...parsed,
            notificationPrefs: {
              ...INITIAL_COMMUNITY_STATE.notificationPrefs,
              ...(parsed.notificationPrefs || {}),
            },
          };
        }
      }
      return INITIAL_COMMUNITY_STATE;
    } catch {
      return INITIAL_COMMUNITY_STATE;
    }
  });

  useEffect(() => {
    fetch('/api/community/bootstrap')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.success && json.data) {
          setState((prev) => ({
            ...prev,
            ...json.data,
            communities: json.data.communities?.length ? json.data.communities : prev.communities,
            posts: json.data.posts?.length ? json.data.posts : prev.posts,
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota overflow
    }

    const timer = setTimeout(() => {
      fetch('/api/community/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [state]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Public-only view of current logged-in student (no email/mobile/hostel)
  const currentPublicProfile: PublicStudentProfile = useMemo(
    () => ({
      id: currentStudentId,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      course: profile.course,
      semester: profile.semester,
      college: profile.college,
      intro:
        profile.bio ||
        `${profile.course} learner exploring peer discussions, structured notes, and collaborative problem solving.`,
      interests: profile.interests && profile.interests.length > 0 ? profile.interests : ['Data Structures', 'Exam Prep'],
      isDemoProfile: false,
    }),
    [currentStudentId, profile]
  );

  const allStudentsMap = useMemo(() => {
    const map = new Map<string, PublicStudentProfile>();
    state.publicStudents.forEach((s) => map.set(s.id, s));
    map.set(currentPublicProfile.id, currentPublicProfile);
    return map;
  }, [state.publicStudents, currentPublicProfile]);

  const getStudentById = (id: string) => allStudentsMap.get(id);
  const getCommunityById = (id: string) => state.communities.find((c) => c.id === id);

  const getUserRoleInCommunity = (communityId: string, studentId: string = currentStudentId): CommunityMemberRole | null => {
    const comm = getCommunityById(communityId);
    if (!comm) return null;
    const member = comm.members.find((m) => m.studentId === studentId);
    return member ? member.role : null;
  };

  const isMemberOfCommunity = (communityId: string) => getUserRoleInCommunity(communityId, currentStudentId) !== null;
  const isFollowingStudent = (studentId: string) => state.followedStudentIds.includes(studentId);
  const isBlockedStudent = (studentId: string) => state.blockedStudentIds.includes(studentId);
  const isCommunityMuted = (communityId: string) => state.mutedCommunityIds.includes(communityId);
  const isPostMuted = (postId: string) => state.mutedPostIds.includes(postId);

  const hasVotedInPoll = (postId: string) => {
    const post = state.posts.find((p) => p.id === postId);
    if (!post?.poll) return false;
    return post.poll.options.some((o) => o.voterIds.includes(currentStudentId));
  };

  // Visible posts exclude blocked authors and pending posts (unless authored or moderated by current user)
  const visiblePosts = useMemo(() => {
    return state.posts.filter((post) => {
      if (state.blockedStudentIds.includes(post.authorId)) return false;
      if (post.pendingApproval) {
        const role = getUserRoleInCommunity(post.communityId, currentStudentId);
        const isAuthor = post.authorId === currentStudentId;
        return isAuthor || role === 'Owner' || role === 'Moderator';
      }
      return true;
    });
  }, [state.posts, state.blockedStudentIds, state.communities, currentStudentId]);

  const contributorStats = useMemo<ContributorStats[]>(() => {
    const allStudents = Array.from(allStudentsMap.values()).filter(
      (s) => !state.blockedStudentIds.includes(s.id)
    );
    return allStudents
      .map((student) => {
        const authoredPosts = state.posts.filter((p) => p.authorId === student.id && !p.pendingApproval);
        let answersCount = 0;
        let acceptedAnswersCount = 0;
        let helpfulVotesCount = 0;
        let upvotesReceivedCount = 0;

        authoredPosts.forEach((p) => {
          helpfulVotesCount += p.helpfulIds.length;
          upvotesReceivedCount += p.upvoterIds.length;
        });

        state.posts.forEach((p) => {
          p.answers.forEach((a) => {
            if (a.authorId === student.id) {
              answersCount += 1;
              if (a.isAccepted) acceptedAnswersCount += 1;
              helpfulVotesCount += a.helpfulVoterIds.length;
              upvotesReceivedCount += a.upvoterIds.length;
            }
          });
        });

        const score =
          authoredPosts.length * 2 +
          answersCount * 3 +
          acceptedAnswersCount * 5 +
          helpfulVotesCount * 2 +
          upvotesReceivedCount;

        const base = {
          student,
          postsCount: authoredPosts.length,
          answersCount,
          acceptedAnswersCount,
          helpfulVotesCount,
          upvotesReceivedCount,
          score,
        };

        return {
          ...base,
          badges: computeBadges(base),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [allStudentsMap, state.posts, state.blockedStudentIds]);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    visiblePosts.forEach((post) => {
      post.tags.forEach((t) => {
        const normalized = t.startsWith('#') ? t : `#${t}`;
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [visiblePosts]);

  // Community membership & moderation
  const joinCommunity = (communityId: string) => {
    const comm = getCommunityById(communityId);
    if (!comm) return;
    setState((prev) => ({
      ...prev,
      communities: prev.communities.map((c) => {
        if (c.id !== communityId) return c;
        if (c.members.some((m) => m.studentId === currentStudentId)) return c;
        return {
          ...c,
          members: [
            ...c.members,
            { studentId: currentStudentId, role: 'Member', joinedAt: new Date().toISOString() },
          ],
        };
      }),
    }));
    showToast(`Joined ${comm.name}`);
  };

  const leaveCommunity = (communityId: string) => {
    const comm = getCommunityById(communityId);
    if (!comm) return;
    const role = getUserRoleInCommunity(communityId);
    if (role === 'Owner' && comm.members.length > 1) {
      showToast('Transfer ownership or assign another moderator before leaving.');
      return;
    }
    setState((prev) => ({
      ...prev,
      communities: prev.communities.map((c) =>
        c.id === communityId
          ? { ...c, members: c.members.filter((m) => m.studentId !== currentStudentId) }
          : c
      ),
    }));
    showToast(`Left ${comm.name}`);
  };

  const createCommunity = (payload: {
    name: string;
    category: CommunityCategory;
    description: string;
    rules: string[];
  }) => {
    const id = `comm_${Date.now()}`;
    const coverByCategory: Record<CommunityCategory, string> = {
      Academic: COMMUNITY_COVERS.cs,
      'Exam Preparation': COMMUNITY_COVERS.exam,
      'College Life': COMMUNITY_COVERS.campus,
      'Career & Skills': COMMUNITY_COVERS.coding,
      General: COMMUNITY_COVERS.books,
    };
    const newGroup: CommunityGroup = {
      id,
      name: payload.name.trim(),
      category: payload.category,
      description: payload.description.trim(),
      coverImage: coverByCategory[payload.category],
      rules:
        payload.rules.filter(Boolean).length > 0
          ? payload.rules.filter(Boolean)
          : ['Respect all members and keep discussions helpful and on-topic.'],
      requirePostApproval: false,
      members: [{ studentId: currentStudentId, role: 'Owner', joinedAt: new Date().toISOString() }],
      trendingTags: [],
      createdAt: new Date().toISOString(),
      isDemoCommunity: false,
    };
    setState((prev) => ({
      ...prev,
      communities: [newGroup, ...prev.communities],
    }));
    showToast(`Created community "${newGroup.name}"`);
    return id;
  };

  const updateCommunityDetails = (
    communityId: string,
    updates: Partial<Pick<CommunityGroup, 'name' | 'description' | 'category' | 'rules' | 'requirePostApproval'>>
  ) => {
    const role = getUserRoleInCommunity(communityId);
    if (role !== 'Owner' && role !== 'Moderator') {
      showToast('Only community owners or moderators can edit community settings.');
      return;
    }
    setState((prev) => ({
      ...prev,
      communities: prev.communities.map((c) => (c.id === communityId ? { ...c, ...updates } : c)),
    }));
    showToast('Community settings updated.');
  };

  const assignCommunityRole = (communityId: string, targetStudentId: string, role: CommunityMemberRole) => {
    const actorRole = getUserRoleInCommunity(communityId);
    if (actorRole !== 'Owner') {
      showToast('Only the community owner can change member roles.');
      return;
    }
    setState((prev) => ({
      ...prev,
      communities: prev.communities.map((c) =>
        c.id === communityId
          ? {
              ...c,
              members: c.members.map((m) => (m.studentId === targetStudentId ? { ...m, role } : m)),
            }
          : c
      ),
    }));
    showToast(`Updated role to ${role}.`);
  };

  const removeCommunityMember = (communityId: string, targetStudentId: string) => {
    const actorRole = getUserRoleInCommunity(communityId);
    if (actorRole !== 'Owner' && actorRole !== 'Moderator') {
      showToast('Moderator permission required.');
      return;
    }
    setState((prev) => ({
      ...prev,
      communities: prev.communities.map((c) =>
        c.id === communityId
          ? {
              ...c,
              members: c.members.filter((m) => m.studentId !== targetStudentId || m.role === 'Owner'),
            }
          : c
      ),
    }));
    showToast('Member removed from community.');
  };

  // Posts & Drafts
  const createPost = (payload: CreatePostPayload) => {
    const comm = getCommunityById(payload.communityId);
    const role = getUserRoleInCommunity(payload.communityId);
    const needsApproval = Boolean(comm?.requirePostApproval && role !== 'Owner' && role !== 'Moderator');
    const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const cleanTags = payload.tags
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const poll =
      payload.hasPoll && payload.pollQuestion?.trim() && (payload.pollOptions || []).filter((o) => o.trim()).length >= 2
        ? {
            id: `poll_${Date.now()}`,
            question: payload.pollQuestion.trim(),
            allowMultiple: Boolean(payload.pollAllowMultiple),
            expiresAt: payload.pollExpiresAt || undefined,
            createdAt: new Date().toISOString(),
            options: (payload.pollOptions || [])
              .map((o) => o.trim())
              .filter(Boolean)
              .map((label, idx) => ({
                id: `opt_${Date.now()}_${idx}`,
                label,
                voterIds: [],
              })),
          }
        : undefined;

    const newPost: CommunityPost = {
      id: postId,
      communityId: payload.communityId,
      authorId: currentStudentId,
      authorName: profile.name,
      authorAvatar: profile.avatarUrl,
      authorCourse: profile.course,
      authorSemester: profile.semester,
      type: payload.type,
      title: payload.title.trim(),
      content: payload.content.trim(),
      subject: payload.subject,
      academicLevel: payload.academicLevel,
      topicTag: payload.topicTag?.trim() || undefined,
      tags: cleanTags,
      attachment: payload.attachment,
      poll,
      createdAt: new Date().toISOString(),
      upvoterIds: [],
      helpfulIds: [],
      bookmarkedByIds: [],
      answers: [],
      comments: [],
      questionStatus: payload.type === 'Ask a Question' ? 'Unanswered' : undefined,
      isPinned: Boolean(payload.isPinned && (role === 'Owner' || role === 'Moderator')),
      isOfficialAnnouncement: Boolean(
        payload.type === 'Academic Announcement' && (role === 'Owner' || role === 'Moderator')
      ),
      pendingApproval: needsApproval,
      isDemoContent: false,
      linkedResourceType: payload.linkedResourceType,
      linkedResourceTitle: payload.linkedResourceTitle?.trim() || undefined,
      linkedResourceSummary: payload.linkedResourceSummary?.trim() || undefined,
    };

    setState((prev) => ({
      ...prev,
      posts: [newPost, ...prev.posts],
      // Auto-join community when posting in it
      communities: prev.communities.map((c) => {
        if (c.id !== payload.communityId) return c;
        if (c.members.some((m) => m.studentId === currentStudentId)) return c;
        return {
          ...c,
          members: [
            ...c.members,
            { studentId: currentStudentId, role: 'Member', joinedAt: new Date().toISOString() },
          ],
        };
      }),
    }));

    if (newPost.isOfficialAnnouncement && state.notificationPrefs.announcements) {
      addNotification({
        title: `Announcement in ${comm?.name || 'Community'}`,
        description: newPost.title,
        time: 'Just now',
        type: 'campus',
        linkRoute: '/connect/community',
      });
    }

    showToast(
      needsApproval
        ? 'Submitted for community moderator approval.'
        : payload.type === 'Ask a Question'
          ? 'Question published to Student Community.'
          : 'Post published to Student Community.'
    );
    return postId;
  };

  const updatePost = (
    postId: string,
    updates: Partial<Pick<CommunityPost, 'title' | 'content' | 'tags' | 'subject' | 'topicTag' | 'academicLevel'>>
  ) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === postId && p.authorId === currentStudentId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    showToast('Post updated.');
  };

  const deletePost = (postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
    showToast('Post removed.');
  };

  const togglePinPost = (postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p)),
    }));
    showToast('Updated pinned status.');
  };

  const approvePendingPost = (postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, pendingApproval: false } : p)),
    }));
    showToast('Post approved and published.');
  };

  const togglePostUpvote = (postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        const exists = p.upvoterIds.includes(currentStudentId);
        return {
          ...p,
          upvoterIds: exists
            ? p.upvoterIds.filter((id) => id !== currentStudentId)
            : [...p.upvoterIds, currentStudentId],
        };
      }),
    }));
  };

  const togglePostHelpful = (postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        const exists = p.helpfulIds.includes(currentStudentId);
        return {
          ...p,
          helpfulIds: exists
            ? p.helpfulIds.filter((id) => id !== currentStudentId)
            : [...p.helpfulIds, currentStudentId],
        };
      }),
    }));
  };

  const togglePostBookmark = (postId: string) => {
    const post = state.posts.find((p) => p.id === postId);
    const alreadySaved = post?.bookmarkedByIds.includes(currentStudentId);
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        const exists = p.bookmarkedByIds.includes(currentStudentId);
        return {
          ...p,
          bookmarkedByIds: exists
            ? p.bookmarkedByIds.filter((id) => id !== currentStudentId)
            : [...p.bookmarkedByIds, currentStudentId],
        };
      }),
    }));
    showToast(alreadySaved ? 'Removed from saved posts.' : 'Saved to your community bookmarks.');
  };

  const saveDraft = (draft: Omit<CommunityPostDraft, 'id' | 'savedAt'> & { id?: string }) => {
    const id = draft.id || `draft_${Date.now()}`;
    const nextDraft: CommunityPostDraft = {
      ...draft,
      id,
      savedAt: new Date().toISOString(),
    };
    setState((prev) => {
      const exists = prev.drafts.some((d) => d.id === id);
      return {
        ...prev,
        drafts: exists ? prev.drafts.map((d) => (d.id === id ? nextDraft : d)) : [nextDraft, ...prev.drafts],
      };
    });
    showToast('Draft saved locally.');
    return id;
  };

  const deleteDraft = (draftId: string) => {
    setState((prev) => ({
      ...prev,
      drafts: prev.drafts.filter((d) => d.id !== draftId),
    }));
    showToast('Draft discarded.');
  };

  // Polls: strict duplicate guard per voter
  const voteInPoll = (postId: string, optionIds: string[]) => {
    if (optionIds.length === 0) return;
    const post = state.posts.find((p) => p.id === postId);
    if (!post?.poll) return;

    if (post.poll.expiresAt && new Date(post.poll.expiresAt).getTime() < Date.now()) {
      showToast('This poll has closed.');
      return;
    }
    if (post.poll.options.some((o) => o.voterIds.includes(currentStudentId))) {
      showToast('You have already voted in this poll.');
      return;
    }

    const allowedIds = post.poll.allowMultiple ? optionIds : [optionIds[0]];
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId || !p.poll) return p;
        return {
          ...p,
          poll: {
            ...p.poll,
            options: p.poll.options.map((opt) =>
              allowedIds.includes(opt.id)
                ? { ...opt, voterIds: [...opt.voterIds, currentStudentId] }
                : opt
            ),
          },
        };
      }),
    }));
    showToast('Vote recorded.');
  };

  // Q&A Answers & Comments
  const submitAnswer = (postId: string, content: string, attachment?: CommunityAttachment) => {
    const answerId = `ans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const targetPost = state.posts.find((p) => p.id === postId);

    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        const newAns = {
          id: answerId,
          postId,
          authorId: currentStudentId,
          authorName: profile.name,
          authorAvatar: profile.avatarUrl,
          authorCourse: profile.course,
          content: content.trim(),
          attachment,
          createdAt: new Date().toISOString(),
          upvoterIds: [],
          helpfulVoterIds: [],
          isAccepted: false,
          replies: [],
        };
        return {
          ...p,
          answers: [...p.answers, newAns],
          questionStatus: p.questionStatus === 'Solved' ? 'Solved' : 'Answered',
        };
      }),
    }));

    if (targetPost && state.notificationPrefs.replies && !isPostMuted(postId)) {
      addNotification({
        title: 'Answer posted to question',
        description: `${profile.name} answered "${targetPost.title.slice(0, 60)}"`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/connect/community',
      });
    }

    showToast('Answer submitted.');
    return answerId;
  };

  const editAnswer = (postId: string, answerId: string, content: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              answers: p.answers.map((a) =>
                a.id === answerId && a.authorId === currentStudentId
                  ? { ...a, content: content.trim(), updatedAt: new Date().toISOString() }
                  : a
              ),
            }
          : p
      ),
    }));
    showToast('Answer updated.');
  };

  const deleteAnswer = (postId: string, answerId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        const nextAnswers = p.answers.filter((a) => a.id !== answerId);
        const stillSolved = nextAnswers.some((a) => a.isAccepted);
        return {
          ...p,
          answers: nextAnswers,
          acceptedAnswerId: stillSolved ? p.acceptedAnswerId : undefined,
          questionStatus: stillSolved ? 'Solved' : nextAnswers.length > 0 ? 'Answered' : 'Unanswered',
        };
      }),
    }));
    showToast('Answer removed.');
  };

  const toggleAnswerUpvote = (postId: string, answerId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              answers: p.answers.map((a) => {
                if (a.id !== answerId) return a;
                const exists = a.upvoterIds.includes(currentStudentId);
                return {
                  ...a,
                  upvoterIds: exists
                    ? a.upvoterIds.filter((id) => id !== currentStudentId)
                    : [...a.upvoterIds, currentStudentId],
                };
              }),
            }
          : p
      ),
    }));
  };

  const toggleAnswerHelpful = (postId: string, answerId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              answers: p.answers.map((a) => {
                if (a.id !== answerId) return a;
                const exists = a.helpfulVoterIds.includes(currentStudentId);
                return {
                  ...a,
                  helpfulVoterIds: exists
                    ? a.helpfulVoterIds.filter((id) => id !== currentStudentId)
                    : [...a.helpfulVoterIds, currentStudentId],
                };
              }),
            }
          : p
      ),
    }));
  };

  const acceptAnswer = (postId: string, answerId: string) => {
    const post = state.posts.find((p) => p.id === postId);
    if (!post || post.authorId !== currentStudentId) {
      showToast('Only the question author can mark an accepted answer.');
      return;
    }
    const isTogglingOff = post.acceptedAnswerId === answerId;
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          acceptedAnswerId: isTogglingOff ? undefined : answerId,
          questionStatus: isTogglingOff ? (p.answers.length > 0 ? 'Answered' : 'Unanswered') : 'Solved',
          answers: p.answers.map((a) => ({
            ...a,
            isAccepted: isTogglingOff ? false : a.id === answerId,
          })),
        };
      }),
    }));
    if (!isTogglingOff && state.notificationPrefs.acceptedAnswers) {
      addNotification({
        title: 'Question marked as Solved',
        description: `Accepted solution selected for "${post.title.slice(0, 60)}"`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/connect/community',
      });
    }
    showToast(isTogglingOff ? 'Cleared accepted answer.' : 'Marked as Accepted Answer!');
  };

  const addCommentOrReply = (postId: string, content: string, answerId?: string, parentReplyId?: string) => {
    if (!content.trim()) return;
    const reply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      parentId: parentReplyId,
      authorId: currentStudentId,
      authorName: profile.name,
      authorAvatar: profile.avatarUrl,
      authorCourse: profile.course,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      upvoterIds: [],
    };
    const targetPost = state.posts.find((p) => p.id === postId);

    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        if (answerId) {
          return {
            ...p,
            answers: p.answers.map((a) =>
              a.id === answerId ? { ...a, replies: [...a.replies, reply] } : a
            ),
          };
        }
        return { ...p, comments: [...p.comments, reply] };
      }),
    }));

    if (targetPost && state.notificationPrefs.replies && !isPostMuted(postId)) {
      addNotification({
        title: 'New discussion reply',
        description: `${profile.name} replied on "${targetPost.title.slice(0, 55)}"`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/connect/community',
      });
    }
  };

  const editCommentOrReply = (postId: string, replyId: string, content: string, answerId?: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        if (answerId) {
          return {
            ...p,
            answers: p.answers.map((a) =>
              a.id === answerId
                ? {
                    ...a,
                    replies: a.replies.map((r) =>
                      r.id === replyId && r.authorId === currentStudentId
                        ? { ...r, content: content.trim(), updatedAt: new Date().toISOString() }
                        : r
                    ),
                  }
                : a
            ),
          };
        }
        return {
          ...p,
          comments: p.comments.map((c) =>
            c.id === replyId && c.authorId === currentStudentId
              ? { ...c, content: content.trim(), updatedAt: new Date().toISOString() }
              : c
          ),
        };
      }),
    }));
    showToast('Comment updated.');
  };

  const deleteCommentOrReply = (postId: string, replyId: string, answerId?: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        if (answerId) {
          return {
            ...p,
            answers: p.answers.map((a) =>
              a.id === answerId
                ? { ...a, replies: a.replies.filter((r) => r.id !== replyId && r.parentId !== replyId) }
                : a
            ),
          };
        }
        return {
          ...p,
          comments: p.comments.filter((c) => c.id !== replyId && c.parentId !== replyId),
        };
      }),
    }));
    showToast('Comment removed.');
  };

  const toggleReplyUpvote = (postId: string, replyId: string, answerId?: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => {
        if (p.id !== postId) return p;
        if (answerId) {
          return {
            ...p,
            answers: p.answers.map((a) =>
              a.id === answerId
                ? {
                    ...a,
                    replies: a.replies.map((r) => {
                      if (r.id !== replyId) return r;
                      const exists = r.upvoterIds.includes(currentStudentId);
                      return {
                        ...r,
                        upvoterIds: exists
                          ? r.upvoterIds.filter((id) => id !== currentStudentId)
                          : [...r.upvoterIds, currentStudentId],
                      };
                    }),
                  }
                : a
            ),
          };
        }
        return {
          ...p,
          comments: p.comments.map((c) => {
            if (c.id !== replyId) return c;
            const exists = c.upvoterIds.includes(currentStudentId);
            return {
              ...c,
              upvoterIds: exists
                ? c.upvoterIds.filter((id) => id !== currentStudentId)
                : [...c.upvoterIds, currentStudentId],
            };
          }),
        };
      }),
    }));
  };

  // Social, Search, Safety & Notifications
  const toggleFollowStudent = (studentId: string) => {
    if (studentId === currentStudentId) return;
    const student = getStudentById(studentId);
    const alreadyFollowing = state.followedStudentIds.includes(studentId);
    setState((prev) => ({
      ...prev,
      followedStudentIds: alreadyFollowing
        ? prev.followedStudentIds.filter((id) => id !== studentId)
        : [...prev.followedStudentIds, studentId],
    }));
    showToast(alreadyFollowing ? `Unfollowed ${student?.name || 'student'}` : `Following ${student?.name || 'student'}`);
  };

  const toggleBlockStudent = (studentId: string) => {
    if (studentId === currentStudentId) return;
    const student = getStudentById(studentId);
    const alreadyBlocked = state.blockedStudentIds.includes(studentId);
    setState((prev) => ({
      ...prev,
      blockedStudentIds: alreadyBlocked
        ? prev.blockedStudentIds.filter((id) => id !== studentId)
        : [...prev.blockedStudentIds, studentId],
      followedStudentIds: alreadyBlocked
        ? prev.followedStudentIds
        : prev.followedStudentIds.filter((id) => id !== studentId),
    }));
    showToast(alreadyBlocked ? `Unblocked ${student?.name || 'student'}` : `Blocked ${student?.name || 'student'}`);
  };

  const toggleMuteCommunity = (communityId: string) => {
    const alreadyMuted = state.mutedCommunityIds.includes(communityId);
    setState((prev) => ({
      ...prev,
      mutedCommunityIds: alreadyMuted
        ? prev.mutedCommunityIds.filter((id) => id !== communityId)
        : [...prev.mutedCommunityIds, communityId],
    }));
    showToast(alreadyMuted ? 'Community notifications unmuted.' : 'Community notifications muted.');
  };

  const toggleMutePost = (postId: string) => {
    const alreadyMuted = state.mutedPostIds.includes(postId);
    setState((prev) => ({
      ...prev,
      mutedPostIds: alreadyMuted
        ? prev.mutedPostIds.filter((id) => id !== postId)
        : [...prev.mutedPostIds, postId],
    }));
    showToast(alreadyMuted ? 'Thread notifications unmuted.' : 'Thread notifications muted.');
  };

  const addRecentSearch = (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      recentSearches: [clean, ...prev.recentSearches.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 6),
    }));
  };

  const clearRecentSearches = () => {
    setState((prev) => ({ ...prev, recentSearches: [] }));
  };

  const submitSafetyReport = (payload: {
    targetType: SafetyReport['targetType'];
    targetId: string;
    targetTitle: string;
    reason: ReportReason;
    details: string;
  }) => {
    const report: SafetyReport = {
      id: `rep_${Date.now()}`,
      targetType: payload.targetType,
      targetId: payload.targetId,
      targetTitle: payload.targetTitle,
      reason: payload.reason,
      details: payload.details.trim(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      reports: [report, ...prev.reports],
    }));
    showToast('Report submitted for moderation review.');
  };

  const updateNotificationPrefs = (updates: Partial<CommunityNotificationPrefs>) => {
    setState((prev) => ({
      ...prev,
      notificationPrefs: { ...prev.notificationPrefs, ...updates },
    }));
    showToast('Notification preferences updated.');
  };

  // Save community post/resource into Study Hub Personal Notes
  const saveResourceToStudyHub = (post: CommunityPost) => {
    try {
      const raw = localStorage.getItem(STUDY_HUB_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const now = new Date().toISOString();
      const firstSubjectId = parsed?.subjects?.[0]?.id || 'sub_dsa';
      const newNote = {
        id: `note_comm_${Date.now()}`,
        title: post.linkedResourceTitle || post.title,
        description: `Saved from Student Community · ${getCommunityById(post.communityId)?.name || 'Community'}`,
        content: `# ${post.title}\n\n**Shared by:** ${post.authorName} (${post.authorCourse})\n\n${post.linkedResourceSummary ? `${post.linkedResourceSummary}\n\n` : ''}${post.content}`,
        subjectId: firstSubjectId,
        pinned: false,
        bookmarked: true,
        createdAt: now,
        updatedAt: now,
      };
      if (parsed && Array.isArray(parsed.personalNotes)) {
        const updated = {
          ...parsed,
          personalNotes: [newNote, ...parsed.personalNotes],
        };
        localStorage.setItem(STUDY_HUB_STORAGE_KEY, JSON.stringify(updated));
      } else {
        localStorage.setItem(
          STUDY_HUB_STORAGE_KEY,
          JSON.stringify({ personalNotes: [newNote] })
        );
      }
      showToast('Saved to Study Hub personal notes!');
    } catch {
      showToast('Could not write to Study Hub storage.');
    }
  };

  const askAiHelper = async (
    mode: 'summarize' | 'explain' | 'related-questions' | 'improve-clarity',
    inputText: string
  ): Promise<{ text: string; error?: string }> => {
    const promptByMode: Record<typeof mode, string> = {
      summarize: `Summarize this academic student community discussion in clear bullet points with key takeaways and resolved doubts:\n\n${inputText}`,
      explain: `Explain this student question and answer clearly with intuition, core formulas/principles, and step-by-step reasoning:\n\n${inputText}`,
      'related-questions': `Based on this student discussion, suggest 4 high-value follow-up practice or conceptual questions with brief hints:\n\n${inputText}`,
      'improve-clarity': `Improve the clarity, academic structure, and readability of this student draft post without inventing new facts:\n\n${inputText}`,
    };

    try {
      const res = await sendAiChatMessage({
        messages: [{ role: 'user', content: promptByMode[mode] }],
        language: language === 'hi' ? 'Hindi' : 'English',
        learningLevel: 'Intermediate',
        responseStyle: mode === 'explain' ? 'Exam-Oriented Answer' : 'Simple Explanation',
      });
      return { text: res.reply };
    } catch (err) {
      return {
        text: '',
        error: err instanceof Error ? err.message : 'KAMPUS AI is currently unavailable.',
      };
    }
  };

  return (
    <CommunityContext.Provider
      value={{
        state,
        language,
        setLanguage,
        currentStudentId,
        currentPublicProfile,
        toastMessage,
        showToast,
        visiblePosts,
        contributorStats,
        trendingTags,
        getStudentById,
        getCommunityById,
        getUserRoleInCommunity,
        isMemberOfCommunity,
        isFollowingStudent,
        isBlockedStudent,
        isCommunityMuted,
        isPostMuted,
        hasVotedInPoll,
        joinCommunity,
        leaveCommunity,
        createCommunity,
        updateCommunityDetails,
        assignCommunityRole,
        removeCommunityMember,
        createPost,
        updatePost,
        deletePost,
        togglePinPost,
        approvePendingPost,
        togglePostUpvote,
        togglePostHelpful,
        togglePostBookmark,
        saveDraft,
        deleteDraft,
        voteInPoll,
        submitAnswer,
        editAnswer,
        deleteAnswer,
        toggleAnswerUpvote,
        toggleAnswerHelpful,
        acceptAnswer,
        addCommentOrReply,
        editCommentOrReply,
        deleteCommentOrReply,
        toggleReplyUpvote,
        toggleFollowStudent,
        toggleBlockStudent,
        toggleMuteCommunity,
        toggleMutePost,
        addRecentSearch,
        clearRecentSearches,
        submitSafetyReport,
        updateNotificationPrefs,
        saveResourceToStudyHub,
        askAiHelper,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within a CommunityProvider');
  return ctx;
};
