import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  CommunityGroup,
  CommunityPost,
  CommunityState,
  PublicStudentProfile,
  SafetyReport,
} from '../src/types/community.ts';

const DB_PATH = path.join(process.cwd(), '.kampus_community_db.json');

const INITIAL_COMMUNITIES: CommunityGroup[] = [
  {
    id: 'comm_tech_coding',
    name: 'Engineers & Developers Club',
    description: 'Central campus developer community for competitive programming, fullstack projects, and collaborative research.',
    category: 'Academic',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    rules: [
      'Share clean, reproducible code blocks with language annotations',
      'No unsolicited recruitment or commercial spamming',
      'Encourage constructive feedback and respectful peer reviews',
    ],
    requirePostApproval: false,
    members: [
      { studentId: 'stu_aditya', role: 'Owner', joinedAt: '2026-01-10T00:00:00Z' },
      { studentId: 'usr_22b030149', role: 'Moderator', joinedAt: '2026-01-10T00:00:00Z' },
    ],
    trendingTags: ['#DSA', '#SystemDesign', '#Hackathons', '#WebDev'],
    createdAt: '2026-01-10T00:00:00Z',
    isDemoCommunity: false,
  },
  {
    id: 'comm_gate_prep',
    name: 'GATE & National Competitive Circle',
    description: 'Focused academic preparation circle for GATE CS/IT, ECE, EE, and PSUs shortlists.',
    category: 'Exam Preparation',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
    rules: [
      'Verify answers against official answer keys before claiming correctness',
      'Cite subject, year, and paper code when sharing numericals',
    ],
    requirePostApproval: false,
    members: [{ studentId: 'stu_kabir', role: 'Owner', joinedAt: '2026-01-15T00:00:00Z' }],
    trendingTags: ['#GATE2027', '#PYQs', '#Formulas', '#Engineering'],
    createdAt: '2026-01-15T00:00:00Z',
    isDemoCommunity: false,
  },
  {
    id: 'comm_campus_life',
    name: 'Campus Life, Fests & Opportunities',
    description: 'The unofficial collegiate square for inter-hostel fests, club auditions, sports leagues, and campus life.',
    category: 'College Life',
    coverImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80',
    rules: [
      'Maintain collegiate decorum and mutual respect',
      'Tag official club events with date, venue, and registration links',
    ],
    requirePostApproval: false,
    members: [{ studentId: 'stu_meera', role: 'Owner', joinedAt: '2026-01-01T00:00:00Z' }],
    trendingTags: ['#CampusFest', '#Clubs', '#HostelLife', '#Sports'],
    createdAt: '2026-01-01T00:00:00Z',
    isDemoCommunity: false,
  },
];

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_dsa_recursion',
    communityId: 'comm_tech_coding',
    authorId: 'stu_aditya',
    authorName: 'Aditya Kulkarni',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    authorCourse: 'B.Tech CS & Distributed Systems',
    authorSemester: 'Sem 6',
    type: 'Ask a Question',
    title: 'How to intuitively analyze optimal substructure in interval scheduling vs knapsack DP?',
    content: 'When setting up 2D DP recurrence relations, I struggle with deciding when to break subproblems by intervals `[i, j]` versus prefixes `1..i`. Any clear mental model or rule of thumb that experienced competitive coders use?',
    subject: 'Computer Science',
    academicLevel: 'Undergraduate',
    topicTag: 'Dynamic Programming',
    tags: ['#Algorithms', '#DynamicProgramming', '#InterviewPrep'],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    upvoterIds: ['stu_rohan', 'usr_22b030149'],
    helpfulIds: ['usr_22b030149'],
    bookmarkedByIds: ['usr_22b030149'],
    isPinned: true,
    answers: [
      {
        id: 'ans_dsa_1',
        postId: 'post_dsa_recursion',
        authorId: 'usr_22b030149',
        authorName: 'Priya Sharma',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        authorCourse: 'B.Tech CS & AI',
        content: 'Check whether the cost depends only on the previous step or on combinations of left and right parts. If merging two arbitrary sub-intervals `[i..k]` and `[k+1..j]` creates the answer (like Matrix Chain Multiplication), use interval DP. If adding an item only affects capacity remaining, use 1D/2D prefix DP.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        upvoterIds: ['stu_aditya', 'stu_rohan'],
        helpfulVoterIds: ['stu_aditya'],
        isAccepted: true,
        replies: [],
      },
    ],
    comments: [],
  },
  {
    id: 'post_hackathon_win',
    communityId: 'comm_campus_life',
    authorId: 'stu_meera',
    authorName: 'Meera Iyer',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    authorCourse: 'B.Com (Hons) & Tech Entrepreneurship',
    authorSemester: 'Sem 4',
    type: 'Share an Achievement',
    title: 'Our team won 1st Place at the National Civic Tech Hackathon!',
    content: 'We built a decentralized campus ride-sharing and book exchange platform using KAMPUS APIs. Huge thanks to everyone in this community who answered our questions last weekend!',
    tags: ['#Hackathon', '#Winner', '#StudentFounders'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    upvoterIds: ['stu_aditya', 'stu_aditya', 'usr_22b030149'],
    helpfulIds: ['stu_aditya'],
    bookmarkedByIds: [],
    answers: [],
    comments: [
      {
        id: 'com_hack_1',
        authorId: 'stu_aditya',
        authorName: 'Aditya Kulkarni',
        authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        authorCourse: 'B.Tech CS',
        content: 'Congratulations Meera and team! Super well deserved!',
        createdAt: new Date(Date.now() - 40000000).toISOString(),
        upvoterIds: ['stu_meera'],
      },
    ],
  },
];

