import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ModuleStorage } from '../database/moduleStorage.ts';
import type {
  AssessmentAttempt,
  CareerOpportunity,
  CareerPreferences,
  CareerReport,
  CareerRoadmap,
  CareerRole,
  InterviewPracticeEntry,
  JobApplication,
  OrganizationProfile,
  PortfolioDocument,
  ResumeDocument,
  ScholarshipProgram,
} from '../src/types/career.ts';

interface StoredResumeFile {
  id: string;
  fileName: string;
  sizeBytes: number;
  base64Data: string;
  uploadedBy: string;
  createdAt: string;
}

interface CareerDatabase {
  organizations: OrganizationProfile[];
  opportunities: CareerOpportunity[];
  scholarships: ScholarshipProgram[];
  applications: JobApplication[];
  resumes: ResumeDocument[];
  portfoliosByUser: Record<string, PortfolioDocument>;
  roadmapsByUser: Record<string, CareerRoadmap>;
  preferencesByUser: Record<string, CareerPreferences>;
  savedOppIdsByUser: Record<string, string[]>;
  viewedOppIdsByUser: Record<string, string[]>;
  notInterestedByUser: Record<string, string[]>;
  interviewHistory: InterviewPracticeEntry[];
  assessmentAttempts: AssessmentAttempt[];
  learningProgressByUser: Record<string, { bookmarkedIds: string[]; completedIds: string[] }>;
  reports: CareerReport[];
  roleOverrides: Record<string, { role: CareerRole; label: string }>;
  resumeFiles: Record<string, StoredResumeFile>;
}

const DB_FILE = path.join(process.cwd(), '.kampus_career_db.json');
const EVENTS_DB_FILE = path.join(process.cwd(), '.kampus_events_clubs_db.json');
const KAMPUS_ID_DB_FILE = path.join(process.cwd(), '.kampus_kampus_id_db.json');
const MAX_PDF_BYTES = 5 * 1024 * 1024;

