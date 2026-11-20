import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  SkillCategoryDef,
  SkillExchange,
  SkillExchangeRequest,
  SkillListing,
  SkillReview,
  SkillSession,
  SkillSwapReport,
  StudentSkillProfile,
} from '../src/types/skillSwap.ts';

interface StoredFileRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Data: string;
  uploadedBy: string;
  createdAt: string;
}

interface SkillSwapDatabase {
  categories: SkillCategoryDef[];
  profiles: StudentSkillProfile[];
  listings: SkillListing[];
  requests: SkillExchangeRequest[];
  exchanges: SkillExchange[];
  reviews: SkillReview[];
  savedByUser: Record<string, string[]>;
  blockedByUser: Record<string, string[]>;
  reports: SkillSwapReport[];
  files: Record<string, StoredFileRecord>;
}

const DB_FILE = path.join(process.cwd(), '.kampus_skillswap_db.json');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const SEEDED_CATEGORIES: SkillCategoryDef[] = [
  {
    id: 'technology',
    name: 'Technology',
    description: 'Programming languages, software architecture, AI, and security',
    skills: [
      'Python',
      'Java',
      'C and C++',
      'Web Development',
      'App Development',
      'UI/UX Design',
      'Artificial Intelligence',
      'Data Science',
      'Cybersecurity',
      'Database Management',
    ],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Visual design, storytelling, video editing, and digital media',
    skills: [
      'Graphic Design',
      'Video Editing',
      'Photography',
      'Illustration',
      'Animation',
      'Content Creation',
      'Digital Art',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Ventures, growth marketing, strategy, and financial planning',
    skills: [
      'Entrepreneurship',
      'Marketing',
      'Digital Marketing',
      'Business Strategy',
      'Financial Literacy',
      'Project Management',
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Speaking fluency, writing clarity, and interview readiness',
    skills: [
      'English Speaking',
      'Public Speaking',
      'Communication Skills',
      'Creative Writing',
      'Presentation Skills',
      'Interview Preparation',
    ],
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Core sciences, quantitative reasoning, research, and exam prep',
    skills: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Research Skills',
      'Competitive Exam Preparation',
    ],
  },
  {
    id: 'practical',
    name: 'Practical',
    description: 'Everyday productivity software, portfolios, and career readiness',
    skills: [
      'Excel',
      'PowerPoint',
      'Coding Projects',
      'Resume Building',
      'Freelancing',
      'Basic Computer Skills',
    ],
  },
  {
    id: 'personal-development',
    name: 'Personal Development',
    description: 'Leadership habits, focus systems, and structured problem solving',
    skills: ['Leadership', 'Time Management', 'Productivity', 'Problem Solving'],
  },
];

function createSeedDatabase(): SkillSwapDatabase {
  const now = Date.now();
  const isoAgo = (hours: number) => new Date(now - hours * 3600_000).toISOString();

  const profiles: StudentSkillProfile[] = [
    {
      userId: 'stu_ananya_desai',
      name: 'Ananya Desai',
      college: 'IDC School of Design, IIT Bombay',
      course: 'B.Des in Visual Communication',
      semester: 'Semester 6',
      intro:
        'Visual designer focused on brand systems, Figma prototyping, and motion graphics. Looking to build strong Python scripting skills for generative design.',
      languages: ['English', 'Hindi', 'Marathi'],
      learningInterests: ['Python', 'Artificial Intelligence', 'Creative Coding'],
      skillsToTeach: [
        {
          id: 't_ananya_1',
          skillName: 'Graphic Design',
          categoryId: 'creative',
          proficiency: 'Advanced',
          experience: '2+ Years',
          topicsCovered: ['Typography', 'Grid Systems', 'Brand Posters', 'Figma Layouts'],
          availabilityNote: 'Tue & Thu evenings, Sat afternoons',
          verificationLabel: 'Self-Reported',
        },
        {
          id: 't_ananya_2',
          skillName: 'UI/UX Design',
          categoryId: 'technology',
          proficiency: 'Advanced',
          experience: '1-2 Years',
          topicsCovered: ['User Flows', 'Wireframing', 'Component Libraries', 'Design Critique'],
          availabilityNote: 'Flexible weekends',
          verificationLabel: 'Self-Reported',
        },
      ],
      skillsToLearn: [
        {
          id: 'l_ananya_1',
          skillName: 'Python',
          categoryId: 'technology',
          preferredLevel: 'Beginner',
          learningGoal: 'Write clean scripts for data visualization and automation.',
        },
      ],
      portfolio: [
        {
          id: 'pf_ananya_1',
          title: 'Campus Tech Fest Visual Identity',
          category: 'Graphic Design',
          description: 'Complete modular poster grid, signage system, and web UI kit.',
        },
      ],
      projects: [
        {
          id: 'pr_ananya_1',
          title: 'Accessible Student Timetable UI Kit',
          summary: 'Open Figma component library designed for mobile-first college apps.',
        },
      ],
      achievements: ['Design Club Lead', 'Best UI Prototype Award 2025'],
      learningPreferences: {
        format: 'Hybrid',
        groupMode: 'Individual (1-on-1)',
        sessionDurationMinutes: 60,
      },
      availability: {
        days: ['Tue', 'Thu', 'Sat'],
        preferredTime: '6:00 PM - 8:30 PM',
        weeklyHours: 4,
      },
      privacySettings: {
        showCollegeDetails: true,
        allowDirectRequests: true,
        allowMessagesFromPeers: true,
      },
      updatedAt: isoAgo(12),
    },
    {
      userId: 'stu_rohan_nair',
      name: 'Rohan Nair',
      college: 'Indian Institute of Technology, Bombay',
      course: 'B.Tech in Electrical Engineering',
      semester: 'Semester 6',
      intro:
        'Interested in backend systems, data pipelines, and applied statistics. Happy to teach Python and SQL while improving visual presentation and design skills.',
      languages: ['English', 'Hindi'],
      learningInterests: ['Graphic Design', 'Presentation Skills', 'Data Science'],
      skillsToTeach: [
        {
          id: 't_rohan_1',
          skillName: 'Python',
          categoryId: 'technology',
          proficiency: 'Mentor-Ready',
          experience: '2+ Years',
          topicsCovered: ['Data Structures', 'Pandas & NumPy', 'REST APIs', 'Clean Code'],
          availabilityNote: 'Mon, Wed, Sat evenings',
          verificationLabel: 'Self-Reported',
        },
        {
          id: 't_rohan_2',
          skillName: 'Database Management',
          categoryId: 'technology',
          proficiency: 'Advanced',
          experience: '1-2 Years',
          topicsCovered: ['SQL Joins', 'Schema Design', 'Indexing Basics'],
          availabilityNote: 'Weekends',
          verificationLabel: 'Self-Reported',
        },
      ],
      skillsToLearn: [
        {
          id: 'l_rohan_1',
          skillName: 'Graphic Design',
          categoryId: 'creative',
          preferredLevel: 'Beginner',
          learningGoal: 'Create clear technical diagrams and project showcase slides.',
        },
        {
          id: 'l_rohan_2',
          skillName: 'UI/UX Design',
          categoryId: 'technology',
          preferredLevel: 'Beginner',
          learningGoal: 'Improve layout hierarchy for hackathon web demos.',
        },
      ],
      portfolio: [],
      projects: [
        {
          id: 'pr_rohan_1',
          title: 'Campus Bus ETA Tracker API',
          summary: 'Python FastAPI service aggregating timetable schedules.',
        },
      ],
      achievements: ['Python Teaching Assistant (CS101)'],
      learningPreferences: {
        format: 'Online',
        groupMode: 'Individual (1-on-1)',
        sessionDurationMinutes: 45,
      },
      availability: {
        days: ['Mon', 'Wed', 'Sat'],
        preferredTime: '7:00 PM - 9:00 PM',
        weeklyHours: 3,
      },
      privacySettings: {
        showCollegeDetails: true,
        allowDirectRequests: true,
        allowMessagesFromPeers: true,
      },
      updatedAt: isoAgo(8),
    },
    {
      userId: 'stu_meera_kulkarni',
      name: 'Meera Kulkarni',
      college: 'IIT Bombay · Shailesh J. Mehta School of Management',
      course: 'Dual Degree Mechanical & Management',
      semester: 'Semester 8',
      intro:
        'Debate society speaker and case-study finalist. Offering structured Interview Preparation and Public Speaking mentorship to peers.',
      languages: ['English', 'Hindi', 'Marathi'],
      learningInterests: ['Web Development', 'Data Science', 'Excel'],
      skillsToTeach: [
        {
          id: 't_meera_1',
          skillName: 'Public Speaking',
          categoryId: 'communication',
          proficiency: 'Mentor-Ready',
          experience: '2+ Years',
          topicsCovered: ['Structuring Arguments', 'Stage Confidence', 'Q&A Handling'],
          availabilityNote: 'Fri evenings & Sunday mornings',
          verificationLabel: 'Self-Reported',
        },
        {
          id: 't_meera_2',
          skillName: 'Interview Preparation',
          categoryId: 'communication',
          proficiency: 'Advanced',
          experience: '1-2 Years',
          topicsCovered: ['Behavioral Stories', 'Resume Walkthrough', 'Mock Interviews'],
          availabilityNote: 'Weekends',
          verificationLabel: 'Self-Reported',
        },
      ],
      skillsToLearn: [
        {
          id: 'l_meera_1',
          skillName: 'Web Development',
          categoryId: 'technology',
          preferredLevel: 'Beginner',
          learningGoal: 'Build a personal portfolio website using React and Tailwind.',
        },
      ],
      portfolio: [],
      projects: [
        {
          id: 'pr_meera_1',
          title: 'Inter-IIT Case Competition Winning Deck',
          summary: 'Financial modeling and market entry framework.',
        },
      ],
      achievements: ['Inter-IIT Debate Finalist'],
      learningPreferences: {
        format: 'Hybrid',
        groupMode: 'Both',
        sessionDurationMinutes: 45,
      },
      availability: {
        days: ['Fri', 'Sun'],
        preferredTime: '10:00 AM - 1:00 PM',
        weeklyHours: 3,
      },
      privacySettings: {
        showCollegeDetails: true,
        allowDirectRequests: true,
        allowMessagesFromPeers: true,
      },
      updatedAt: isoAgo(18),
    },
    {
      userId: 'stu_kabir_mehta',
      name: 'Kabir Mehta',
      college: 'Indian Institute of Technology, Bombay',
      course: 'B.Tech in Computer Science & Engineering',
      semester: 'Semester 7',
      intro:
        'Full-stack React/TypeScript builder and quantitative problem solver. Open to mentoring Coding Projects or swapping Web Development for Video Editing.',
      languages: ['English', 'Hindi'],
      learningInterests: ['Video Editing', 'Content Creation', 'Financial Literacy'],
      skillsToTeach: [
        {
          id: 't_kabir_1',
          skillName: 'Web Development',
          categoryId: 'technology',
          proficiency: 'Advanced',
          experience: '2+ Years',
          topicsCovered: ['React Hooks', 'TypeScript', 'REST APIs', 'Responsive UI'],
          availabilityNote: 'Tue, Thu, Sun evenings',
          verificationLabel: 'Self-Reported',
        },
        {
          id: 't_kabir_2',
          skillName: 'Coding Projects',
          categoryId: 'practical',
          proficiency: 'Advanced',
          experience: '2+ Years',
          topicsCovered: ['Git Workflows', 'Architecture', 'Deployment'],
          availabilityNote: 'Weekends',
          verificationLabel: 'Self-Reported',
        },
      ],
      skillsToLearn: [
        {
          id: 'l_kabir_1',
          skillName: 'Video Editing',
          categoryId: 'creative',
          preferredLevel: 'Beginner',
          learningGoal: 'Edit crisp project demo reels and product walkthroughs.',
        },
      ],
      portfolio: [],
      projects: [
        {
          id: 'pr_kabir_1',
          title: 'Open-Source Course Scheduler',
          summary: 'Conflict-free semester timetable generator for students.',
        },
      ],
      achievements: ['Smart India Hackathon Finalist'],
      learningPreferences: {
        format: 'Online',
        groupMode: 'Individual (1-on-1)',
        sessionDurationMinutes: 60,
      },
      availability: {
        days: ['Tue', 'Thu', 'Sun'],
        preferredTime: '8:00 PM - 10:00 PM',
        weeklyHours: 4,
      },
      privacySettings: {
        showCollegeDetails: true,
        allowDirectRequests: true,
        allowMessagesFromPeers: true,
      },
      updatedAt: isoAgo(5),
    },
    {
      userId: 'stu_tara_sengupta',
      name: 'Tara Sengupta',
      college: 'Indian Institute of Technology, Bombay',
      course: 'B.S. in Mathematics',
      semester: 'Semester 5',
      intro:
        'Helping peers build intuition in Linear Algebra, Probability, and Excel data modeling. Looking for a collaborative study partner for Artificial Intelligence.',
      languages: ['English', 'Bengali', 'Hindi'],
      learningInterests: ['Artificial Intelligence', 'Python', 'Research Skills'],
      skillsToTeach: [
        {
          id: 't_tara_1',
          skillName: 'Mathematics',
          categoryId: 'academic',
          proficiency: 'Mentor-Ready',
          experience: '2+ Years',
          topicsCovered: ['Linear Algebra', 'Probability Distributions', 'Optimization'],
          availabilityNote: 'Mon & Wed afternoons',
          verificationLabel: 'Self-Reported',
        },
        {
          id: 't_tara_2',
          skillName: 'Excel',
          categoryId: 'practical',
          proficiency: 'Advanced',
          experience: '1-2 Years',
          topicsCovered: ['Pivot Tables', 'XLOOKUP', 'Statistical Charts'],
          availabilityNote: 'Weekends',
          verificationLabel: 'Self-Reported',
        },
      ],
      skillsToLearn: [
        {
          id: 'l_tara_1',
          skillName: 'Artificial Intelligence',
          categoryId: 'technology',
          preferredLevel: 'Intermediate',
          learningGoal: 'Implement neural network fundamentals in Python.',
        },
      ],
      portfolio: [],
      projects: [],
      achievements: ['Undergraduate Research Fellow'],
      learningPreferences: {
        format: 'Hybrid',
        groupMode: 'Small Group',
        sessionDurationMinutes: 60,
      },
      availability: {
        days: ['Mon', 'Wed', 'Sat'],
        preferredTime: '4:00 PM - 6:00 PM',
        weeklyHours: 4,
      },
      privacySettings: {
        showCollegeDetails: true,
        allowDirectRequests: true,
        allowMessagesFromPeers: true,
      },
      updatedAt: isoAgo(24),
    },
  ];

  const listings: SkillListing[] = [
    {
      id: 'lst_uiux_ananya',
      ownerId: 'stu_ananya_desai',
      ownerName: 'Ananya Desai',
      ownerCollege: 'IDC School of Design, IIT Bombay',
      ownerCourse: 'B.Des in Visual Communication',
      intent: 'Teaching Offer',
      skillName: 'UI/UX Design',
      categoryId: 'technology',
      description:
        'Hands-on Figma and product layout sessions covering wireframes, spacing math, component libraries, and usability critique.',
      topics: ['Figma Auto-Layout', 'Design Systems', 'User Journey Mapping', 'Portfolio Case Studies'],
      proficiency: 'Advanced',
      experienceLevel: '1-2 Years',
      whatStudentsLearn:
        'Go from rough paper sketches to an interactive, clean multi-screen app prototype ready for hackathons or internships.',
      teachingApproach: 'Live Figma critique + mini weekly redesign challenges.',
      sessionDurationMinutes: 60,
      language: 'English & Hindi',
      groupMode: 'Individual (1-on-1)',
      deliveryMode: 'Hybrid',
      exchangePreference: 'Skill Exchange',
      desiredSkill: 'Python',
      desiredProficiency: 'Beginner',
      learningGoals: 'Automate SVG/data graphics and learn Python scripting fundamentals.',
      preferredPartner: 'Any CS/Engineering student comfortable explaining Python basics clearly.',
      availableDays: ['Tue', 'Thu', 'Sat'],
      preferredTime: '6:00 PM - 8:30 PM',
      weeklyHours: 4,
      status: 'active',
      verificationLabel: 'Self-Reported',
      createdAt: isoAgo(16),
      updatedAt: isoAgo(16),
    },
    {
      id: 'lst_python_rohan',
      ownerId: 'stu_rohan_nair',
      ownerName: 'Rohan Nair',
      ownerCollege: 'Indian Institute of Technology, Bombay',
      ownerCourse: 'B.Tech in Electrical Engineering',
      intent: 'Teaching Offer',
      skillName: 'Python',
      categoryId: 'technology',
      description:
        'Practical Python mentoring from variables, functions, and file handling up to Pandas data analysis and FastAPI endpoints.',
      topics: ['Core Syntax', 'Functions & Modules', 'Pandas DataFrames', 'API Requests'],
      proficiency: 'Mentor-Ready',
      experienceLevel: '2+ Years',
      whatStudentsLearn:
        'Write readable Python scripts, process CSV/JSON datasets, and debug confidently.',
      teachingApproach: 'Pair programming on real mini-scripts during every session.',
      sessionDurationMinutes: 45,
      language: 'English',
      groupMode: 'Individual (1-on-1)',
      deliveryMode: 'Online',
      exchangePreference: 'Skill Exchange',
      desiredSkill: 'Graphic Design',
      desiredProficiency: 'Beginner',
      learningGoals: 'Learn visual hierarchy, poster layout, and clean slide design.',
      preferredPartner: 'Design or creative arts student open to beginner-friendly Python trades.',
      availableDays: ['Mon', 'Wed', 'Sat'],
      preferredTime: '7:00 PM - 9:00 PM',
      weeklyHours: 3,
      status: 'active',
      verificationLabel: 'Self-Reported',
      createdAt: isoAgo(10),
      updatedAt: isoAgo(10),
    },
    {
      id: 'lst_speaking_meera',
      ownerId: 'stu_meera_kulkarni',
      ownerName: 'Meera Kulkarni',
      ownerCollege: 'IIT Bombay · SJMSOM',
      ownerCourse: 'Dual Degree Mechanical & Management',
      intent: 'Teaching Offer',
      skillName: 'Public Speaking',
      categoryId: 'communication',
      description:
        'Structured speaking drills for technical presentations, club pitches, and placement interviews without memorizing scripts.',
      topics: ['Opening Hooks', 'Pacing & Pauses', 'Slide Storytelling', 'Handling Tough Q&A'],
      proficiency: 'Mentor-Ready',
      experienceLevel: '2+ Years',
      whatStudentsLearn:
        'Deliver calm, persuasive 5-minute presentations and answer interview questions with clarity.',
      teachingApproach: '2-minute timed practice talks with actionable feedback.',
      sessionDurationMinutes: 45,
      language: 'English & Hindi',
      groupMode: 'Both',
      deliveryMode: 'Hybrid',
      exchangePreference: 'Teaching Only',
      desiredSkill: 'Web Development',
      desiredProficiency: 'Beginner',
      learningGoals: 'Open to pure mentorship or casual React tips.',
      preferredPartner: 'Students preparing for internships, paper presentations, or competitions.',
      availableDays: ['Fri', 'Sun'],
      preferredTime: '10:00 AM - 1:00 PM',
      weeklyHours: 3,
      status: 'active',
      verificationLabel: 'Self-Reported',
      createdAt: isoAgo(22),
      updatedAt: isoAgo(22),
    },
    {
      id: 'lst_web_kabir',
      ownerId: 'stu_kabir_mehta',
      ownerName: 'Kabir Mehta',
      ownerCollege: 'Indian Institute of Technology, Bombay',
      ownerCourse: 'B.Tech in Computer Science & Engineering',
      intent: 'Teaching Offer',
      skillName: 'Web Development',
      categoryId: 'technology',
      description:
        'Build modern React + TypeScript interfaces with clean component architecture, state management, and Express API integration.',
      topics: ['React Components', 'TypeScript Types', 'Tailwind Layouts', 'REST Integration'],
      proficiency: 'Advanced',
      experienceLevel: '2+ Years',
      whatStudentsLearn:
        'Ship a working full-stack project feature from component design to live API connection.',
      teachingApproach: 'Code walkthroughs + building one shared feature together.',
      sessionDurationMinutes: 60,
      language: 'English',
      groupMode: 'Individual (1-on-1)',
      deliveryMode: 'Online',
      exchangePreference: 'Skill Exchange',
      desiredSkill: 'Video Editing',
      desiredProficiency: 'Beginner',
      learningGoals: 'Learn pacing, cuts, captions, and clean transitions for project demos.',
      preferredPartner: 'Anyone experienced with Premiere Pro, DaVinci Resolve, or CapCut.',
      availableDays: ['Tue', 'Thu', 'Sun'],
      preferredTime: '8:00 PM - 10:00 PM',
      weeklyHours: 4,
      status: 'active',
      verificationLabel: 'Self-Reported',
      createdAt: isoAgo(4),
      updatedAt: isoAgo(4),
    },
    {
      id: 'lst_math_tara',
      ownerId: 'stu_tara_sengupta',
      ownerName: 'Tara Sengupta',
      ownerCollege: 'Indian Institute of Technology, Bombay',
      ownerCourse: 'B.S. in Mathematics',
      intent: 'Teaching Offer',
      skillName: 'Mathematics',
      categoryId: 'academic',
      description:
        'Intuitive walkthroughs of Linear Algebra (eigenvalues, SVD, projections) and Probability for ML and data science courses.',
      topics: ['Vector Spaces', 'Matrix Decomposition', 'Bayes Theorem', 'Expectation & Variance'],
      proficiency: 'Mentor-Ready',
      experienceLevel: '2+ Years',
      whatStudentsLearn:
        'Connect matrix and probability equations directly to machine learning algorithms.',
      teachingApproach: 'Visual geometric intuition followed by worked problem sets.',
      sessionDurationMinutes: 60,
      language: 'English',
      groupMode: 'Small Group',
      deliveryMode: 'Hybrid',
      exchangePreference: 'Learning Collaboration',
      desiredSkill: 'Artificial Intelligence',
      desiredProficiency: 'Intermediate',
      learningGoals: 'Co-study neural networks and implement classic architectures in PyTorch.',
      preferredPartner: 'CS/AI students interested in math-grounded deep learning study sprints.',
      availableDays: ['Mon', 'Wed', 'Sat'],
      preferredTime: '4:00 PM - 6:00 PM',
      weeklyHours: 4,
      status: 'active',
      verificationLabel: 'Self-Reported',
      createdAt: isoAgo(28),
      updatedAt: isoAgo(28),
    },
    {
      id: 'lst_req_ananya_py',
      ownerId: 'stu_ananya_desai',
      ownerName: 'Ananya Desai',
      ownerCollege: 'IDC School of Design, IIT Bombay',
      ownerCourse: 'B.Des in Visual Communication',
      intent: 'Learning Request',
      skillName: 'Python',
      categoryId: 'technology',
      description:
        'Looking for a patient peer to help me get comfortable with Python loops, dictionaries, and simple scripting in 4 weekly sessions.',
      topics: ['Variables & Loops', 'Lists & Dictionaries', 'Reading JSON/CSV'],
      proficiency: 'Beginner',
      experienceLevel: '< 6 Months',
      whatStudentsLearn: 'I can teach Graphic Design or Figma UI/UX prototyping in return!',
      teachingApproach: 'Hands-on beginner exercises with practical visual examples.',
      sessionDurationMinutes: 45,
      language: 'English & Hindi',
      groupMode: 'Individual (1-on-1)',
      deliveryMode: 'Hybrid',
      exchangePreference: 'Skill Exchange',
      desiredSkill: 'Python',
      desiredProficiency: 'Beginner',
      learningGoals: 'Build confidence writing small scripts independently.',
      preferredPartner: 'Students who enjoy teaching fundamentals step by step.',
      availableDays: ['Tue', 'Thu', 'Sat'],
      preferredTime: '6:00 PM - 8:30 PM',
      weeklyHours: 3,
      status: 'active',
      verificationLabel: 'Self-Reported',
      createdAt: isoAgo(6),
      updatedAt: isoAgo(6),
    },
  ];

  return {
    categories: SEEDED_CATEGORIES,
    profiles,
    listings,
    requests: [],
    exchanges: [],
    reviews: [],
    savedByUser: {},
    blockedByUser: {},
    reports: [],
    files: {},
  };
}

function loadDb(): SkillSwapDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (parsed && Array.isArray(parsed.profiles) && Array.isArray(parsed.listings)) {
        return {
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
            ? parsed.categories
            : SEEDED_CATEGORIES,
          profiles: parsed.profiles,
          listings: parsed.listings,
          requests: parsed.requests || [],
          exchanges: parsed.exchanges || [],
          reviews: parsed.reviews || [],
          savedByUser: parsed.savedByUser || {},
          blockedByUser: parsed.blockedByUser || {},
          reports: parsed.reports || [],
          files: parsed.files || {},
        };
      }
    }
  } catch {
    // recreate cleanly
  }
  const seeded = createSeedDatabase();
  saveDb(seeded);
  return seeded;
}