const INITIAL_FALLBACK_STATE: CommunityState = {
  communities: INITIAL_COMMUNITIES,
  posts: INITIAL_POSTS,
  drafts: [],
  publicStudents: [],
  followedStudentIds: ['stu_aditya', 'stu_meera'],
  blockedStudentIds: [],
  mutedCommunityIds: [],
  mutedPostIds: [],
  recentSearches: ['Dynamic Programming', 'GATE 2027', 'Algorithms'],
  reports: [],
  notificationPrefs: {
    replies: true,
    acceptedAnswers: true,
    announcements: true,
    polls: true,
    newPostsInFollowed: true,
  },
};

function loadDb(): CommunityState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (data && Array.isArray(data.posts) && data.posts.length > 0) {
        return {
          ...INITIAL_FALLBACK_STATE,
          ...data,
          communities: data.communities?.length ? data.communities : INITIAL_FALLBACK_STATE.communities,
          posts: data.posts?.length ? data.posts : INITIAL_FALLBACK_STATE.posts,
        };
      }
    }
  } catch (err) {
    console.error('[CommunityDB Load Error]:', err);
  }
  saveDb(INITIAL_FALLBACK_STATE);
  return INITIAL_FALLBACK_STATE;
}

function saveDb(db: CommunityState): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[CommunityDB Save Error]:', err);
  }
}