const CAREER_PASSKEYS: Record<string, { role: CareerRole; label: string }> = {
  'KMP-CAREER-ADMIN-2026': {
    role: 'Platform Admin',
    label: 'KAMPUS Career Platform Administrator',
  },
  'KMP-CAREER-TEAM-2026': {
    role: 'Career Team',
    label: 'Campus Placement & Career Guidance Cell',
  },
  'KMP-RECRUITER-2026': {
    role: 'Authorized Recruiter',
    label: 'Verified Campus Recruiting Partner',
  },
};

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function createSeedDatabase(): CareerDatabase {
  const organizations: OrganizationProfile[] = [
    {
      id: 'org_kampus_cell',
      name: 'Campus Placement & Career Cell (Sample)',
      industry: 'Education & Campus Recruiting',
      location: 'Campus Placement Office / Hybrid',
      website: 'https://kampus.edu.in',
      description:
        'Coordinates campus placement drives, alumni mentorship cohorts, and KAMPUS-hosted student internship applications.',
      verificationStatus: 'Verified Organization',
    },
    {
      id: 'org_opensource_gsoc',
      name: 'Open-Source Fellowship & Summer Coding Programs',
      industry: 'Software Engineering & Research',
      location: 'Remote (Global)',
      website: 'https://summerofcode.withgoogle.com',
      description:
        'Publicly documented global open-source mentoring program for university students.',
      verificationStatus: 'Unverified Listing Source',
    },
    {
      id: 'org_nptel_research',
      name: 'National Academic Research & Lab Fellowship Directory',
      industry: 'Science, AI & Academic Research',
      location: 'Multiple University Labs (India)',
      website: 'https://nptel.ac.in',
      description:
        'External academic summer fellowship and faculty-mentored research tracks.',
      verificationStatus: 'Unverified Listing Source',
    },
    {
      id: 'org_civic_design',
      name: 'CivicTech & Public Systems Studio (Sample)',
      industry: 'Design, Data & Digital Public Infrastructure',
      location: 'Bengaluru / Remote',
      website: 'https://example.org',
      description:
        'Sample development organization showcasing KAMPUS-hosted internship & trainee application flows.',
      verificationStatus: 'Verified Organization',
    },
  ];

  const opportunities: CareerOpportunity[] = [
    {
      id: 'opp_swe_intern_sample',
      title: 'Software Engineering Student Intern (Sample Hosted Listing)',
      organizationId: 'org_civic_design',
      organizationName: 'CivicTech & Public Systems Studio (Sample)',
      organizationVerified: true,
      location: 'Bengaluru / Hybrid',
      workFormat: 'Hybrid',
      opportunityType: 'Internship',
      category: 'Software Development',
      experienceLevel: 'Fresher / Student',
      educationRequirement: 'Enrolled B.Tech / B.E. / MCA / B.Sc CS student',
      requiredSkills: ['TypeScript', 'React', 'SQL', 'Git'],
      preferredSkills: ['Node.js', 'Automated Testing', 'Accessibility'],
      isPaid: true,
      compensationLabel: 'Sample Listing · Stipend details shared in offer terms',
      deadlineISO: addDaysISO(18),
      publishedAtISO: addDaysISO(-2),
      listingSource: 'Sample Development Listing',
      applicationMode: 'KAMPUS-Hosted',
      aboutOrganization:
        'Sample development partner demonstrating verified KAMPUS-hosted student internship workflow.',
      roleDescription:
        'Collaborate with engineers to build accessible student-facing APIs, clean UI screens, and automated tests.',
      responsibilities: [
        'Implement modular React + TypeScript components and Express endpoints.',
        'Write unit/integration checks and participate in peer code reviews.',
      ],
      qualifications: [
        'Currently enrolled undergraduate or postgraduate student.',
        'At least 1 reproducible web or API project on GitHub.',
      ],
      benefits: ['Mentorship code reviews', 'Verified completion certificate'],
      applicationProcess: [
        'Review role requirements and attach your KAMPUS Resume version.',
        'Submit explicitly inside KAMPUS (consent required before sharing).',
      ],
      importantDates: [`Application Deadline: ${addDaysISO(18)}`],
      status: 'Open',
      createdById: 'system_sample',
    },
    {
      id: 'opp_gsoc_external',
      title: 'Open-Source Summer Coding Contributor Track',
      organizationId: 'org_opensource_gsoc',
      organizationName: 'Open-Source Fellowship & Summer Coding Programs',
      organizationVerified: false,
      location: 'Remote',
      workFormat: 'Remote',
      opportunityType: 'Remote Opportunity',
      category: 'Artificial Intelligence',
      experienceLevel: 'Fresher / Student',
      educationRequirement: 'University student or eligible open-source beginner',
      requiredSkills: ['Git', 'Python or TypeScript', 'Documentation'],
      preferredSkills: ['Open-source pull requests', 'Testing'],
      isPaid: true,
      compensationLabel: 'Official stipend set by host program rules',
      deadlineISO: addDaysISO(25),
      publishedAtISO: addDaysISO(-3),
      listingSource: 'Official External Portal',
      applicationMode: 'External Link',
      externalApplyUrl: 'https://summerofcode.withgoogle.com',
      aboutOrganization:
        'Global open-source mentoring program connecting students with established open-source organizations.',
      roleDescription:
        'Propose a 12-week software or applied ML engineering project under open-source maintainer mentorship.',
      responsibilities: [
        'Contribute starter bug-fix PRs to target repositories.',
        'Author a scoped technical project proposal.',
      ],
      qualifications: ['Review official eligibility guidelines on external portal.'],
      benefits: ['Mentorship from open-source maintainers', 'Public commit portfolio'],
      applicationProcess: [
        'Opens external portal — submit proposal directly on official website.',
        'Track your status manually inside KAMPUS Application Tracker.',
      ],
      importantDates: [`Check official portal for cohort schedule (${addDaysISO(25)})`],
      status: 'Open',
      createdById: 'system_sample',
    },
    {
      id: 'opp_research_fellow',
      title: 'Undergraduate Summer Research Assistantship (Sample)',
      organizationId: 'org_nptel_research',
      organizationName: 'National Academic Research & Lab Fellowship Directory',
      organizationVerified: false,
      location: 'IIT / IISc / University Labs',
      workFormat: 'Onsite',
      opportunityType: 'Research Opportunity',
      category: 'Research',
      experienceLevel: 'Research Track',
      educationRequirement: '2nd / 3rd year B.Tech / B.Sc / M.Sc scholars',
      requiredSkills: ['Python', 'Academic Writing', 'Literature Review'],
      preferredSkills: ['Data Analysis', 'LaTeX'],
      isPaid: false,
      compensationLabel: 'Fellowship terms verified on official university portal',
      deadlineISO: addDaysISO(21),
      publishedAtISO: addDaysISO(-4),
      listingSource: 'Official External Portal',
      applicationMode: 'External Link',
      externalApplyUrl: 'https://nptel.ac.in',
      aboutOrganization: 'Faculty-mentored university research initiatives across STEM and Science.',
      roleDescription:
        'Work with faculty labs on experimental replication, dataset curation, and scholarly writing.',
      responsibilities: ['Run reproducible experiments and maintain lab logs.', 'Draft literature synthesis.'],
      qualifications: ['Strong academic foundation in core department subjects.'],
      benefits: ['Research mentorship', 'Conference or journal co-authorship opportunity'],
      applicationProcess: ['Apply on official external university research portal.'],
      importantDates: [`Target window closes: ${addDaysISO(21)}`],
      status: 'Open',
      createdById: 'system_sample',
    },
    {
      id: 'opp_campus_analyst',
      title: 'Associate Data & Product Analyst — Campus Drive (Sample)',
      organizationId: 'org_kampus_cell',
      organizationName: 'Campus Placement & Career Cell (Sample)',
      organizationVerified: true,
      location: 'Mumbai / Hybrid',
      workFormat: 'Hybrid',
      opportunityType: 'Campus Placement',
      category: 'Data Science',
      experienceLevel: '0-1 Years',
      educationRequirement: 'Final-year undergraduate / postgraduate candidates',
      requiredSkills: ['SQL', 'Python', 'Statistics', 'Excel'],
      preferredSkills: ['Product Metrics', 'Visualization'],
      isPaid: true,
      compensationLabel: 'Campus Drive · Compensation shared by Placement Cell',
      deadlineISO: addDaysISO(12),
      publishedAtISO: addDaysISO(-1),
      listingSource: 'Sample Development Listing',
      applicationMode: 'KAMPUS-Hosted',
      aboutOrganization: 'Campus placement coordination listing for graduating scholars.',
      roleDescription:
        'Analyze funnel retention, cohort metrics, and product experiments alongside engineering and design peers.',
      responsibilities: [
        'Write clean SQL queries and build weekly metric reviews.',
        'Partner with product teams to design controlled experiments.',
      ],
      qualifications: ['Graduating cohort eligible per Placement Cell guidelines.'],
      benefits: ['Structured onboarding', 'Cross-functional product exposure'],
      applicationProcess: ['Submit KAMPUS Resume version + explicit consent.'],
      importantDates: [`Pre-placement screening deadline: ${addDaysISO(12)}`],
      status: 'Open',
      createdById: 'system_sample',
    },
    {
      id: 'opp_uiux_freelance',
      title: 'Campus Accessibility & UI Design Apprentice (Sample)',
      organizationId: 'org_civic_design',
      organizationName: 'CivicTech & Public Systems Studio (Sample)',
      organizationVerified: true,
      location: 'Remote',
      workFormat: 'Remote',
      opportunityType: 'Apprenticeship',
      category: 'Design',
      experienceLevel: 'Fresher / Student',
      educationRequirement: 'Design, Engineering, or Humanities students with UI case study',
      requiredSkills: ['Figma', 'Wireframing', 'WCAG Accessibility'],
      preferredSkills: ['Design Systems', 'HTML/CSS'],
      isPaid: true,
      compensationLabel: 'Sample Development Listing · Paid apprenticeship track',
      deadlineISO: addDaysISO(30),
      publishedAtISO: addDaysISO(-5),
      listingSource: 'Sample Development Listing',
      applicationMode: 'KAMPUS-Hosted',
      aboutOrganization: 'Digital public services design studio mentoring student designers.',
      roleDescription:
        'Audit student workflows for mobile readability, design accessible components, and run usability sessions.',
      responsibilities: ['Create wireframes & accessible Figma specs.', 'Test prototypes with 5+ students.'],
      qualifications: ['1 documented UI/UX case study in your portfolio.'],
      benefits: ['Portfolio case study review', 'Design mentor feedback'],
      applicationProcess: ['Apply directly via KAMPUS with resume & portfolio link.'],
      importantDates: [`Deadline: ${addDaysISO(30)}`],
      status: 'Open',
      createdById: 'system_sample',
    },
  ];

  const scholarships: ScholarshipProgram[] = [
    {
      id: 'sch_nsp_portal',
      title: 'National Scholarship Portal (NSP) — Central & State Student Schemes',
      programType: 'Scholarship',
      organization: 'Ministry of Education / Government of India (Official Directory)',
      eligibility:
        'Verified income, merit, and institution criteria vary by scheme — check exact scheme rules on official NSP portal.',
      requirements: [
        'Institutional bonafide verification',
        'Academic marksheets & income/category certificates where applicable',
      ],
      deadlineISO: addDaysISO(45),
      benefits: 'Tuition & maintenance support strictly per official scheme guidelines.',
      officialSourceName: 'scholarships.gov.in',
      officialSourceUrl: 'https://scholarships.gov.in',
      lastUpdatedISO: addDaysISO(0),
      isSampleListing: false,
    },
    {
      id: 'sch_ias_srpf',
      title: 'Science Academies Summer Research Fellowship Program (Directory Reference)',
      programType: 'Fellowship',
      organization: 'IASc · INSA · NASI',
      eligibility:
        'Undergraduate and postgraduate science/engineering students meeting official academic cutoff criteria.',
      requirements: ['Academic transcripts', 'Statement of purpose', 'Faculty recommendation'],
      deadlineISO: addDaysISO(35),
      benefits: '8-week mentored research placement in university/national labs.',
      officialSourceName: 'webjapps.ias.ac.in',
      officialSourceUrl: 'https://webjapps.ias.ac.in',
      lastUpdatedISO: addDaysISO(0),
      isSampleListing: false,
    },
    {
      id: 'sch_campus_prep_workshop',
      title: 'Campus Placement Readiness & Mock Technical Clinic (Sample Program)',
      programType: 'Career Workshop',
      organization: 'Campus Placement & Career Cell',
      eligibility: 'Open to all enrolled pre-final and final year students.',
      requirements: ['Completed KAMPUS Resume Draft'],
      deadlineISO: addDaysISO(10),
      benefits: 'Structured peer & alumni mock review sessions.',
      officialSourceName: 'KAMPUS Events & Career Cell',
      officialSourceUrl: 'https://kampus.edu.in',
      lastUpdatedISO: addDaysISO(0),
      isSampleListing: true,
    },
  ];

  return {
    organizations,
    opportunities,
    scholarships,
    applications: [],
    resumes: [],
    portfoliosByUser: {},
    roadmapsByUser: {},
    preferencesByUser: {},
    savedOppIdsByUser: {},
    viewedOppIdsByUser: {},
    notInterestedByUser: {},
    interviewHistory: [],
    assessmentAttempts: [],
    learningProgressByUser: {},
    reports: [],
    roleOverrides: {},
    resumeFiles: {},
  };
}