function saveDb(db: SkillSwapDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist SkillSwap DB:', err);
  }
}

function ensureUserProfile(
  db: SkillSwapDatabase,
  params: {
    userId: string;
    userName?: string;
    college?: string;
    course?: string;
    semester?: string;
    intro?: string;
    interests?: string[];
  }
): StudentSkillProfile {
  const existing = db.profiles.find((p) => p.userId === params.userId);
  if (existing) {
    let changed = false;
    if (params.userName && existing.name !== params.userName) {
      existing.name = params.userName;
      changed = true;
    }
    if (params.college && existing.college !== params.college) {
      existing.college = params.college;
      changed = true;
    }
    if (params.course && existing.course !== params.course) {
      existing.course = params.course;
      changed = true;
    }
    if (params.semester && existing.semester !== params.semester) {
      existing.semester = params.semester;
      changed = true;
    }
    if (changed) saveDb(db);
    return existing;
  }

  const created: StudentSkillProfile = {
    userId: params.userId,
    name: params.userName || 'KAMPUS Student',
    college: params.college || 'Indian Institute of Technology, Bombay',
    course: params.course || 'B.Tech in Computer Science & AI',
    semester: params.semester || 'Semester 6',
    intro:
      params.intro ||
      'Student eager to share practical skills and collaborate on peer learning sprints.',
    languages: ['English', 'Hindi'],
    learningInterests:
      params.interests && params.interests.length > 0
        ? params.interests
        : ['Artificial Intelligence', 'UI/UX Design'],
    skillsToTeach: [
      {
        id: `t_${params.userId}_1`,
        skillName: 'Python',
        categoryId: 'technology',
        proficiency: 'Intermediate',
        experience: '1-2 Years',
        topicsCovered: ['Data Structures', 'Scripting', 'Problem Solving'],
        availabilityNote: 'Weekday evenings & weekends',
        verificationLabel: 'Self-Reported',
      },
    ],
    skillsToLearn: [
      {
        id: `l_${params.userId}_1`,
        skillName: 'UI/UX Design',
        categoryId: 'technology',
        preferredLevel: 'Beginner',
        learningGoal: 'Design clean product wireframes and responsive layouts.',
      },
      {
        id: `l_${params.userId}_2`,
        skillName: 'Graphic Design',
        categoryId: 'creative',
        preferredLevel: 'Beginner',
        learningGoal: 'Improve visual hierarchy and typography for presentations.',
      },
    ],
    portfolio: [],
    projects: [],
    achievements: [],
    learningPreferences: {
      format: 'Hybrid',
      groupMode: 'Individual (1-on-1)',
      sessionDurationMinutes: 60,
    },
    availability: {
      days: ['Tue', 'Thu', 'Sat'],
      preferredTime: '6:00 PM - 8:00 PM',
      weeklyHours: 4,
    },
    privacySettings: {
      showCollegeDetails: true,
      allowDirectRequests: true,
      allowMessagesFromPeers: true,
    },
    updatedAt: new Date().toISOString(),
  };

  db.profiles.unshift(created);
  saveDb(db);
  return created;
}