export function registerCommunityBackend(app: Express): void {
  /**
   * 1. Bootstrap: Fetch complete community state
   */
  app.get('/api/community/bootstrap', (_req: Request, res: Response): void => {
    try {
      const db = loadDb();
      res.json({ success: true, data: db });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 2. Create Post
   */
  app.post('/api/community/post', (req: Request, res: Response): void => {
    try {
      const {
        communityId,
        authorId,
        authorName,
        authorAvatar,
        authorCourse,
        authorSemester,
        type,
        title,
        content,
        subject,
        academicLevel,
        topicTag,
        tags = [],
        attachment,
        hasPoll,
        pollQuestion,
        pollOptions,
      } = req.body;

      if (!title || !content) {
        res.status(400).json({ success: false, error: 'Post title and content are required.' });
        return;
      }

      const db = loadDb();
      const newPost: CommunityPost = {
        id: 'post_' + Date.now().toString(36) + '_' + crypto.randomBytes(2).toString('hex'),
        communityId: communityId || 'comm_tech_coding',
        authorId: authorId || 'usr_live_student',
        authorName: authorName || 'Campus Scholar',
        authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        authorCourse: authorCourse || 'Undergraduate',
        authorSemester: authorSemester || 'Semester 6',
        type: type || 'General Discussion',
        title: title.trim(),
        content: content.trim(),
        subject,
        academicLevel,
        topicTag,
        tags: Array.isArray(tags) ? tags : [],
        attachment,
        poll: hasPoll && pollQuestion
          ? {
              id: 'poll_' + Date.now().toString(36),
              question: pollQuestion,
              options: Array.isArray(pollOptions)
                ? pollOptions.map((opt: string, idx: number) => ({
                    id: 'opt_' + idx,
                    label: opt,
                    voterIds: [],
                  }))
                : [],
              allowMultiple: false,
              createdAt: new Date().toISOString(),
            }
          : undefined,
        createdAt: new Date().toISOString(),
        upvoterIds: [],
        helpfulIds: [],
        bookmarkedByIds: [],
        answers: [],
        comments: [],
      };

      db.posts.unshift(newPost);
      saveDb(db);
      res.status(201).json({ success: true, data: newPost });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 3. Toggle Upvote on Post
   */
  app.post('/api/community/post/:id/upvote', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ success: false, error: 'User ID is required.' });
        return;
      }

      const db = loadDb();
      const post = db.posts.find((p) => p.id === id);
      if (!post) {
        res.status(404).json({ success: false, error: 'Post not found.' });
        return;
      }

      const hasUpvoted = post.upvoterIds.includes(userId);
      if (hasUpvoted) {
        post.upvoterIds = post.upvoterIds.filter((u) => u !== userId);
      } else {
        post.upvoterIds.push(userId);
      }

      saveDb(db);
      res.json({ success: true, upvoterIds: post.upvoterIds, isUpvoted: !hasUpvoted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 4. Add Comment or Reply
   */
  app.post('/api/community/post/:id/comment', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { authorId, authorName, authorAvatar, authorCourse, content } = req.body;
      if (!content) {
        res.status(400).json({ success: false, error: 'Comment content cannot be empty.' });
        return;
      }

      const db = loadDb();
      const post = db.posts.find((p) => p.id === id);
      if (!post) {
        res.status(404).json({ success: false, error: 'Post not found.' });
        return;
      }

      const newComment = {
        id: 'com_' + Date.now().toString(36),
        authorId: authorId || 'usr_live_student',
        authorName: authorName || 'Campus Scholar',
        authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        authorCourse: authorCourse || 'Student',
        content: content.trim(),
        createdAt: new Date().toISOString(),
        upvoterIds: [],
      };

      if (!post.comments) post.comments = [];
      post.comments.push(newComment);
      saveDb(db);
      res.status(201).json({ success: true, comment: newComment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 5. Add Answer (Q&A mode)
   */
  app.post('/api/community/post/:id/answer', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { authorId, authorName, authorAvatar, authorCourse, content } = req.body;
      if (!content) {
        res.status(400).json({ success: false, error: 'Answer content is required.' });
        return;
      }

      const db = loadDb();
      const post = db.posts.find((p) => p.id === id);
      if (!post) {
        res.status(404).json({ success: false, error: 'Post not found.' });
        return;
      }

      const newAnswer = {
        id: 'ans_' + Date.now().toString(36),
        postId: id,
        authorId: authorId || 'usr_live_student',
        authorName: authorName || 'Campus Scholar',
        authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        authorCourse: authorCourse || 'Undergraduate',
        content: content.trim(),
        createdAt: new Date().toISOString(),
        upvoterIds: [],
        helpfulVoterIds: [],
        isAccepted: false,
        replies: [],
      };

      if (!post.answers) post.answers = [];
      post.answers.push(newAnswer);
      saveDb(db);
      res.status(201).json({ success: true, answer: newAnswer });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 6. State Sync
   */
  app.post('/api/community/sync', (req: Request, res: Response): void => {
    try {
      const clientState = req.body;
      if (clientState && Array.isArray(clientState.posts)) {
        saveDb(clientState);
      }
      res.json({ success: true, message: 'Community synchronized.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