const careerStorage = new ModuleStorage<CareerDatabase>(
  'career',
  DB_FILE,
  () => createSeedDatabase()
);

function loadDb(): CareerDatabase {
  return careerStorage.get();
}

function saveDb(db: CareerDatabase) {
  careerStorage.saveSync(db);
}

function readCrossModuleContext(userId: string) {
  let kampusIdNumber: string | null = null;
  let careerEvents: Array<{
    id: string;
    title: string;
    category: string;
    subType: string;
    startDateISO: string;
    startTime: string;
    venue: string;
    organizerName: string;
  }> = [];

  try {
    if (fs.existsSync(KAMPUS_ID_DB_FILE)) {
      const kdb = JSON.parse(fs.readFileSync(KAMPUS_ID_DB_FILE, 'utf-8'));
      kampusIdNumber = kdb?.identitiesByUser?.[userId]?.kampusIdNumber || null;
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(EVENTS_DB_FILE)) {
      const edb = JSON.parse(fs.readFileSync(EVENTS_DB_FILE, 'utf-8'));
      const evs = Array.isArray(edb?.events) ? edb.events : [];
      careerEvents = evs
        .filter(
          (e: { category?: string; subType?: string; status?: string }) =>
            (e.category === 'Career' ||
              e.subType === 'Resume Workshops' ||
              e.subType === 'Workshops' ||
              e.subType === 'Hackathons') &&
            e.status !== 'Draft' &&
            e.status !== 'Cancelled'
        )
        .map(
          (e: {
            id: string;
            title: string;
            category: string;
            subType: string;
            startDateISO: string;
            startTime: string;
            venue: string;
            organizerName: string;
          }) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            subType: e.subType,
            startDateISO: e.startDateISO,
            startTime: e.startTime,
            venue: e.venue,
            organizerName: e.organizerName,
          })
        );
    }
  } catch {
    // ignore
  }

  return { kampusIdNumber, careerEvents };
}