export function registerSkillSwapBackend(app: Express) {
  const db = loadDb();

  // 1. Bootstrap full SkillSwap workspace
  app.get('/api/skillswap/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    ensureUserProfile(db, {
      userId,
      userName: req.query.userName ? String(req.query.userName) : undefined,
      college: req.query.college ? String(req.query.college) : undefined,
      course: req.query.course ? String(req.query.course) : undefined,
      semester: req.query.semester ? String(req.query.semester) : undefined,
    });

    const blockedIds = db.blockedByUser[userId] || [];

    return res.json({
      categories: db.categories,
      profiles: db.profiles.filter((p) => !blockedIds.includes(p.userId)),
      listings: db.listings.filter((l) => !blockedIds.includes(l.ownerId)),
      requests: db.requests.filter(
        (r) => r.senderId === userId || r.recipientId === userId
      ),
      exchanges: db.exchanges.filter(
        (ex) => ex.studentAId === userId || ex.studentBId === userId
      ),
      reviews: db.reviews,
      savedStudentIds: db.savedByUser[userId] || [],
      blockedUserIds: blockedIds,
      reports: db.reports.filter((rp) => rp.reporterId === userId),
    });
  });

  // 2. Update Student Skill Profile
  app.put('/api/skillswap/profile', (req: Request, res: Response) => {
    const { userId, updates } = req.body || {};
    if (!userId || !updates) {
      return res.status(400).json({ message: 'userId and updates are required.' });
    }
    const profile = ensureUserProfile(db, { userId });
    Object.assign(profile, {
      intro: typeof updates.intro === 'string' ? updates.intro : profile.intro,
      languages: Array.isArray(updates.languages) ? updates.languages : profile.languages,
      learningInterests: Array.isArray(updates.learningInterests)
        ? updates.learningInterests
        : profile.learningInterests,
      skillsToTeach: Array.isArray(updates.skillsToTeach)
        ? updates.skillsToTeach
        : profile.skillsToTeach,
      skillsToLearn: Array.isArray(updates.skillsToLearn)
        ? updates.skillsToLearn
        : profile.skillsToLearn,
      portfolio: Array.isArray(updates.portfolio) ? updates.portfolio : profile.portfolio,
      projects: Array.isArray(updates.projects) ? updates.projects : profile.projects,
      achievements: Array.isArray(updates.achievements)
        ? updates.achievements
        : profile.achievements,
      learningPreferences: updates.learningPreferences || profile.learningPreferences,
      availability: updates.availability || profile.availability,
      privacySettings: updates.privacySettings || profile.privacySettings,
      updatedAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.json({ profile });
  });

  // 3. Expand Taxonomy with Custom Skill
  app.post('/api/skillswap/categories/skill', (req: Request, res: Response) => {
    const { categoryId, skillName } = req.body || {};
    const clean = String(skillName || '').trim();
    if (!categoryId || !clean) {
      return res.status(400).json({ message: 'categoryId and skillName are required.' });
    }
    const cat = db.categories.find((c) => c.id === categoryId);
    if (!cat) return res.status(404).json({ message: 'Category not found.' });
    if (!cat.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      cat.skills.push(clean);
      saveDb(db);
    }
    return res.json({ categories: db.categories });
  });

  // 4. Create Skill Listing (Offer or Learning Request)
  app.post('/api/skillswap/listings', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !String(b.skillName || '').trim()) {
      return res.status(400).json({ message: 'userId and skillName are required.' });
    }
    const profile = ensureUserProfile(db, {
      userId,
      userName: b.userName,
      college: b.college,
      course: b.course,
    });

    const now = new Date().toISOString();
    const listing: SkillListing = {
      id: `lst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ownerId: userId,
      ownerName: profile.name,
      ownerCollege: profile.college,
      ownerCourse: profile.course,
      intent: b.intent === 'Learning Request' ? 'Learning Request' : 'Teaching Offer',
      skillName: String(b.skillName).trim(),
      categoryId: b.categoryId || 'technology',
      description: String(b.description || '').trim(),
      topics: Array.isArray(b.topics) ? b.topics.filter(Boolean) : [],
      proficiency: b.proficiency || 'Intermediate',
      experienceLevel: b.experienceLevel || '6-12 Months',
      whatStudentsLearn: String(b.whatStudentsLearn || '').trim(),
      teachingApproach: String(b.teachingApproach || '').trim(),
      sessionDurationMinutes: Number(b.sessionDurationMinutes) || 60,
      language: String(b.language || 'English').trim(),
      groupMode: b.groupMode || 'Individual (1-on-1)',
      deliveryMode: b.deliveryMode || 'Online',
      exchangePreference: b.exchangePreference || 'Skill Exchange',
      desiredSkill: String(b.desiredSkill || '').trim(),
      desiredProficiency: b.desiredProficiency || 'Beginner',
      learningGoals: String(b.learningGoals || '').trim(),
      preferredPartner: String(b.preferredPartner || '').trim(),
      availableDays: Array.isArray(b.availableDays) ? b.availableDays : ['Sat'],
      preferredTime: String(b.preferredTime || '6:00 PM - 8:00 PM').trim(),
      weeklyHours: Number(b.weeklyHours) || 2,
      status: 'active',
      verificationLabel: 'Self-Reported',
      portfolioPreviewUrl: b.portfolioPreviewUrl || undefined,
      createdAt: now,
      updatedAt: now,
    };

    db.listings.unshift(listing);
    saveDb(db);
    return res.status(201).json({ listing });
  });

  // 5. Update / Pause / Resume Skill Listing
  app.patch('/api/skillswap/listings/:id', (req: Request, res: Response) => {
    const listing = db.listings.find((l) => l.id === req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    const { userId, ...updates } = req.body || {};
    if (listing.ownerId !== userId) {
      return res.status(403).json({ message: 'Only the listing owner can edit it.' });
    }
    Object.assign(listing, updates, {
      id: listing.id,
      ownerId: listing.ownerId,
      updatedAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.json({ listing });
  });

  // 6. Delete Skill Listing
  app.delete('/api/skillswap/listings/:id', (req: Request, res: Response) => {
    const idx = db.listings.findIndex((l) => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Listing not found.' });
    const userId = String(req.query.userId || '');
    if (db.listings[idx].ownerId !== userId) {
      return res.status(403).json({ message: 'Only the listing owner can delete it.' });
    }
    db.listings.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  // 7. Send Skill Exchange / Learning / Collaboration Request
  app.post('/api/skillswap/requests', (req: Request, res: Response) => {
    const b = req.body || {};
    const senderId = String(b.senderId || '').trim();
    const recipientId = String(b.recipientId || '').trim();
    if (!senderId || !recipientId || senderId === recipientId) {
      return res.status(400).json({ message: 'Valid senderId and recipientId are required.' });
    }

    const recipientProfile = db.profiles.find((p) => p.userId === recipientId);
    if (!recipientProfile) {
      return res.status(404).json({ message: 'Recipient profile not found.' });
    }
    if (!recipientProfile.privacySettings.allowDirectRequests) {
      return res
        .status(403)
        .json({ message: 'This student has paused incoming skill requests in privacy settings.' });
    }
    const senderBlocked = (db.blockedByUser[recipientId] || []).includes(senderId);
    if (senderBlocked) {
      return res.status(403).json({ message: 'Unable to send request to this student.' });
    }

    const senderProfile = ensureUserProfile(db, {
      userId: senderId,
      userName: b.senderName,
    });

    const now = new Date().toISOString();
    const requestItem: SkillExchangeRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      requestType: b.requestType || 'exchange',
      senderId,
      senderName: senderProfile.name,
      recipientId,
      recipientName: recipientProfile.name,
      listingId: b.listingId || undefined,
      requestedSkill: String(b.requestedSkill || '').trim() || 'Skill Mentorship',
      offeredSkill: String(b.offeredSkill || '').trim() || 'Peer Collaboration',
      learningGoals: String(b.learningGoals || '').trim(),
      preferredAvailability: String(b.preferredAvailability || '').trim() || 'Flexible',
      message: String(b.message || '').trim(),
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    db.requests.unshift(requestItem);
    saveDb(db);
    return res.status(201).json({ request: requestItem });
  });

  // 8. Respond to / Withdraw Request (Accept -> Creates SkillExchange + Dual LearningTracks)
  app.patch('/api/skillswap/requests/:id', (req: Request, res: Response) => {
    const reqItem = db.requests.find((r) => r.id === req.params.id);
    if (!reqItem) return res.status(404).json({ message: 'Request not found.' });
    const { userId, decision } = req.body || {};

    const isRecipient = reqItem.recipientId === userId;
    const isSender = reqItem.senderId === userId;
    if (!isRecipient && !isSender) {
      return res.status(403).json({ message: 'Not authorized to modify this request.' });
    }

    if (decision === 'Cancelled') {
      if (!isSender) {
        return res.status(403).json({ message: 'Only the sender can withdraw a request.' });
      }
      reqItem.status = 'Cancelled';
      reqItem.updatedAt = new Date().toISOString();
      saveDb(db);
      return res.json({ request: reqItem });
    }

    if (decision === 'Declined') {
      if (!isRecipient) {
        return res.status(403).json({ message: 'Only the recipient can decline a request.' });
      }
      reqItem.status = 'Declined';
      reqItem.updatedAt = new Date().toISOString();
      saveDb(db);
      return res.json({ request: reqItem });
    }

    if (decision === 'Accepted') {
      if (!isRecipient) {
        return res.status(403).json({ message: 'Only the recipient can accept a request.' });
      }
      reqItem.status = 'Accepted';
      reqItem.updatedAt = new Date().toISOString();

      const exchangeId = `ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      reqItem.exchangeId = exchangeId;

      const exchangeType =
        reqItem.requestType === 'exchange'
          ? 'Skill Exchange'
          : reqItem.requestType === 'collaborate'
            ? 'Learning Collaboration'
            : 'Teaching Only';

      const exchange: SkillExchange = {
        id: exchangeId,
        requestId: reqItem.id,
        studentAId: reqItem.recipientId,
        studentAName: reqItem.recipientName,
        studentBId: reqItem.senderId,
        studentBName: reqItem.senderName,
        skillAForB: reqItem.requestedSkill,
        skillBForA: reqItem.offeredSkill,
        exchangeType,
        status: 'Active',
        objectives: [
          reqItem.learningGoals || `Build practical fluency in ${reqItem.requestedSkill}`,
          'Complete at least 2 structured peer sessions with practice tasks',
        ],
        tracks: [
          {
            id: `trk_${exchangeId}_a`,
            learnerId: reqItem.senderId,
            learnerName: reqItem.senderName,
            mentorId: reqItem.recipientId,
            mentorName: reqItem.recipientName,
            skillName: reqItem.requestedSkill,
            objectives: [
              reqItem.learningGoals || `Master foundational ${reqItem.requestedSkill} concepts`,
            ],
            topics: [
              { id: `top_${Date.now()}_1`, title: `Core principles & setup (${reqItem.requestedSkill})`, done: false },
              { id: `top_${Date.now()}_2`, title: `Guided hands-on exercise`, done: false },
            ],
            tasks: [
              { id: `tsk_${Date.now()}_1`, title: 'Complete starter practice exercise', done: false },
            ],
            milestones: [
              { id: `mil_${Date.now()}_1`, title: 'First hands-on mini project reviewed', done: false },
            ],
            resources: [],
          },
          ...(reqItem.requestType === 'exchange' || reqItem.requestType === 'collaborate'
            ? [
                {
                  id: `trk_${exchangeId}_b`,
                  learnerId: reqItem.recipientId,
                  learnerName: reqItem.recipientName,
                  mentorId: reqItem.senderId,
                  mentorName: reqItem.senderName,
                  skillName: reqItem.offeredSkill,
                  objectives: [`Learn practical workflows in ${reqItem.offeredSkill}`],
                  topics: [
                    { id: `top_${Date.now()}_3`, title: `Getting started with ${reqItem.offeredSkill}`, done: false },
                    { id: `top_${Date.now()}_4`, title: `Applied workflow walkthrough`, done: false },
                  ],
                  tasks: [
                    { id: `tsk_${Date.now()}_2`, title: 'Prepare first practice artifact', done: false },
                  ],
                  milestones: [
                    { id: `mil_${Date.now()}_2`, title: 'Complete peer skill demo', done: false },
                  ],
                  resources: [],
                },
              ]
            : []),
        ],
        sessions: [],
        createdAt: new Date().toISOString(),
      };

      db.exchanges.unshift(exchange);
      saveDb(db);
      return res.json({ request: reqItem, exchange });
    }

    return res.status(400).json({ message: 'Invalid decision.' });
  });

  // 9. Update Exchange Progress (Topics, Tasks, Milestones, Objectives, Status)
  app.post('/api/skillswap/exchanges/:id/progress', (req: Request, res: Response) => {
    const ex = db.exchanges.find((e) => e.id === req.params.id);
    if (!ex) return res.status(404).json({ message: 'Exchange not found.' });
    const { userId, action, trackId, itemId, title, status } = req.body || {};
    if (ex.studentAId !== userId && ex.studentBId !== userId) {
      return res.status(403).json({ message: 'Only exchange participants can update progress.' });
    }

    if (action === 'set-status' && (status === 'Completed' || status === 'Cancelled')) {
      ex.status = status;
      if (status === 'Completed') {
        ex.completedAt = new Date().toISOString();
        const linkedReq = db.requests.find((r) => r.id === ex.requestId);
        if (linkedReq) linkedReq.status = 'Completed';
      }
      saveDb(db);
      return res.json({ exchange: ex });
    }

    if (action === 'add-objective' && String(title || '').trim()) {
      ex.objectives.push(String(title).trim());
      saveDb(db);
      return res.json({ exchange: ex });
    }

    const track = ex.tracks.find((t) => t.id === trackId);
    if (!track) return res.status(404).json({ message: 'Learning track not found.' });

    const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    if (action === 'add-topic' && String(title || '').trim()) {
      track.topics.push({ id: `top_${uid}`, title: String(title).trim(), done: false });
    } else if (action === 'toggle-topic') {
      const item = track.topics.find((i) => i.id === itemId);
      if (item) item.done = !item.done;
    } else if (action === 'add-task' && String(title || '').trim()) {
      track.tasks.push({ id: `tsk_${uid}`, title: String(title).trim(), done: false });
    } else if (action === 'toggle-task') {
      const item = track.tasks.find((i) => i.id === itemId);
      if (item) item.done = !item.done;
    } else if (action === 'add-milestone' && String(title || '').trim()) {
      track.milestones.push({ id: `mil_${uid}`, title: String(title).trim(), done: false });
    } else if (action === 'toggle-milestone') {
      const item = track.milestones.find((i) => i.id === itemId);
      if (item) item.done = !item.done;
    }

    saveDb(db);
    return res.json({ exchange: ex });
  });

  // 10. Upload File (<= 5 MB) & Serve Stored File
  app.post('/api/skillswap/upload', (req: Request, res: Response) => {
    const { userId, fileName, mimeType, base64Data } = req.body || {};
    if (!userId || !fileName || !base64Data) {
      return res.status(400).json({ message: 'Missing file upload payload.' });
    }
    const cleanBase64 = String(base64Data).includes(',')
      ? String(base64Data).split(',')[1]
      : String(base64Data);
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ message: 'File exceeds the 5 MB limit.' });
    }

    const fileId = `ssfile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.files[fileId] = {
      id: fileId,
      fileName: String(fileName),
      mimeType: String(mimeType || 'application/octet-stream'),
      sizeBytes: buffer.length,
      base64Data: cleanBase64,
      uploadedBy: String(userId),
      createdAt: new Date().toISOString(),
    };
    saveDb(db);

    return res.status(201).json({
      file: {
        fileId,
        fileName: db.files[fileId].fileName,
        mimeType: db.files[fileId].mimeType,
        sizeBytes: buffer.length,
        url: `/api/skillswap/files/${fileId}`,
      },
    });
  });

  app.get('/api/skillswap/files/:fileId', (req: Request, res: Response) => {
    const file = db.files[req.params.fileId];
    if (!file) return res.status(404).send('File not found');
    const buf = Buffer.from(file.base64Data, 'base64');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName.replace(/"/g, '')}"`);
    return res.send(buf);
  });

  // 11. Learning Resources inside Exchange Track
  app.post('/api/skillswap/exchanges/:id/resources', (req: Request, res: Response) => {
    const ex = db.exchanges.find((e) => e.id === req.params.id);
    if (!ex) return res.status(404).json({ message: 'Exchange not found.' });
    const { userId, userName, action, trackId, resourceId, kind, title, url, fileName, sizeBytes } =
      req.body || {};
    if (ex.studentAId !== userId && ex.studentBId !== userId) {
      return res.status(403).json({ message: 'Only exchange participants can share resources.' });
    }
    const track = ex.tracks.find((t) => t.id === trackId);
    if (!track) return res.status(404).json({ message: 'Learning track not found.' });

    if (action === 'delete') {
      track.resources = track.resources.filter((r) => r.id !== resourceId);
      saveDb(db);
      return res.json({ exchange: ex });
    }

    if (!String(title || '').trim() || !String(url || '').trim()) {
      return res.status(400).json({ message: 'Resource title and URL are required.' });
    }

    track.resources.unshift({
      id: `sres_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      trackId: track.id,
      kind: kind || 'Study Notes',
      title: String(title).trim(),
      url: String(url).trim(),
      fileName: fileName || undefined,
      sizeBytes: sizeBytes || undefined,
      sharedById: userId,
      sharedByName: userName || 'Participant',
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.json({ exchange: ex });
  });

  // 12. Learning Session Scheduling, Rescheduling & Status
  app.post('/api/skillswap/exchanges/:id/sessions', (req: Request, res: Response) => {
    const ex = db.exchanges.find((e) => e.id === req.params.id);
    if (!ex) return res.status(404).json({ message: 'Exchange not found.' });
    const { userId, action, sessionId, topic, dateISO, timeSlot, durationMinutes, objectives, prepNotes, status } =
      req.body || {};
    if (ex.studentAId !== userId && ex.studentBId !== userId) {
      return res.status(403).json({ message: 'Only exchange participants can manage sessions.' });
    }

    if (action === 'create') {
      if (!String(topic || '').trim() || !dateISO || !timeSlot) {
        return res.status(400).json({ message: 'Topic, date, and time are required.' });
      }
      const session: SkillSession = {
        id: `ses_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        exchangeId: ex.id,
        topic: String(topic).trim(),
        dateISO: String(dateISO),
        timeSlot: String(timeSlot),
        durationMinutes: Number(durationMinutes) || 60,
        objectives: String(objectives || '').trim(),
        prepNotes: String(prepNotes || '').trim(),
        status: 'Upcoming',
        createdById: userId,
        updatedAt: new Date().toISOString(),
      };
      ex.sessions.unshift(session);
      saveDb(db);
      return res.status(201).json({ exchange: ex, session });
    }

    const ses = ex.sessions.find((s) => s.id === sessionId);
    if (!ses) return res.status(404).json({ message: 'Session not found.' });

    if (action === 'reschedule') {
      if (dateISO) ses.dateISO = String(dateISO);
      if (timeSlot) ses.timeSlot = String(timeSlot);
      if (durationMinutes) ses.durationMinutes = Number(durationMinutes);
      if (typeof objectives === 'string') ses.objectives = objectives;
      if (typeof prepNotes === 'string') ses.prepNotes = prepNotes;
      ses.status = 'Scheduled';
      ses.updatedAt = new Date().toISOString();
    } else if (action === 'set-status' && status) {
      ses.status = status;
      ses.updatedAt = new Date().toISOString();
    }

    saveDb(db);
    return res.json({ exchange: ex, session: ses });
  });

  // 13. Exchange Feedback & Reviews (Strictly post-completion, duplicate prevented)
  app.post('/api/skillswap/exchanges/:id/reviews', (req: Request, res: Response) => {
    const ex = db.exchanges.find((e) => e.id === req.params.id);
    if (!ex) return res.status(404).json({ message: 'Exchange not found.' });
    if (ex.status !== 'Completed') {
      return res
        .status(400)
        .json({ message: 'Feedback can only be submitted after the exchange is marked completed.' });
    }
    const {
      reviewerId,
      reviewerName,
      learningExperience,
      communication,
      reliability,
      teachingClarity,
      writtenReview,
    } = req.body || {};

    if (ex.studentAId !== reviewerId && ex.studentBId !== reviewerId) {
      return res.status(403).json({ message: 'Only exchange participants can submit reviews.' });
    }
    const duplicate = db.reviews.some(
      (rv) => rv.exchangeId === ex.id && rv.reviewerId === reviewerId
    );
    if (duplicate) {
      return res.status(400).json({ message: 'You have already submitted feedback for this exchange.' });
    }
    const text = String(writtenReview || '').trim();
    if (text.length < 10) {
      return res
        .status(400)
        .json({ message: 'Please write at least 10 characters of constructive feedback.' });
    }

    const clamp = (n: unknown) => Math.max(1, Math.min(5, Number(n) || 5));
    const revieweeId = ex.studentAId === reviewerId ? ex.studentBId : ex.studentAId;

    const review: SkillReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      exchangeId: ex.id,
      reviewerId,
      reviewerName: reviewerName || 'Student',
      revieweeId,
      learningExperience: clamp(learningExperience),
      communication: clamp(communication),
      reliability: clamp(reliability),
      teachingClarity: clamp(teachingClarity),
      writtenReview: text,
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(review);
    saveDb(db);
    return res.status(201).json({ review });
  });

  // 14. Save / Bookmark Student Profile
  app.post('/api/skillswap/saved', (req: Request, res: Response) => {
    const { userId, targetUserId } = req.body || {};
    if (!userId || !targetUserId) {
      return res.status(400).json({ message: 'userId and targetUserId are required.' });
    }
    const list = db.savedByUser[userId] || [];
    const exists = list.includes(targetUserId);
    db.savedByUser[userId] = exists
      ? list.filter((id) => id !== targetUserId)
      : [...list, targetUserId];
    saveDb(db);
    return res.json({ savedStudentIds: db.savedByUser[userId] });
  });

  // 15. Block User & Safety Reports
  app.post('/api/skillswap/safety/block', (req: Request, res: Response) => {
    const { userId, targetUserId } = req.body || {};
    if (!userId || !targetUserId) {
      return res.status(400).json({ message: 'userId and targetUserId are required.' });
    }
    const list = db.blockedByUser[userId] || [];
    const exists = list.includes(targetUserId);
    db.blockedByUser[userId] = exists
      ? list.filter((id) => id !== targetUserId)
      : [...list, targetUserId];
    saveDb(db);
    return res.json({ blockedUserIds: db.blockedByUser[userId] });
  });

  app.post('/api/skillswap/safety/report', (req: Request, res: Response) => {
    const { reporterId, targetType, targetId, targetSummary, reason, details } = req.body || {};
    if (!reporterId || !targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Incomplete report payload.' });
    }
    const report: SkillSwapReport = {
      id: `ssrep_${Date.now()}`,
      reporterId,
      targetType,
      targetId,
      targetSummary: String(targetSummary || ''),
      reason: String(reason),
      details: String(details || ''),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    saveDb(db);
    return res.status(201).json({ report });
  });
}