function createDefaultResume(
  userId: string,
  fullName: string,
  email: string,
  college: string,
  course: string,
  semester: string
): ResumeDocument {
  return {
    id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    userId,
    versionName: 'Primary Student Resume (Editable)',
    templateId: 'Professional',
    sectionOrder: [
      'summary',
      'education',
      'skills',
      'projects',
      'internships',
      'experience',
      'certifications',
      'achievements',
      'positions',
      'extracurricular',
      'languages',
      'links',
    ],
    hiddenSections: [],
    personalInfo: {
      fullName,
      email,
      phone: '',
      location: '',
      headline: `${course} Student`,
      linkedin: '',
      github: '',
      portfolioUrl: '',
    },
    summary: '',
    education: [
      {
        institution: college || 'University / College',
        degree: course || 'Degree Program',
        period: semester || 'Current',
        grade: '',
      },
    ],
    skills: [],
    experience: [],
    internships: [],
    projects: [],
    certifications: [],
    achievements: [],
    positions: [],
    extracurricular: [],
    languages: ['English'],
    links: [],
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultPortfolio(
  userId: string,
  fullName: string,
  college: string,
  course: string,
  semester: string,
  email: string
): PortfolioDocument {
  const slugBase = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 22);
  return {
    userId,
    publicSlug: `${slugBase || 'student'}-${userId.slice(-4)}`,
    isPublic: false,
    theme: 'Editorial Clean',
    sectionOrder: [
      'about',
      'education',
      'skills',
      'projects',
      'experience',
      'certifications',
      'achievements',
      'resume',
      'contact',
    ],
    aboutMe: '',
    educationSummary: `${course} · ${college} (${semester})`,
    skills: [],
    projects: [],
    experienceSummary: '',
    certifications: [],
    achievements: [],
    showContactLinks: false,
    contactEmail: email,
    githubUrl: '',
    linkedinUrl: '',
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultRoadmap(
  userId: string,
  course: string,
  semester: string,
  desiredRole: string
): CareerRoadmap {
  return {
    userId,
    educationLevel: semester || 'Undergraduate',
    academicBackground: course || 'General Degree',
    careerInterest: 'Software & Applied Problem Solving',
    currentSkills: [],
    desiredRole: desiredRole || 'Software Engineer',
    learningPreference: 'Hands-on Projects + Structured Practice',
    weeklyHours: 8,
    milestones: [
      {
        id: 'rm_1',
        stage: 1,
        title: 'Foundation: Core Programming & Data Modeling',
        description: 'Review language fundamentals, version control (Git), and SQL basics.',
        completed: false,
      },
      {
        id: 'rm_2',
        stage: 2,
        title: 'Skill Development: Guided Practice & Assessment',
        description: 'Complete topic-wise Programming and Problem Solving practice tests.',
        completed: false,
      },
      {
        id: 'rm_3',
        stage: 3,
        title: 'Portfolio: Document 1 Real Project Case Study',
        description: 'Publish a reproducible project with architecture notes and outcomes.',
        completed: false,
      },
      {
        id: 'rm_4',
        stage: 4,
        title: 'Career Preparation: ATS Resume & Mock Interview',
        description: 'Complete resume review and run 2 structured mock interview sessions.',
        completed: false,
      },
      {
        id: 'rm_5',
        stage: 5,
        title: 'Opportunities: Targeted Internship & Fellowship Applications',
        description: 'Shortlist verified internships or official fellowship tracks.',
        completed: false,
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function escapePdf(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number = 82): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function buildResumePdf(resDoc: ResumeDocument): Buffer {
  const lines: string[] = [];
  lines.push(resDoc.personalInfo.fullName.toUpperCase());
  const contactParts = [
    resDoc.personalInfo.email,
    resDoc.personalInfo.phone,
    resDoc.personalInfo.location,
  ].filter(Boolean);
  if (contactParts.length) lines.push(contactParts.join(' | '));
  if (resDoc.personalInfo.headline) lines.push(resDoc.personalInfo.headline);
  const linkParts = [
    resDoc.personalInfo.linkedin,
    resDoc.personalInfo.github,
    resDoc.personalInfo.portfolioUrl,
  ].filter(Boolean);
  if (linkParts.length) lines.push(linkParts.join(' | '));
  lines.push('--------------------------------------------------------------------------');

  for (const sec of resDoc.sectionOrder) {
    if (resDoc.hiddenSections.includes(sec)) continue;
    if (sec === 'summary' && resDoc.summary.trim()) {
      lines.push('SUMMARY');
      lines.push(...wrapText(resDoc.summary));
      lines.push('');
    }
    if (sec === 'education' && resDoc.education.length > 0) {
      lines.push('EDUCATION');
      for (const e of resDoc.education) {
        lines.push(`${e.institution} - ${e.degree} (${e.period})${e.grade ? ' | ' + e.grade : ''}`);
      }
      lines.push('');
    }
    if (sec === 'skills' && resDoc.skills.length > 0) {
      lines.push('SKILLS');
      lines.push(...wrapText(resDoc.skills.join(', ')));
      lines.push('');
    }
    if (sec === 'internships' && resDoc.internships.length > 0) {
      lines.push('INTERNSHIPS');
      for (const item of resDoc.internships) {
        lines.push(`${item.role} | ${item.organization} (${item.period})`);
        item.bullets.forEach((b) => lines.push(...wrapText(`- ${b}`, 80)));
      }
      lines.push('');
    }
    if (sec === 'experience' && resDoc.experience.length > 0) {
      lines.push('WORK EXPERIENCE');
      for (const item of resDoc.experience) {
        lines.push(`${item.role} | ${item.organization} (${item.period})`);
        item.bullets.forEach((b) => lines.push(...wrapText(`- ${b}`, 80)));
      }
      lines.push('');
    }
    if (sec === 'projects' && resDoc.projects.length > 0) {
      lines.push('PROJECTS');
      for (const p of resDoc.projects) {
        lines.push(`${p.title}${p.tech ? ` (${p.tech})` : ''}`);
        p.bullets.forEach((b) => lines.push(...wrapText(`- ${b}`, 80)));
      }
      lines.push('');
    }
    if (sec === 'certifications' && resDoc.certifications.length > 0) {
      lines.push('CERTIFICATIONS');
      for (const c of resDoc.certifications) {
        lines.push(`${c.title} - ${c.issuer} (${c.year})`);
      }
      lines.push('');
    }
    if (sec === 'achievements' && resDoc.achievements.length > 0) {
      lines.push('ACHIEVEMENTS');
      resDoc.achievements.forEach((a) => lines.push(...wrapText(`- ${a}`, 80)));
      lines.push('');
    }
    if (sec === 'positions' && resDoc.positions.length > 0) {
      lines.push('POSITIONS OF RESPONSIBILITY');
      for (const p of resDoc.positions) {
        lines.push(`${p.role} | ${p.organization} (${p.period})`);
      }
      lines.push('');
    }
    if (sec === 'extracurricular' && resDoc.extracurricular.length > 0) {
      lines.push('EXTRACURRICULAR ACTIVITIES');
      resDoc.extracurricular.forEach((a) => lines.push(...wrapText(`- ${a}`, 80)));
      lines.push('');
    }
    if (sec === 'languages' && resDoc.languages.length > 0) {
      lines.push(`LANGUAGES: ${resDoc.languages.join(', ')}`);
      lines.push('');
    }
    if (sec === 'links' && resDoc.links.length > 0) {
      lines.push('LINKS');
      resDoc.links.forEach((l) => lines.push(`${l.label}: ${l.url}`));
      lines.push('');
    }
  }

  const trimmed = lines.slice(0, 46);
  const ops = ['BT', '/F2 13 Tf', '48 748 Td', '15 TL'];
  trimmed.forEach((ln, idx) => {
    const safe = escapePdf(ln);
    if (idx === 0) {
      ops.push(`(${safe}) Tj T* /F1 10 Tf`);
    } else if (
      ['SUMMARY', 'EDUCATION', 'SKILLS', 'INTERNSHIPS', 'WORK EXPERIENCE', 'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'POSITIONS OF RESPONSIBILITY', 'EXTRACURRICULAR ACTIVITIES', 'LINKS'].includes(
        ln
      )
    ) {
      ops.push(`/F2 10.5 Tf (${safe}) Tj T* /F1 10 Tf`);
    } else {
      ops.push(`(${safe}) Tj T*`);
    }
  });
  ops.push('ET');
  const stream = ops.join('\n');
  const objs = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += o + '\n';
  }
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

export function registerCareerBackend(app: Express) {
  const db = loadDb();

  // 1. Bootstrap Career workspace
  app.post('/api/career/bootstrap', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const fullName = String(b.fullName || 'KAMPUS Student').trim();
    const email = String(b.email || '').trim();
    const college = String(b.college || 'Indian Institute of Technology, Bombay').trim();
    const course = String(b.course || 'B.Tech in Computer Science & AI').trim();
    const semester = String(b.semester || 'Semester 6').trim();

    if (!db.preferencesByUser[userId]) {
      db.preferencesByUser[userId] = {
        userId,
        interests: Array.isArray(b.interests) ? b.interests : ['Software Development'],
        preferredIndustries: ['Technology'],
        targetRoles: ['Software Engineer'],
        skills: [],
        learningGoals: ['Build verified project portfolio'],
        visibilityToRecruiters: 'With Consent Only',
        alerts: [],
      };
    }

    const userResumes = db.resumes.filter((r) => r.userId === userId);
    if (userResumes.length === 0) {
      db.resumes.unshift(
        createDefaultResume(userId, fullName, email, college, course, semester)
      );
    }

    if (!db.portfoliosByUser[userId]) {
      db.portfoliosByUser[userId] = createDefaultPortfolio(
        userId,
        fullName,
        college,
        course,
        semester,
        email
      );
    }

    if (!db.roadmapsByUser[userId]) {
      db.roadmapsByUser[userId] = createDefaultRoadmap(
        userId,
        course,
        semester,
        db.preferencesByUser[userId].targetRoles[0] || 'Software Engineer'
      );
    }

    saveDb(db);

    const roleInfo = db.roleOverrides[userId] || { role: 'Student' as CareerRole, label: null };
    const crossModule = readCrossModuleContext(userId);
    const isAdminOrTeam = roleInfo.role === 'Platform Admin' || roleInfo.role === 'Career Team';
    const isRecruiter = roleInfo.role === 'Authorized Recruiter';

    const visibleOpps = db.opportunities.filter(
      (o) => o.status !== 'Removed' || isAdminOrTeam
    );

    const managedOppIds = db.opportunities
      .filter((o) => o.createdById === userId || isAdminOrTeam)
      .map((o) => o.id);

    const visibleApps = db.applications.filter(
      (a) =>
        a.userId === userId ||
        ((isRecruiter || isAdminOrTeam) &&
          a.opportunityId &&
          managedOppIds.includes(a.opportunityId) &&
          a.consentConfirmed)
    );

    return res.json({
      organizations: db.organizations,
      opportunities: visibleOpps,
      scholarships: db.scholarships,
      applications: visibleApps,
      resumes: db.resumes.filter((r) => r.userId === userId),
      portfolio: db.portfoliosByUser[userId],
      roadmap: db.roadmapsByUser[userId],
      preferences: db.preferencesByUser[userId],
      savedOpportunityIds: db.savedOppIdsByUser[userId] || [],
      viewedOpportunityIds: db.viewedOppIdsByUser[userId] || [],
      notInterestedIds: db.notInterestedByUser[userId] || [],
      interviewHistory: db.interviewHistory.filter((i) => i.userId === userId),
      assessmentAttempts: db.assessmentAttempts.filter((a) => a.userId === userId),
      learningProgress: db.learningProgressByUser[userId] || {
        bookmarkedIds: [],
        completedIds: [],
      },
      reports: isAdminOrTeam
        ? db.reports
        : db.reports.filter((rp) => rp.reporterId === userId),
      roleInfo,
      crossModule,
    });
  });

  // 2. Role Access (Backend Enforced RBAC)
  app.post('/api/career/auth/role-session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.roleOverrides[userId];
      saveDb(db);
      return res.json({ ok: true, roleInfo: { role: 'Student', label: null } });
    }
    const matched = CAREER_PASSKEYS[String(passkey || '').trim().toUpperCase()];
    if (!matched) {
      return res.status(403).json({ message: 'Invalid Career / Recruiter authorization code.' });
    }
    db.roleOverrides[userId] = matched;
    saveDb(db);
    return res.json({ ok: true, roleInfo: matched });
  });

  // 3. Preferences & Alerts
  app.post('/api/career/preferences', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !db.preferencesByUser[userId]) {
      return res.status(400).json({ message: 'Preferences record missing.' });
    }
    db.preferencesByUser[userId] = {
      ...db.preferencesByUser[userId],
      interests: Array.isArray(b.interests) ? b.interests : db.preferencesByUser[userId].interests,
      preferredIndustries: Array.isArray(b.preferredIndustries)
        ? b.preferredIndustries
        : db.preferencesByUser[userId].preferredIndustries,
      targetRoles: Array.isArray(b.targetRoles)
        ? b.targetRoles
        : db.preferencesByUser[userId].targetRoles,
      skills: Array.isArray(b.skills) ? b.skills : db.preferencesByUser[userId].skills,
      learningGoals: Array.isArray(b.learningGoals)
        ? b.learningGoals
        : db.preferencesByUser[userId].learningGoals,
      visibilityToRecruiters:
        b.visibilityToRecruiters === 'Private' ? 'Private' : 'With Consent Only',
    };
    saveDb(db);
    return res.json({ preferences: db.preferencesByUser[userId] });
  });

  app.post('/api/career/alerts', (req: Request, res: Response) => {
    const { userId, alert, deleteAlertId } = req.body || {};
    const pref = db.preferencesByUser[String(userId || '')];
    if (!pref) return res.status(400).json({ message: 'Student preferences not found.' });
    if (deleteAlertId) {
      pref.alerts = pref.alerts.filter((a) => a.id !== deleteAlertId);
    } else if (alert) {
      pref.alerts.unshift({
        id: `calert_${Date.now()}`,
        roleKeyword: String(alert.roleKeyword || '').trim(),
        industry: String(alert.industry || 'All'),
        location: String(alert.location || 'Any'),
        opportunityType: String(alert.opportunityType || 'All'),
        workFormat: String(alert.workFormat || 'All'),
        deadlineWithinDays: Number(alert.deadlineWithinDays) || 14,
        createdAt: new Date().toISOString(),
      });
    }
    saveDb(db);
    return res.json({ preferences: pref });
  });

  // 4. Save / View / Not Interested toggles
  app.post('/api/career/saved', (req: Request, res: Response) => {
    const { userId, opportunityId } = req.body || {};
    if (!userId || !opportunityId) return res.status(400).json({ message: 'Missing fields.' });
    const list = db.savedOppIdsByUser[userId] || [];
    db.savedOppIdsByUser[userId] = list.includes(opportunityId)
      ? list.filter((x) => x !== opportunityId)
      : [opportunityId, ...list];
    saveDb(db);
    return res.json({ savedOpportunityIds: db.savedOppIdsByUser[userId] });
  });

  app.post('/api/career/viewed', (req: Request, res: Response) => {
    const { userId, opportunityId } = req.body || {};
    if (!userId || !opportunityId) return res.status(400).json({ message: 'Missing fields.' });
    const list = (db.viewedOppIdsByUser[userId] || []).filter((x) => x !== opportunityId);
    db.viewedOppIdsByUser[userId] = [opportunityId, ...list].slice(0, 12);
    saveDb(db);
    return res.json({ viewedOpportunityIds: db.viewedOppIdsByUser[userId] });
  });

  app.post('/api/career/not-interested', (req: Request, res: Response) => {
    const { userId, opportunityId } = req.body || {};
    if (!userId || !opportunityId) return res.status(400).json({ message: 'Missing fields.' });
    const list = db.notInterestedByUser[userId] || [];
    if (!list.includes(opportunityId)) list.push(opportunityId);
    db.notInterestedByUser[userId] = list;
    saveDb(db);
    return res.json({ notInterestedIds: list });
  });

  // 5. Application Tracker & Explicit Consent Hosted Submission
  app.post('/api/career/applications', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !String(b.roleTitle || '').trim() || !String(b.companyName || '').trim()) {
      return res.status(400).json({ message: 'Role title and organization name are required.' });
    }
    if (b.applicationMode === 'KAMPUS-Hosted' && b.status === 'Applied' && !b.consentConfirmed) {
      return res.status(400).json({
        message: 'Explicit consent is required before submitting your resume on KAMPUS.',
      });
    }

    if (b.opportunityId && b.status === 'Applied') {
      const dup = db.applications.find(
        (a) =>
          a.userId === userId &&
          a.opportunityId === b.opportunityId &&
          a.status !== 'Withdrawn' &&
          !a.archived
      );
      if (dup) {
        return res.status(400).json({
          message: 'You already have an active tracker/application record for this opportunity.',
        });
      }
    }

    const appItem: JobApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      userId,
      opportunityId: b.opportunityId || undefined,
      roleTitle: String(b.roleTitle).trim(),
      companyName: String(b.companyName).trim(),
      opportunityLink: b.opportunityLink ? String(b.opportunityLink).trim() : undefined,
      applicationMode: b.applicationMode || 'Manual Entry',
      status: b.status || 'Planning to Apply',
      appliedDateISO:
        b.status === 'Applied'
          ? String(b.appliedDateISO || new Date().toISOString().slice(0, 10))
          : b.appliedDateISO,
      deadlineISO: b.deadlineISO || undefined,
      resumeVersionId: b.resumeVersionId || undefined,
      resumeVersionName: b.resumeVersionName || undefined,
      interviewDateISO: b.interviewDateISO || undefined,
      interviewNotes: b.interviewNotes || '',
      personalNotes: b.personalNotes || '',
      feedbackNotes: b.feedbackNotes || '',
      followUpDateISO: b.followUpDateISO || undefined,
      archived: false,
      consentConfirmed: Boolean(b.consentConfirmed),
      updatedAt: new Date().toISOString(),
    };
    db.applications.unshift(appItem);
    saveDb(db);
    return res.status(201).json({ application: appItem });
  });

  app.patch('/api/career/applications/:id', (req: Request, res: Response) => {
    const item = db.applications.find((a) => a.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Application record not found.' });
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    const isOwner = item.userId === b.userId;
    const isAuthorized = role === 'Authorized Recruiter' || role === 'Platform Admin' || role === 'Career Team';
    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to modify this application.' });
    }
    if (b.status) item.status = b.status;
    if (typeof b.interviewDateISO === 'string') item.interviewDateISO = b.interviewDateISO;
    if (typeof b.interviewNotes === 'string') item.interviewNotes = b.interviewNotes;
    if (typeof b.personalNotes === 'string') item.personalNotes = b.personalNotes;
    if (typeof b.feedbackNotes === 'string') item.feedbackNotes = b.feedbackNotes;
    if (typeof b.followUpDateISO === 'string') item.followUpDateISO = b.followUpDateISO;
    if (typeof b.archived === 'boolean') item.archived = b.archived;
    if (b.status === 'Applied' && !item.appliedDateISO) {
      item.appliedDateISO = new Date().toISOString().slice(0, 10);
    }
    item.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ application: item });
  });

  // 6. Resume Builder (Multi-version, Editable, ATS PDF Export, Secure PDF Upload <= 5 MB)
  app.post('/api/career/resumes', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId required.' });
    const created: ResumeDocument = {
      ...createDefaultResume(
        userId,
        b.personalInfo?.fullName || 'Student',
        b.personalInfo?.email || '',
        b.education?.[0]?.institution || '',
        b.education?.[0]?.degree || '',
        b.education?.[0]?.period || ''
      ),
      ...b,
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      userId,
      versionName: String(b.versionName || 'New Resume Version').trim(),
      updatedAt: new Date().toISOString(),
    };
    db.resumes.unshift(created);
    saveDb(db);
    return res.status(201).json({ resume: created });
  });

  app.patch('/api/career/resumes/:id', (req: Request, res: Response) => {
    const idx = db.resumes.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Resume not found.' });
    const existing = db.resumes[idx];
    if (existing.userId !== req.body?.userId) {
      return res.status(403).json({ message: 'Only the owner can edit this resume.' });
    }
    const updated: ResumeDocument = {
      ...existing,
      ...req.body,
      id: existing.id,
      userId: existing.userId,
      updatedAt: new Date().toISOString(),
    };
    db.resumes[idx] = updated;
    saveDb(db);
    return res.json({ resume: updated });
  });

  app.delete('/api/career/resumes/:id', (req: Request, res: Response) => {
    const existing = db.resumes.find((r) => r.id === req.params.id);
    if (!existing) return res.status(404).json({ message: 'Resume not found.' });
    if (existing.userId !== String(req.query.userId || '')) {
      return res.status(403).json({ message: 'Only the owner can delete this resume.' });
    }
    db.resumes = db.resumes.filter((r) => r.id !== existing.id);
    saveDb(db);
    return res.json({ ok: true });
  });

  app.get('/api/career/resumes/:id/pdf', (req: Request, res: Response) => {
    const r = db.resumes.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).send('Resume not found');
    const pdf = buildResumePdf(r);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${r.versionName.replace(/[^a-z0-9_-]/gi, '_')}.pdf"`
    );
    return res.send(pdf);
  });

  app.post('/api/career/upload-resume', (req: Request, res: Response) => {
    const { userId, fileName, base64Data, resumeId } = req.body || {};
    if (!userId || !fileName || !base64Data) {
      return res.status(400).json({ message: 'Missing resume PDF file payload.' });
    }
    const clean = String(base64Data).includes(',')
      ? String(base64Data).split(',')[1]
      : String(base64Data);
    const buffer = Buffer.from(clean, 'base64');
    if (buffer.length === 0 || buffer.length > MAX_PDF_BYTES) {
      return res.status(400).json({ message: 'Resume PDF must be non-empty and under 5 MB.' });
    }
    if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return res.status(400).json({ message: 'Only valid PDF documents (%PDF-) are accepted.' });
    }
    const id = `rfile_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    db.resumeFiles[id] = {
      id,
      fileName: String(fileName),
      sizeBytes: buffer.length,
      base64Data: clean,
      uploadedBy: String(userId),
      createdAt: new Date().toISOString(),
    };
    const fileUrl = `/api/career/resume-files/${id}?userId=${encodeURIComponent(String(userId))}`;
    if (resumeId) {
      const target = db.resumes.find((r) => r.id === resumeId && r.userId === userId);
      if (target) {
        target.uploadedPdfName = String(fileName);
        target.uploadedPdfUrl = fileUrl;
      }
    }
    saveDb(db);
    return res.status(201).json({ fileUrl, fileName });
  });

  app.get('/api/career/resume-files/:id', (req: Request, res: Response) => {
    const f = db.resumeFiles[req.params.id];
    if (!f) return res.status(404).send('Not found');
    const requester = String(req.query.userId || '');
    if (requester !== f.uploadedBy) {
      return res.status(403).send('Private resume file: consent-restricted.');
    }
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(Buffer.from(f.base64Data, 'base64'));
  });

  // 7. Portfolio Builder & Public Visibility
  app.patch('/api/career/portfolio', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !db.portfoliosByUser[userId]) {
      return res.status(404).json({ message: 'Portfolio not found.' });
    }
    db.portfoliosByUser[userId] = {
      ...db.portfoliosByUser[userId],
      ...b,
      userId,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    return res.json({ portfolio: db.portfoliosByUser[userId] });
  });

  app.get('/api/career/portfolio/public/:slug', (req: Request, res: Response) => {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    const port = Object.values(db.portfoliosByUser).find(
      (p) => p.publicSlug.toLowerCase() === slug
    );
    if (!port) return res.status(404).json({ message: 'Portfolio not found.' });
    if (!port.isPublic) {
      return res.json({
        isPublic: false,
        message: 'Student has set this portfolio to Private.',
      });
    }
    return res.json({
      isPublic: true,
      portfolio: {
        ...port,
        contactEmail: port.showContactLinks ? port.contactEmail : undefined,
        githubUrl: port.showContactLinks ? port.githubUrl : undefined,
        linkedinUrl: port.showContactLinks ? port.linkedinUrl : undefined,
      },
    });
  });

  // 8. Personalized Career Roadmap
  app.patch('/api/career/roadmap', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !db.roadmapsByUser[userId]) {
      return res.status(404).json({ message: 'Roadmap not found.' });
    }
    db.roadmapsByUser[userId] = {
      ...db.roadmapsByUser[userId],
      ...b,
      userId,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    return res.json({ roadmap: db.roadmapsByUser[userId] });
  });

  // 9. Interview Practice History
  app.post('/api/career/interview/practice', (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.userId || !b.questionId || !String(b.answerText || '').trim()) {
      return res.status(400).json({ message: 'Answer text is required.' });
    }
    const entry: InterviewPracticeEntry = {
      id: `ip_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      userId: String(b.userId),
      questionId: String(b.questionId),
      questionPrompt: String(b.questionPrompt || ''),
      interviewType: b.interviewType || 'Technical Interview',
      answerText: String(b.answerText).trim(),
      aiFeedback: b.aiFeedback || undefined,
      createdAt: new Date().toISOString(),
    };
    db.interviewHistory.unshift(entry);
    saveDb(db);
    return res.status(201).json({ entry });
  });

  // 10. Skill Assessments Attempt Logger
  app.post('/api/career/assessments/attempt', (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.userId || !b.category) {
      return res.status(400).json({ message: 'Invalid assessment attempt.' });
    }
    const attempt: AssessmentAttempt = {
      id: `assm_${Date.now()}`,
      userId: String(b.userId),
      category: b.category,
      mode: b.mode === 'Timed' ? 'Timed' : 'Untimed',
      totalQuestions: Number(b.totalQuestions) || 0,
      correctCount: Number(b.correctCount) || 0,
      weakTopics: Array.isArray(b.weakTopics) ? b.weakTopics : [],
      durationSeconds: Number(b.durationSeconds) || 0,
      createdAt: new Date().toISOString(),
    };
    db.assessmentAttempts.unshift(attempt);
    saveDb(db);
    return res.status(201).json({ attempt });
  });

  // 11. Career Learning Hub Progress
  app.post('/api/career/learning/toggle', (req: Request, res: Response) => {
    const { userId, resourceId, field } = req.body || {};
    if (!userId || !resourceId || !['bookmark', 'complete'].includes(field)) {
      return res.status(400).json({ message: 'Invalid learning progress request.' });
    }
    const cur = db.learningProgressByUser[userId] || { bookmarkedIds: [], completedIds: [] };
    const arr = field === 'bookmark' ? cur.bookmarkedIds : cur.completedIds;
    const next = arr.includes(resourceId)
      ? arr.filter((x) => x !== resourceId)
      : [...arr, resourceId];
    if (field === 'bookmark') cur.bookmarkedIds = next;
    else cur.completedIds = next;
    db.learningProgressByUser[userId] = cur;
    saveDb(db);
    return res.json({ learningProgress: cur });
  });

  // 12. Safety Reports
  app.post('/api/career/reports', (req: Request, res: Response) => {
    const { userId, userName, targetType, targetId, targetTitle, reason, details } = req.body || {};
    if (!userId || !targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Report fields missing.' });
    }
    const rp: CareerReport = {
      id: `crep_${Date.now()}`,
      reporterId: String(userId),
      reporterName: String(userName || 'Student'),
      targetType,
      targetId: String(targetId),
      targetTitle: String(targetTitle || 'Listing'),
      reason: String(reason),
      details: String(details || ''),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(rp);
    saveDb(db);
    return res.status(201).json({ report: rp });
  });

  // 13. Recruiter & Admin Management (Backend RBAC Enforced)
  app.post('/api/career/recruiter/organizations', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!['Authorized Recruiter', 'Career Team', 'Platform Admin'].includes(role)) {
      return res.status(403).json({ message: 'Authorized Recruiter or Career Admin access required.' });
    }
    const org: OrganizationProfile = {
      id: `org_${Date.now()}`,
      name: String(b.name || '').trim(),
      industry: String(b.industry || 'Technology').trim(),
      location: String(b.location || 'Campus / Remote').trim(),
      website: String(b.website || 'https://kampus.edu.in').trim(),
      description: String(b.description || '').trim(),
      verificationStatus:
        role === 'Platform Admin' || role === 'Career Team'
          ? 'Verified Organization'
          : 'Unverified Listing Source',
      createdById: String(b.userId),
    };
    db.organizations.unshift(org);
    saveDb(db);
    return res.status(201).json({ organization: org });
  });

  app.post('/api/career/recruiter/opportunities', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '');
    const role = db.roleOverrides[userId]?.role || 'Student';
    if (!['Authorized Recruiter', 'Career Team', 'Platform Admin'].includes(role)) {
      return res.status(403).json({
        message: 'Forbidden: Only Authorized Recruiters, Career Team, or Platform Admins can publish opportunities.',
      });
    }
    if (!String(b.title || '').trim() || !String(b.organizationName || '').trim()) {
      return res.status(400).json({ message: 'Role title and organization name are required.' });
    }
    const opp: CareerOpportunity = {
      id: `opp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title: String(b.title).trim(),
      organizationId: String(b.organizationId || 'org_kampus_cell'),
      organizationName: String(b.organizationName).trim(),
      organizationVerified: role === 'Platform Admin' || role === 'Career Team',
      location: String(b.location || 'Remote').trim(),
      workFormat: b.workFormat || 'Remote',
      opportunityType: b.opportunityType || 'Internship',
      category: b.category || 'Software Development',
      experienceLevel: b.experienceLevel || 'Fresher / Student',
      educationRequirement: String(b.educationRequirement || 'Enrolled students'),
      requiredSkills: Array.isArray(b.requiredSkills) ? b.requiredSkills : [],
      preferredSkills: Array.isArray(b.preferredSkills) ? b.preferredSkills : [],
      isPaid: Boolean(b.isPaid),
      compensationLabel: String(b.compensationLabel || 'Disclosed during official selection'),
      deadlineISO: String(b.deadlineISO || addDaysISO(20)),
      publishedAtISO: new Date().toISOString().slice(0, 10),
      listingSource: 'KAMPUS Authorized Recruiter',
      applicationMode: b.applicationMode === 'External Link' ? 'External Link' : 'KAMPUS-Hosted',
      externalApplyUrl: b.externalApplyUrl || undefined,
      aboutOrganization: String(b.aboutOrganization || ''),
      roleDescription: String(b.roleDescription || ''),
      responsibilities: Array.isArray(b.responsibilities) ? b.responsibilities : [],
      qualifications: Array.isArray(b.qualifications) ? b.qualifications : [],
      benefits: Array.isArray(b.benefits) ? b.benefits : [],
      applicationProcess: ['Submit KAMPUS Resume with explicit consent or official external link.'],
      importantDates: [`Deadline: ${String(b.deadlineISO || addDaysISO(20))}`],
      status: 'Open',
      createdById: userId,
    };
    db.opportunities.unshift(opp);
    saveDb(db);
    return res.status(201).json({ opportunity: opp });
  });

  app.patch('/api/career/admin/opportunities/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    const opp = db.opportunities.find((o) => o.id === req.params.id);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found.' });
    const isAdmin = role === 'Platform Admin' || role === 'Career Team';
    const isCreator = opp.createdById === b.userId && role === 'Authorized Recruiter';
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Forbidden: Admin or listing owner permission required.' });
    }
    if (b.status && ['Open', 'Closed', 'Removed'].includes(b.status)) {
      opp.status = b.status;
    }
    saveDb(db);
    return res.json({ opportunity: opp });
  });

  app.patch('/api/career/admin/reports/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (role !== 'Platform Admin' && role !== 'Career Team') {
      return res.status(403).json({ message: 'Forbidden: Platform Admin or Career Team required.' });
    }
    const rp = db.reports.find((r) => r.id === req.params.id);
    if (!rp) return res.status(404).json({ message: 'Report not found.' });
    rp.status = 'Reviewed';
    saveDb(db);
    return res.json({ report: rp });
  });
}
