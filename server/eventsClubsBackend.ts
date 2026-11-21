import { ModuleStorage } from '../database/moduleStorage.ts';
import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  CampusClub,
  CampusEvent,
  CertificateType,
  ClubActivity,
  ClubAnnouncement,
  ClubGalleryItem,
  ClubMembership,
  ClubRole,
  EventCertificate,
  EventFeedback,
  EventRegistration,
  EventsClubsReport,
  EventTeam,
} from '../src/types/eventsClubs.ts';

interface StoredEventFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Data: string;
  uploadedBy: string;
  createdAt: string;
}

interface EventsClubsDatabase {
  events: CampusEvent[];
  registrations: EventRegistration[];
  teams: EventTeam[];
  certificates: EventCertificate[];
  clubs: CampusClub[];
  memberships: ClubMembership[];
  clubActivities: ClubActivity[];
  clubAnnouncements: ClubAnnouncement[];
  clubGallery: ClubGalleryItem[];
  savedEventIdsByUser: Record<string, string[]>;
  feedback: EventFeedback[];
  reports: EventsClubsReport[];
  usedCheckInNonces: string[];
  organizerOverrides: Record<
    string,
    { role: 'Institutional Event Admin' | 'Club Lead'; clubId?: string; label: string }
  >;
  files: Record<string, StoredEventFile>;
}

const DB_FILE = path.join(process.cwd(), '.kampus_events_clubs_db.json');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const QR_HMAC_SECRET =
  process.env.KAMPUS_QR_SECRET || 'kampus-event-checkin-ephemeral-signing-key-2026';

const ORGANIZER_PASSKEYS: Record<
  string,
  { role: 'Institutional Event Admin' | 'Club Lead'; clubId?: string; label: string }
> = {
  'KMP-INST-EVT-2026': {
    role: 'Institutional Event Admin',
    label: 'Dean of Student Affairs · Events Office',
  },
  'KMP-CLUB-LEAD-2026': {
    role: 'Club Lead',
    clubId: 'club_wncc',
    label: 'Web & Coding Club (WnCC) President',
  },
};

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hoursAgoISO(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function signEventQrToken(payload: {
  regId: string;
  eventId: string;
  userId: string;
  nonce: string;
  exp: number;
}): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', QR_HMAC_SECRET)
    .update(encoded)
    .digest('base64url');
  return `KMP-EVT.${encoded}.${sig}`;
}

function verifyEventQrToken(token: string): {
  valid: boolean;
  expired?: boolean;
  payload?: { regId: string; eventId: string; userId: string; nonce: string; exp: number };
} {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'KMP-EVT') return { valid: false };
    const [, encoded, sig] = parts;
    const expected = crypto
      .createHmac('sha256', QR_HMAC_SECRET)
      .update(encoded)
      .digest('base64url');
    if (sig !== expected) return { valid: false };
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.regId || !payload.eventId || !payload.exp || !payload.nonce) {
      return { valid: false };
    }
    if (Date.now() > Number(payload.exp)) {
      return { valid: false, expired: true, payload };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

function escapePdf(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildCertificatePdf(cert: EventCertificate): Buffer {
  const lines = [
    'KAMPUS · VERIFIED EVENT CERTIFICATE RECORD',
    '--------------------------------------------------------------------',
    `Certificate Reference: ${cert.certificateRef}`,
    `Achievement Type: ${cert.certificateType} Certificate`,
    '',
    'This certifies that',
    cert.studentName.toUpperCase(),
    `participated / recognized in:`,
    cert.eventTitle,
    '',
    `Organizer: ${cert.organizerName}`,
    `Issued By: ${cert.issuedBy}`,
    `Issue Date: ${new Date(cert.issuedAt).toDateString()}`,
    '',
    `Verify online inside KAMPUS Events & Clubs using reference ${cert.certificateRef}`,
  ];
  const ops = ['BT', '/F2 13 Tf', '56 730 Td', '18 TL'];
  lines.forEach((ln, idx) => {
    const safe = escapePdf(ln);
    if (idx === 6) {
      ops.push(`/F2 16 Tf (${safe}) Tj T* /F1 11 Tf`);
    } else if (idx === 0) {
      ops.push(`(${safe}) Tj T* /F1 11 Tf`);
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

function createSeedDatabase(): EventsClubsDatabase {
  const clubs: CampusClub[] = [
    {
      id: 'club_wncc',
      name: 'Web & Coding Club (WnCC)',
      shortCode: 'WnCC',
      category: 'Technical',
      subCategory: 'Coding Club',
      college: 'Indian Institute of Technology, Bombay',
      description:
        'Open student software engineering community hosting hackathons, algorithmic sprints, and open-source mentorship.',
      mission:
        'Empower every student regardless of branch to build practical software systems, collaborate on real projects, and ship together.',
      objectives: [
        'Run weekly peer coding & architecture workshops.',
        'Host flagship collegiate hackathons with transparent judging.',
        'Maintain campus open-source utilities for students.',
      ],
      mainActivities: ['HackKAMPUS Sprint', 'Seasons of Code', 'Weekly Algo Nights'],
      meetingSchedule: 'Wednesdays · 7:30 PM - 9:00 PM (LC 102)',
      facultyCoordinator: 'Prof. S. Sundaram (CSE)',
      visibility: 'Public',
      coverKey: 'tech',
      createdAt: hoursAgoISO(600),
    },
    {
      id: 'club_robotics',
      name: 'Robotics & Makers Guild',
      shortCode: 'ERC',
      category: 'Technical',
      subCategory: 'Robotics Club',
      college: 'Indian Institute of Technology, Bombay',
      description:
        'Hardware prototyping, ROS navigation, embedded PCB design, and autonomous drone workshops.',
      mission: 'Turn classroom physics and embedded theory into working hardware builds.',
      objectives: [
        'Teach soldering, STM32 firmware, and ROS2 simulation.',
        'Support interdisciplinary teams for national robotics contests.',
      ],
      mainActivities: ['Line-Follower Bootcamp', 'Quadcopter Lab Build', 'PCB Design Clinic'],
      meetingSchedule: 'Saturdays · 3:00 PM - 5:30 PM (Tinkerers Lab)',
      facultyCoordinator: 'Prof. R. Joshi (Mechanical)',
      visibility: 'Private',
      coverKey: 'tech',
      createdAt: hoursAgoISO(540),
    },
    {
      id: 'club_cultural',
      name: 'Acoustic & Performing Arts Society',
      shortCode: 'SYMPHONY',
      category: 'Creative',
      subCategory: 'Music Club',
      college: 'Indian Institute of Technology, Bombay',
      description:
        'Campus vocal, acoustic band, stage sound engineering, and festival concert production collective.',
      mission: 'Foster original student music, open-mic nights, and vibrant campus cultural festivals.',
      objectives: [
        'Organize monthly acoustic open-mic evenings at OAT.',
        'Provide shared jam-room schedules and beginner vocal sessions.',
      ],
      mainActivities: ['Unplugged OAT Nights', 'Festival Opening Showcase', 'Production Workshops'],
      meetingSchedule: 'Fridays · 6:30 PM - 8:30 PM (SAC Music Room)',
      visibility: 'Public',
      coverKey: 'cultural',
      createdAt: hoursAgoISO(480),
    },
    {
      id: 'club_ecell',
      name: 'Student Entrepreneurship & Product Cell',
      shortCode: 'E-CELL',
      category: 'Career & Entrepreneurship',
      subCategory: 'Entrepreneurship Club',
      college: 'Indian Institute of Technology, Bombay',
      description:
        'Product teardowns, founder talks, startup pitch clinics, and placement resume critique circles.',
      mission: 'Help student builders validate ideas, talk to users, and prepare for product & founder tracks.',
      objectives: [
        'Host monthly alumni founder AMAs.',
        'Organize zero-to-one product teardowns & pitch feedback.',
      ],
      mainActivities: ['Campus Pitch Night', 'Product Case Sprint', 'Founder Fireside'],
      meetingSchedule: 'Thursdays · 7:00 PM - 8:30 PM (VMCC Seminar Hall)',
      visibility: 'Public',
      coverKey: 'workshop',
      createdAt: hoursAgoISO(420),
    },
  ];

  const events: CampusEvent[] = [
    {
      id: 'evt_hackkampus',
      title: 'HackKAMPUS 2026: 36-Hour Collegiate Product Hackathon',
      description:
        'Build practical student-first software or hardware prototypes across FinTech, Campus Sustainability, and EdTech tracks with mentorship from senior builders and industry engineers.',
      objectives: [
        'Ship a working functional prototype in 36 hours.',
        'Present live architecture demos to a technical jury.',
      ],
      highlights: [
        '3 Problem Tracks: Campus Utility, Applied AI, Accessibility',
        'Overnight workspace & high-speed Wi-Fi in SAC Auditorium',
        'Participation & Winner certificates verified via KAMPUS',
      ],
      category: 'Technology',
      subType: 'Hackathons',
      coverKey: 'tech',
      college: 'Indian Institute of Technology, Bombay',
      department: 'Computer Science & Engineering',
      organizerId: 'club_lead_ananya',
      organizerName: 'Web & Coding Club (WnCC)',
      organizerClubId: 'club_wncc',
      originType: 'Official Institutional Event',
      format: 'Offline',
      startDateISO: addDaysISO(5),
      endDateISO: addDaysISO(6),
      startTime: '9:00 AM',
      endTime: '6:00 PM',
      venue: 'Student Activity Center (SAC) Main Auditorium',
      registrationDeadlineISO: `${addDaysISO(4)}T23:59:00.000Z`,
      eligibility: 'Open to all enrolled undergraduate & postgraduate students (1-4 member teams).',
      participationMode: 'Both',
      minTeamSize: 1,
      maxTeamSize: 4,
      maxSeats: 180,
      entryFeeInr: 0,
      requiresApproval: false,
      requiredQuestions: ['What track or problem theme are you interested in?'],
      schedule: [
        { time: 'Day 1 · 09:00 AM', title: 'Check-In & QR Credential Verification', speakerOrLead: 'WnCC Team' },
        { time: 'Day 1 · 10:30 AM', title: 'Opening Keynote & Problem Track Briefing', speakerOrLead: 'Ananya Desai' },
        { time: 'Day 1 · 02:00 PM', title: 'Mentor Architecture Reviews', speakerOrLead: 'Senior Engineers' },
        { time: 'Day 2 · 04:00 PM', title: 'Final Jury Demos & Results', speakerOrLead: 'Judging Panel' },
      ],
      speakers: [
        { name: 'Raghav Menon', role: 'Staff Systems Engineer', organization: 'CloudStack India' },
        { name: 'Prof. S. Sundaram', role: 'Faculty Mentor', organization: 'IIT Bombay CSE' },
      ],
      organizingTeam: [
        { name: 'Ananya Desai', role: 'Club President' },
        { name: 'Kabir Mehta', role: 'Technical Lead' },
      ],
      rules: [
        'All code must be written fresh during the 36-hour sprint window.',
        'Open-source libraries and documented APIs are permitted.',
        'Valid Institute/KAMPUS event QR check-in is mandatory at venue entry.',
      ],
      requiredMaterials: ['Laptop & charger', 'Valid student ID card', 'Power extension cord (recommended)'],
      faqs: [
        { question: 'Can first-year students join solo?', answer: 'Yes! Solo participants and mixed-year teams up to 4 members are welcome.' },
        { question: 'Is there any registration fee?', answer: 'No, participation is completely free for students.' },
      ],
      status: 'Upcoming',
      isFeatured: true,
      announcements: [
        {
          id: 'eann_1',
          title: 'Team Registration Window Open',
          message: 'Confirm your individual or team entry before Thursday midnight to secure hardware kit access.',
          authorName: 'Web & Coding Club (WnCC)',
          createdAt: hoursAgoISO(8),
        },
      ],
      createdById: 'club_lead_ananya',
      createdAt: hoursAgoISO(48),
    },
    {
      id: 'evt_applied_ai_workshop',
      title: 'Practical RAG & Document Intelligence Workshop (Hands-On)',
      description:
        'A 3-hour guided workshop covering structured JSON extraction, embedding retrieval tradeoffs, evaluation metrics, and building reliable study tools.',
      objectives: [
        'Understand document chunking & citation grounding.',
        'Build and test a small retrieval script on sample lecture PDFs.',
      ],
      highlights: ['Live coding notebook walkthrough', 'Starter GitHub repo provided', 'Q&A with graduate researchers'],
      category: 'Academic',
      subType: 'Workshops',
      coverKey: 'workshop',
      college: 'Indian Institute of Technology, Bombay',
      department: 'Computer Science & Engineering',
      organizerId: 'adm_evt_inst',
      organizerName: 'AI & Innovation Lab · CSE',
      originType: 'Official Institutional Event',
      format: 'Hybrid',
      startDateISO: addDaysISO(3),
      endDateISO: addDaysISO(3),
      startTime: '4:00 PM',
      endTime: '7:00 PM',
      venue: 'KReSIT Seminar Room 204',
      onlineMeetingInfo: 'Livestream link unlocked upon Confirmed Registration',
      registrationDeadlineISO: `${addDaysISO(2)}T20:00:00.000Z`,
      eligibility: 'Basic Python familiarity recommended; open to all branches.',
      participationMode: 'Individual',
      minTeamSize: 1,
      maxTeamSize: 1,
      maxSeats: 90,
      entryFeeInr: 0,
      requiresApproval: false,
      requiredQuestions: ['Your current Python comfort level (Beginner / Intermediate)'],
      schedule: [
        { time: '4:00 PM', title: 'Why Grounding & Evaluation Matter', speakerOrLead: 'Dr. Meera Iyer' },
        { time: '4:45 PM', title: 'Hands-On Chunking & Prompt Schemas', speakerOrLead: 'CSE Teaching Fellows' },
        { time: '6:15 PM', title: 'Open Clinic & Takeaways', speakerOrLead: 'All Mentors' },
      ],
      speakers: [{ name: 'Dr. Meera Iyer', role: 'Assistant Professor', organization: 'CSE Department' }],
      organizingTeam: [{ name: 'Tara Sengupta', role: 'Workshop Coordinator' }],
      rules: ['Arrive 10 minutes early for offline seating; online link is personal.'],
      requiredMaterials: ['Laptop with Python 3.10+ or browser notebook access'],
      faqs: [{ question: 'Will slides be shared after?', answer: 'Yes, attendees receive slides and sample code links.' }],
      status: 'Upcoming',
      isFeatured: true,
      announcements: [],
      createdById: 'adm_evt_inst',
      createdAt: hoursAgoISO(24),
    },
    {
      id: 'evt_unplugged_fest',
      title: 'Twilight Amphitheater: Autumn Cultural & Acoustic Fest',
      description:
        'An evening showcase of student acoustic bands, classical fusion ensembles, theatre monologues, and photography gallery exhibition under the Open Air Theatre.',
      objectives: ['Celebrate campus performing arts and student photography creators.'],
      highlights: ['6 Student Bands & Ensembles', 'Student Photo Exhibition Wall', 'Open Audience Seating'],
      category: 'Cultural',
      subType: 'College Fests',
      coverKey: 'cultural',
      college: 'Indian Institute of Technology, Bombay',
      department: 'Student Cultural Council',
      organizerId: 'club_lead_meera',
      organizerName: 'Acoustic & Performing Arts Society',
      organizerClubId: 'club_cultural',
      originType: 'Student-Organized Event',
      format: 'Offline',
      startDateISO: addDaysISO(9),
      endDateISO: addDaysISO(9),
      startTime: '6:00 PM',
      endTime: '9:30 PM',
      venue: 'Open Air Theatre (OAT)',
      registrationDeadlineISO: `${addDaysISO(8)}T23:59:00.000Z`,
      eligibility: 'Open to all campus students.',
      participationMode: 'Individual',
      minTeamSize: 1,
      maxTeamSize: 1,
      maxSeats: 400,
      entryFeeInr: 0,
      requiresApproval: false,
      requiredQuestions: [],
      schedule: [
        { time: '6:00 PM', title: 'Photography Exhibition Walkthrough', speakerOrLead: 'Design & Photo Circle' },
        { time: '6:45 PM', title: 'Acoustic Ensembles & Drama Showcase', speakerOrLead: 'Symphony Society' },
      ],
      speakers: [],
      organizingTeam: [{ name: 'Meera Kulkarni', role: 'Cultural Coordinator' }],
      rules: ['Keep OAT aisles clear; carry student ID for gate check-in.'],
      requiredMaterials: ['Event QR Pass'],
      faqs: [],
      status: 'Upcoming',
      isFeatured: true,
      announcements: [],
      createdById: 'club_lead_meera',
      createdAt: hoursAgoISO(36),
    },
    {
      id: 'evt_career_resume',
      title: 'Product & Engineering Career Clinic: Resume & Portfolio Review',
      description:
        'Interactive portfolio critique session led by graduating seniors and alumni interviewers focusing on real engineering projects and clarity.',
      objectives: ['Review 1-page resumes and GitHub/design portfolios before internship season.'],
      highlights: ['1-on-1 breakout resume critiques', 'Live portfolio teardown examples'],
      category: 'Career',
      subType: 'Resume Workshops',
      coverKey: 'workshop',
      college: 'Indian Institute of Technology, Bombay',
      department: 'Placement & Career Cell',
      organizerId: 'club_ecell_lead',
      organizerName: 'Student Entrepreneurship & Product Cell',
      organizerClubId: 'club_ecell',
      originType: 'Verified Organizer Event',
      format: 'Online',
      startDateISO: addDaysISO(7),
      endDateISO: addDaysISO(7),
      startTime: '7:30 PM',
      endTime: '9:00 PM',
      venue: 'Online Interactive Session',
      onlineMeetingInfo: 'Google Meet link shared to confirmed registrants',
      registrationDeadlineISO: `${addDaysISO(6)}T22:00:00.000Z`,
      eligibility: 'Pre-final & final year students across all departments.',
      participationMode: 'Individual',
      minTeamSize: 1,
      maxTeamSize: 1,
      maxSeats: 120,
      entryFeeInr: 0,
      requiresApproval: false,
      requiredQuestions: ['Target role (Software / Product / Data / Core Engineering)'],
      schedule: [
        { time: '7:30 PM', title: 'Common Resume Pitfalls', speakerOrLead: 'E-Cell Leads' },
        { time: '8:10 PM', title: 'Live Portfolio Teardown', speakerOrLead: 'Alumni Panel' },
      ],
      speakers: [{ name: 'Rohan Nair', role: 'Final-Year Placement Coordinator', organization: 'E-Cell' }],
      organizingTeam: [{ name: 'Rohan Nair', role: 'Coordinator' }],
      rules: ['Bring a PDF link to your draft resume if opting for live critique.'],
      requiredMaterials: ['Draft PDF resume'],
      faqs: [],
      status: 'Upcoming',
      isFeatured: false,
      announcements: [],
      createdById: 'club_ecell_lead',
      createdAt: hoursAgoISO(12),
    },
  ];

  const memberships: ClubMembership[] = [
    {
      id: 'mem_seed_1',
      clubId: 'club_wncc',
      userId: 'club_lead_ananya',
      studentName: 'Ananya Desai',
      course: 'B.Des in Visual Communication',
      semester: 'Semester 6',
      role: 'Club President',
      status: 'Member',
      joinReason: 'Leading campus developer community.',
      interests: ['UI Systems', 'Web Engineering'],
      skills: ['React', 'Figma'],
      previousExperience: 'Organized two campus design-tech sprints.',
      showInPublicMembers: true,
      updatedAt: hoursAgoISO(240),
    },
    {
      id: 'mem_seed_2',
      clubId: 'club_wncc',
      userId: 'stu_kabir_mehta',
      studentName: 'Kabir Mehta',
      course: 'B.Tech in Computer Science & Engineering',
      semester: 'Semester 7',
      role: 'Event Coordinator',
      status: 'Member',
      joinReason: 'Mentor incoming web builders.',
      interests: ['Backend Architecture', 'TypeScript'],
      skills: ['Node.js', 'TypeScript'],
      previousExperience: 'Core maintainer of campus timetable app.',
      showInPublicMembers: true,
      updatedAt: hoursAgoISO(200),
    },
    {
      id: 'mem_seed_3',
      clubId: 'club_cultural',
      userId: 'club_lead_meera',
      studentName: 'Meera Kulkarni',
      course: 'Dual Degree Mechanical & Management',
      semester: 'Semester 8',
      role: 'Club President',
      status: 'Member',
      joinReason: 'Coordinate OAT acoustic concerts.',
      interests: ['Acoustic Guitar', 'Stage Audio'],
      skills: ['Stage Management', 'Vocals'],
      previousExperience: 'OAT festival sound lead.',
      showInPublicMembers: true,
      updatedAt: hoursAgoISO(180),
    },
  ];

  const clubActivities: ClubActivity[] = [
    {
      id: 'cact_1',
      clubId: 'club_wncc',
      title: 'TypeScript & REST Architecture Lab Night',
      description: 'Collaborative evening workshop walking through clean full-stack API design.',
      dateISO: addDaysISO(2),
      location: 'Lecture Hall LC-102',
      kind: 'Upcoming',
      createdAt: hoursAgoISO(24),
    },
    {
      id: 'cact_2',
      clubId: 'club_wncc',
      title: 'Freshers Git & Linux Kickstart Session',
      description: 'Hands-on orientation covering version control and terminal fundamentals.',
      dateISO: addDaysISO(-12),
      location: 'CS Lab 1',
      kind: 'Past',
      createdAt: hoursAgoISO(300),
    },
    {
      id: 'cact_3',
      clubId: 'club_cultural',
      title: 'Acoustic Jam & Vocal Auditions',
      description: 'Open audition slots for upcoming Twilight Amphitheater showcase.',
      dateISO: addDaysISO(4),
      location: 'SAC Music Room',
      kind: 'Upcoming',
      createdAt: hoursAgoISO(18),
    },
  ];

  const clubAnnouncements: ClubAnnouncement[] = [
    {
      id: 'cann_1',
      clubId: 'club_wncc',
      title: 'HackKAMPUS Mentor Office Hours Announced',
      content: 'Teams registered for HackKAMPUS can book 20-minute architecture check-ins this Thursday.',
      authorName: 'Ananya Desai (Club President)',
      createdAt: hoursAgoISO(10),
    },
  ];

  return {
    events,
    registrations: [],
    teams: [],
    certificates: [],
    clubs,
    memberships,
    clubActivities,
    clubAnnouncements,
    clubGallery: [],
    savedEventIdsByUser: {},
    feedback: [],
    reports: [],
    usedCheckInNonces: [],
    organizerOverrides: {},
    files: {},
  };
}


const eventsClubsStorage = new ModuleStorage<EventsClubsDatabase>(
  'events_clubs',
  DB_FILE,
  () => (createSeedDatabase())
);

function loadDb(): EventsClubsDatabase {
  return eventsClubsStorage.get();
}

function saveDb(db: EventsClubsDatabase): void {
  eventsClubsStorage.saveSync(db);
}

function canManageClub(db: EventsClubsDatabase, userId: string, clubId: string): boolean {
  const ov = db.organizerOverrides[userId];
  if (ov?.role === 'Institutional Event Admin') return true;
  if (ov?.role === 'Club Lead' && ov.clubId === clubId) return true;
  const mem = db.memberships.find(
    (m) => m.clubId === clubId && m.userId === userId && m.status === 'Member'
  );
  return Boolean(
    mem &&
      ['Club President', 'Vice President', 'Club Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(
        mem.role
      )
  );
}

function canManageEvent(db: EventsClubsDatabase, userId: string, ev: CampusEvent): boolean {
  const ov = db.organizerOverrides[userId];
  if (ov?.role === 'Institutional Event Admin') return true;
  if (ev.createdById === userId || ev.organizerId === userId) return true;
  if (ev.organizerClubId && canManageClub(db, userId, ev.organizerClubId)) return true;
  return false;
}

function isAuthorizedCreator(db: EventsClubsDatabase, userId: string): boolean {
  if (db.organizerOverrides[userId]) return true;
  return db.memberships.some(
    (m) =>
      m.userId === userId &&
      m.status === 'Member' &&
      ['Club President', 'Vice President', 'Club Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(
        m.role
      )
  );
}

export function registerEventsClubsBackend(app: Express) {
  const db = loadDb();

  // 1. Bootstrap full Events & Clubs data
  app.get('/api/events-clubs/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const override = db.organizerOverrides[userId] || null;
    const canCreateEvent = isAuthorizedCreator(db, userId);

    // Compute confirmed participant counts genuinely from registrations
    const regCounts: Record<string, number> = {};
    for (const r of db.registrations) {
      if (r.status === 'Confirmed') {
        regCounts[r.eventId] = (regCounts[r.eventId] || 0) + 1;
      }
    }

    // Filter events: show Published/Upcoming/Ongoing/Completed/Cancelled publicly, Draft/Pending only to creator or admin
    const visibleEvents = db.events.filter(
      (ev) =>
        (ev.status !== 'Draft' && ev.status !== 'Pending Approval') ||
        canManageEvent(db, userId, ev)
    );

    // Filter clubs memberships: expose public members or user's own or managed clubs
    const visibleMemberships = db.memberships.filter(
      (m) =>
        m.userId === userId ||
        m.showInPublicMembers ||
        canManageClub(db, userId, m.clubId)
    );

    const managedClubIds = db.clubs
      .filter((c) => canManageClub(db, userId, c.id))
      .map((c) => c.id);

    const managedEventIds = db.events
      .filter((e) => canManageEvent(db, userId, e))
      .map((e) => e.id);

    return res.json({
      events: visibleEvents,
      confirmedCounts: regCounts,
      registrations: db.registrations.filter(
        (r) =>
          r.userId === userId ||
          managedEventIds.includes(r.eventId)
      ),
      teams: db.teams,
      certificates: db.certificates.filter(
        (c) => c.userId === userId || managedEventIds.includes(c.eventId)
      ),
      clubs: db.clubs,
      memberships: visibleMemberships,
      clubActivities: db.clubActivities,
      clubAnnouncements: db.clubAnnouncements,
      clubGallery: db.clubGallery,
      savedEventIds: db.savedEventIdsByUser[userId] || [],
      feedback: db.feedback,
      reports:
        override?.role === 'Institutional Event Admin'
          ? db.reports
          : db.reports.filter((rp) => rp.reporterId === userId),
      authInfo: {
        organizerRole: override?.role || null,
        staffLabel: override?.label || null,
        canCreateEvent,
        managedClubIds,
        managedEventIds,
      },
    });
  });

  // 2. Organizer / Club Leadership Session Verification (Backend Enforced)
  app.post('/api/events-clubs/auth/organizer-session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.organizerOverrides[userId];
      saveDb(db);
      return res.json({ ok: true, organizerRole: null });
    }
    const clean = String(passkey || '').trim().toUpperCase();
    const matched = ORGANIZER_PASSKEYS[clean];
    if (!matched) {
      return res.status(403).json({ message: 'Invalid organizer authorization code.' });
    }
    db.organizerOverrides[userId] = matched;
    saveDb(db);
    return res.json({ ok: true, organizerRole: matched.role, staffLabel: matched.label });
  });

  // 3. Summary endpoint for KAMPUS ID integration
  app.get('/api/events-clubs/user-summary', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const userRegs = db.registrations
      .filter((r) => r.userId === userId && r.status === 'Confirmed')
      .map((r) => {
        const ev = db.events.find((e) => e.id === r.eventId);
        return {
          registrationId: r.id,
          referenceCode: r.referenceCode,
          eventId: r.eventId,
          eventTitle: ev?.title || 'Campus Event',
          eventDate: ev?.startDateISO || '',
          checkInStatus: r.checkInStatus,
        };
      });

    const userClubs = db.memberships
      .filter((m) => m.userId === userId && m.status === 'Member')
      .map((m) => {
        const club = db.clubs.find((c) => c.id === m.clubId);
        return {
          clubId: m.clubId,
          clubName: club?.name || 'Campus Club',
          category: club?.category || '',
          role: m.role,
        };
      });

    const userCerts = db.certificates.filter((c) => c.userId === userId);
    return res.json({
      registeredEvents: userRegs,
      joinedClubs: userClubs,
      certificates: userCerts,
    });
  });

  // 4. File Upload (<= 5 MB)
  app.post('/api/events-clubs/upload', (req: Request, res: Response) => {
    const { userId, fileName, mimeType, base64Data } = req.body || {};
    if (!userId || !fileName || !base64Data) {
      return res.status(400).json({ message: 'Missing file payload.' });
    }
    const clean = String(base64Data).includes(',')
      ? String(base64Data).split(',')[1]
      : String(base64Data);
    const buffer = Buffer.from(clean, 'base64');
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ message: 'File exceeds the 5 MB upload limit.' });
    }
    const id = `ecfile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.files[id] = {
      id,
      fileName: String(fileName),
      mimeType: String(mimeType || 'image/jpeg'),
      sizeBytes: buffer.length,
      base64Data: clean,
      uploadedBy: String(userId),
      createdAt: new Date().toISOString(),
    };
    saveDb(db);
    return res.status(201).json({ url: `/api/events-clubs/files/${id}`, fileId: id });
  });

  app.get('/api/events-clubs/files/:fileId', (req: Request, res: Response) => {
    const f = db.files[req.params.fileId];
    if (!f) return res.status(404).send('File not found');
    const buf = Buffer.from(f.base64Data, 'base64');
    res.setHeader('Content-Type', f.mimeType);
    return res.send(buf);
  });

  // 5. Event Creation & Management (RBAC Enforced)
  app.post('/api/events-clubs/events', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!isAuthorizedCreator(db, userId)) {
      return res.status(403).json({
        message: 'Only authorized club coordinators or institutional event admins can create events.',
      });
    }
    if (!String(b.title || '').trim() || !String(b.description || '').trim()) {
      return res.status(400).json({ message: 'Event title and description are required.' });
    }

    const desiredStatus = b.publishMode === 'draft'
      ? 'Draft'
      : b.publishMode === 'submit-approval'
        ? 'Pending Approval'
        : 'Upcoming';

    if (
      desiredStatus === 'Upcoming' &&
      b.originType === 'Official Institutional Event' &&
      db.organizerOverrides[userId]?.role !== 'Institutional Event Admin'
    ) {
      return res.status(403).json({
        message: 'Official Institutional Events require Institutional Event Admin approval.',
      });
    }

    const ev: CampusEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(b.title).trim(),
      description: String(b.description).trim(),
      objectives: Array.isArray(b.objectives) ? b.objectives.filter(Boolean) : [],
      highlights: Array.isArray(b.highlights) ? b.highlights.filter(Boolean) : [],
      category: b.category || 'Technology',
      subType: b.subType || 'Workshops',
      coverKey:
        b.category === 'Cultural'
          ? 'cultural'
          : b.category === 'Academic' || b.category === 'Career'
            ? 'workshop'
            : 'tech',
      coverImageUrl: b.coverImageUrl || undefined,
      college: String(b.college || 'Indian Institute of Technology, Bombay'),
      department: String(b.department || 'Student Activities'),
      organizerId: userId,
      organizerName: String(b.organizerName || 'Campus Organizer'),
      organizerClubId: b.organizerClubId || undefined,
      originType:
        db.organizerOverrides[userId]?.role === 'Institutional Event Admin'
          ? b.originType || 'Official Institutional Event'
          : 'Student-Organized Event',
      format: b.format || 'Offline',
      startDateISO: String(b.startDateISO || addDaysISO(7)),
      endDateISO: String(b.endDateISO || b.startDateISO || addDaysISO(7)),
      startTime: String(b.startTime || '5:00 PM'),
      endTime: String(b.endTime || '7:00 PM'),
      venue: String(b.venue || 'Lecture Hall Complex'),
      onlineMeetingInfo: b.onlineMeetingInfo || undefined,
      externalUrl: b.externalUrl || undefined,
      registrationDeadlineISO: String(b.registrationDeadlineISO || `${addDaysISO(6)}T23:59:00.000Z`),
      eligibility: String(b.eligibility || 'Open to enrolled students'),
      participationMode: b.participationMode || 'Individual',
      minTeamSize: Number(b.minTeamSize) || 1,
      maxTeamSize: Number(b.maxTeamSize) || 4,
      maxSeats: Number(b.maxSeats) || 100,
      entryFeeInr: Number(b.entryFeeInr) || 0,
      requiresApproval: Boolean(b.requiresApproval),
      requiredQuestions: Array.isArray(b.requiredQuestions) ? b.requiredQuestions.filter(Boolean) : [],
      schedule: Array.isArray(b.schedule) ? b.schedule : [],
      speakers: Array.isArray(b.speakers) ? b.speakers : [],
      organizingTeam: Array.isArray(b.organizingTeam) ? b.organizingTeam : [],
      rules: Array.isArray(b.rules) ? b.rules.filter(Boolean) : [],
      requiredMaterials: Array.isArray(b.requiredMaterials) ? b.requiredMaterials.filter(Boolean) : [],
      faqs: Array.isArray(b.faqs) ? b.faqs : [],
      status: desiredStatus,
      isFeatured: false,
      announcements: [],
      createdById: userId,
      createdAt: new Date().toISOString(),
    };

    db.events.unshift(ev);
    saveDb(db);
    return res.status(201).json({ event: ev });
  });

  app.patch('/api/events-clubs/events/:id', (req: Request, res: Response) => {
    const ev = db.events.find((e) => e.id === req.params.id);
    if (!ev) return res.status(404).json({ message: 'Event not found.' });
    const { userId, action, status, title, message, authorName } = req.body || {};
    if (!canManageEvent(db, String(userId || ''), ev)) {
      return res.status(403).json({ message: 'Only authorized event organizers can manage this event.' });
    }
    if (action === 'cancel') {
      ev.status = 'Cancelled';
    } else if (action === 'update-status' && status) {
      ev.status = status;
    } else if (action === 'announce' && title && message) {
      ev.announcements.unshift({
        id: `eann_${Date.now()}`,
        title: String(title).trim(),
        message: String(message).trim(),
        authorName: String(authorName || ev.organizerName),
        createdAt: new Date().toISOString(),
      });
    }
    saveDb(db);
    return res.json({ event: ev });
  });

  // 6. Toggle Saved Event
  app.post('/api/events-clubs/saved', (req: Request, res: Response) => {
    const { userId, eventId } = req.body || {};
    if (!userId || !eventId) return res.status(400).json({ message: 'userId and eventId are required.' });
    const list = db.savedEventIdsByUser[userId] || [];
    const exists = list.includes(eventId);
    db.savedEventIdsByUser[userId] = exists ? list.filter((i) => i !== eventId) : [...list, eventId];
    saveDb(db);
    return res.json({ savedEventIds: db.savedEventIdsByUser[userId] });
  });

  // 7. Register for Event (Individual or Team, Duplicate Prevention, Capacity Check)
  app.post('/api/events-clubs/events/:id/register', (req: Request, res: Response) => {
    const ev = db.events.find((e) => e.id === req.params.id);
    if (!ev) return res.status(404).json({ message: 'Event not found.' });
    if (ev.status === 'Cancelled' || ev.status === 'Completed') {
      return res.status(400).json({ message: 'Registration is closed for this event.' });
    }
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !String(b.studentName || '').trim() || !String(b.email || '').trim()) {
      return res.status(400).json({ message: 'Authenticated student profile details are required.' });
    }

    const dup = db.registrations.find(
      (r) =>
        r.eventId === ev.id &&
        r.userId === userId &&
        r.status !== 'Cancelled' &&
        r.status !== 'Rejected'
    );
    if (dup) {
      return res.status(400).json({
        message: 'Duplicate registration prevented: you already have an active registration for this event.',
      });
    }

    const confirmedCount = db.registrations.filter(
      (r) => r.eventId === ev.id && r.status === 'Confirmed'
    ).length;

    let finalStatus: EventRegistration['status'] = 'Confirmed';
    if (ev.requiresApproval) {
      finalStatus = 'Registration Pending';
    } else if (confirmedCount >= ev.maxSeats) {
      finalStatus = 'Waitlisted';
    }

    let teamId: string | undefined;
    let teamName: string | undefined;
    if (b.participationType === 'Team') {
      if (!String(b.teamName || '').trim()) {
        return res.status(400).json({ message: 'Team name is required for team participation.' });
      }
      const members = Array.isArray(b.teamMembers) ? b.teamMembers : [];
      const createdTeam: EventTeam = {
        id: `team_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        eventId: ev.id,
        teamName: String(b.teamName).trim(),
        leaderId: userId,
        leaderName: String(b.studentName),
        members: [
          {
            userId,
            name: String(b.studentName),
            email: String(b.email),
            role: 'Leader',
            inviteStatus: 'Accepted',
          },
          ...members.map((m: { name: string; email: string }) => ({
            name: String(m.name || '').trim(),
            email: String(m.email || '').trim(),
            role: 'Member' as const,
            inviteStatus: 'Pending' as const,
          })),
        ],
        createdAt: new Date().toISOString(),
      };
      db.teams.unshift(createdTeam);
      teamId = createdTeam.id;
      teamName = createdTeam.teamName;
    }

    const reg: EventRegistration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referenceCode: `KMP-REG-${Math.floor(100000 + Math.random() * 899999)}`,
      eventId: ev.id,
      userId,
      studentName: String(b.studentName).trim(),
      kampusIdRef: b.kampusIdRef ? String(b.kampusIdRef) : undefined,
      college: String(b.college || ev.college),
      course: String(b.course || ''),
      department: String(b.department || ''),
      email: String(b.email).trim(),
      contactInfo: b.contactInfo ? String(b.contactInfo).trim() : undefined,
      participationType: b.participationType === 'Team' ? 'Team' : 'Individual',
      teamId,
      teamName,
      answers: b.answers || {},
      status: finalStatus,
      checkInStatus: 'Not Checked In',
      registeredAt: new Date().toISOString(),
    };

    db.registrations.unshift(reg);
    saveDb(db);
    return res.status(201).json({ registration: reg, teams: db.teams });
  });

  // 8. Cancel Registration (Student) OR Approve/Waitlist/Reject (Organizer)
  app.patch('/api/events-clubs/registrations/:id', (req: Request, res: Response) => {
    const reg = db.registrations.find((r) => r.id === req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found.' });
    const ev = db.events.find((e) => e.id === reg.eventId);
    const { userId, status } = req.body || {};

    if (status === 'Cancelled') {
      if (reg.userId !== userId && (!ev || !canManageEvent(db, String(userId || ''), ev))) {
        return res.status(403).json({ message: 'Not authorized to cancel this registration.' });
      }
      reg.status = 'Cancelled';
      saveDb(db);
      return res.json({ registration: reg });
    }

    if (!ev || !canManageEvent(db, String(userId || ''), ev)) {
      return res.status(403).json({ message: 'Only event organizers can approve or update registrations.' });
    }
    if (['Confirmed', 'Waitlisted', 'Rejected'].includes(status)) {
      reg.status = status;
      saveDb(db);
    }
    return res.json({ registration: reg });
  });

  // 9. Team Member Invitation Response
  app.post('/api/events-clubs/teams/:teamId/respond', (req: Request, res: Response) => {
    const team = db.teams.find((t) => t.id === req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    const { memberEmail, decision } = req.body || {};
    const m = team.members.find(
      (mem) => mem.email.toLowerCase() === String(memberEmail || '').toLowerCase()
    );
    if (!m) return res.status(404).json({ message: 'Invitation not found.' });
    m.inviteStatus = decision === 'Rejected' ? 'Rejected' : 'Accepted';
    saveDb(db);
    return res.json({ team });
  });

  // 10. Rotating Secure Event Check-In QR Credential (90s TTL) & Organizer Verification
  app.get('/api/events-clubs/registrations/:id/qr-token', (req: Request, res: Response) => {
    const reg = db.registrations.find((r) => r.id === req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found.' });
    const userId = String(req.query.userId || '');
    if (reg.userId !== userId) {
      return res.status(403).json({ message: 'Only the ticket holder can generate this QR pass.' });
    }
    if (reg.status !== 'Confirmed') {
      return res.status(400).json({ message: 'QR check-in credential requires Confirmed registration.' });
    }
    const exp = Date.now() + 90_000;
    const nonce = crypto.randomBytes(6).toString('hex');
    const token = signEventQrToken({
      regId: reg.id,
      eventId: reg.eventId,
      userId: reg.userId,
      nonce,
      exp,
    });
    return res.json({ token, expiresAt: new Date(exp).toISOString() });
  });

  app.post('/api/events-clubs/events/:eventId/checkin', (req: Request, res: Response) => {
    const ev = db.events.find((e) => e.id === req.params.eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found.' });
    const { userId, token } = req.body || {};
    if (!canManageEvent(db, String(userId || ''), ev)) {
      return res.status(403).json({ message: 'Only event organizers can verify attendance.' });
    }

    const parsed = verifyEventQrToken(String(token || ''));
    if (!parsed.valid || !parsed.payload) {
      return res.status(400).json({
        checkInStatus: 'Invalid Credential',
        message: parsed.expired
          ? 'Expired QR credential — ask participant to tap Refresh QR instead of using a static screenshot.'
          : 'Invalid Credential: failed cryptographic verification.',
      });
    }

    if (parsed.payload.eventId !== ev.id) {
      return res.status(400).json({
        checkInStatus: 'Invalid Credential',
        message: 'Invalid Credential: QR pass belongs to a different event.',
      });
    }

    if (db.usedCheckInNonces.includes(parsed.payload.nonce)) {
      return res.status(400).json({
        checkInStatus: 'Already Used',
        message: 'Already Used: this rotating QR nonce was already scanned.',
      });
    }

    const reg = db.registrations.find((r) => r.id === parsed.payload!.regId);
    if (!reg || reg.status !== 'Confirmed') {
      return res.status(400).json({
        checkInStatus: 'Invalid Credential',
        message: 'Registration is not confirmed.',
      });
    }

    if (reg.checkInStatus === 'Checked In') {
      return res.status(400).json({
        checkInStatus: 'Already Used',
        message: `Already Used: ${reg.studentName} checked in at ${reg.checkedInAt}.`,
      });
    }

    reg.checkInStatus = 'Checked In';
    reg.checkedInAt = new Date().toISOString();
    reg.checkedInBy = String(userId);
    db.usedCheckInNonces.push(parsed.payload.nonce);
    saveDb(db);
    return res.json({
      checkInStatus: 'Checked In',
      registration: reg,
      message: `${reg.studentName} checked in successfully.`,
    });
  });

  // 11. Certificate Issuance, Public Verification & PDF Download
  app.post('/api/events-clubs/events/:eventId/certificates', (req: Request, res: Response) => {
    const ev = db.events.find((e) => e.id === req.params.eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found.' });
    const { userId, recipientUserId, recipientName, certificateType, issuedBy } = req.body || {};
    if (!canManageEvent(db, String(userId || ''), ev)) {
      return res.status(403).json({ message: 'Only authorized organizers can issue certificates.' });
    }
    if (!recipientUserId || !recipientName) {
      return res.status(400).json({ message: 'Recipient user and name are required.' });
    }
    const cert: EventCertificate = {
      id: `cert_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      certificateRef: `KMP-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`,
      eventId: ev.id,
      eventTitle: ev.title,
      organizerName: ev.organizerName,
      userId: String(recipientUserId),
      studentName: String(recipientName).trim(),
      certificateType: (certificateType as CertificateType) || 'Participation',
      issuedBy: String(issuedBy || ev.organizerName),
      issuedAt: new Date().toISOString(),
    };
    db.certificates.unshift(cert);
    saveDb(db);
    return res.status(201).json({ certificate: cert });
  });

  app.get('/api/events-clubs/certificates/verify/:ref', (req: Request, res: Response) => {
    const ref = String(req.params.ref || '').trim().toUpperCase();
    const cert = db.certificates.find((c) => c.certificateRef.toUpperCase() === ref);
    if (!cert) {
      return res.status(404).json({ valid: false, message: 'No issued certificate matches this reference.' });
    }
    return res.json({ valid: true, certificate: cert });
  });

  app.get('/api/events-clubs/certificates/:id/pdf', (req: Request, res: Response) => {
    const cert = db.certificates.find((c) => c.id === req.params.id);
    if (!cert) return res.status(404).send('Certificate not found');
    const pdf = buildCertificatePdf(cert);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateRef}.pdf"`);
    return res.send(pdf);
  });

  // 12. Club Membership Join / Request / Leave / Manage (RBAC Enforced)
  app.post('/api/events-clubs/clubs/:clubId/join', (req: Request, res: Response) => {
    const club = db.clubs.find((c) => c.id === req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found.' });
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !String(b.joinReason || '').trim()) {
      return res.status(400).json({ message: 'Please explain why you want to join this club.' });
    }
    const existing = db.memberships.find((m) => m.clubId === club.id && m.userId === userId);
    const status = club.visibility === 'Private' ? 'Request Pending' : 'Member';

    if (existing) {
      existing.status = status;
      existing.joinReason = String(b.joinReason).trim();
      existing.interests = Array.isArray(b.interests) ? b.interests : existing.interests;
      existing.skills = Array.isArray(b.skills) ? b.skills : existing.skills;
      existing.previousExperience = String(b.previousExperience || '');
      existing.portfolioUrl = b.portfolioUrl || undefined;
      existing.showInPublicMembers = b.showInPublicMembers !== false;
      existing.updatedAt = new Date().toISOString();
      saveDb(db);
      return res.json({ membership: existing });
    }

    const mem: ClubMembership = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      clubId: club.id,
      userId,
      studentName: String(b.studentName || 'Student'),
      course: String(b.course || ''),
      semester: String(b.semester || ''),
      role: 'Member',
      status,
      joinReason: String(b.joinReason).trim(),
      interests: Array.isArray(b.interests) ? b.interests : [],
      skills: Array.isArray(b.skills) ? b.skills : [],
      previousExperience: String(b.previousExperience || ''),
      portfolioUrl: b.portfolioUrl || undefined,
      showInPublicMembers: b.showInPublicMembers !== false,
      updatedAt: new Date().toISOString(),
    };
    db.memberships.unshift(mem);
    saveDb(db);
    return res.status(201).json({ membership: mem });
  });

  app.patch('/api/events-clubs/memberships/:id', (req: Request, res: Response) => {
    const mem = db.memberships.find((m) => m.id === req.params.id);
    if (!mem) return res.status(404).json({ message: 'Membership record not found.' });
    const { userId, action, role, status, showInPublicMembers } = req.body || {};

    if (action === 'leave' || action === 'accept-invite' || action === 'privacy') {
      if (mem.userId !== userId) {
        return res.status(403).json({ message: 'Only the member can update their membership.' });
      }
      if (action === 'leave') mem.status = 'Inactive';
      if (action === 'accept-invite') mem.status = 'Member';
      if (action === 'privacy') mem.showInPublicMembers = Boolean(showInPublicMembers);
      mem.updatedAt = new Date().toISOString();
      saveDb(db);
      return res.json({ membership: mem });
    }

    if (!canManageClub(db, String(userId || ''), mem.clubId)) {
      return res.status(403).json({ message: 'Club leadership permission required.' });
    }
    if (status) mem.status = status;
    if (role) mem.role = role as ClubRole;
    mem.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ membership: mem });
  });

  // 13. Club Management: Announcements, Activities, Gallery, Edit Club Info (RBAC Enforced)
  app.post('/api/events-clubs/clubs/:clubId/manage', (req: Request, res: Response) => {
    const club = db.clubs.find((c) => c.id === req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found.' });
    const b = req.body || {};
    const userId = String(b.userId || '');
    if (!canManageClub(db, userId, club.id)) {
      return res.status(403).json({ message: 'Unauthorized: Club Admin or Leadership role required.' });
    }

    if (b.action === 'edit-club') {
      if (b.description) club.description = String(b.description).trim();
      if (b.mission) club.mission = String(b.mission).trim();
      if (b.meetingSchedule) club.meetingSchedule = String(b.meetingSchedule).trim();
      saveDb(db);
      return res.json({ club });
    }

    if (b.action === 'add-announcement') {
      const ann: ClubAnnouncement = {
        id: `cann_${Date.now()}`,
        clubId: club.id,
        title: String(b.title || '').trim(),
        content: String(b.content || '').trim(),
        authorName: String(b.authorName || 'Club Leadership'),
        createdAt: new Date().toISOString(),
      };
      db.clubAnnouncements.unshift(ann);
      saveDb(db);
      return res.status(201).json({ announcement: ann });
    }

    if (b.action === 'add-activity') {
      const act: ClubActivity = {
        id: `cact_${Date.now()}`,
        clubId: club.id,
        title: String(b.title || '').trim(),
        description: String(b.description || '').trim(),
        dateISO: String(b.dateISO || addDaysISO(5)),
        location: String(b.location || 'Campus Venue'),
        kind: b.kind === 'Past' ? 'Past' : 'Upcoming',
        createdAt: new Date().toISOString(),
      };
      db.clubActivities.unshift(act);
      saveDb(db);
      return res.status(201).json({ activity: act });
    }

    if (b.action === 'add-gallery' && b.imageUrl) {
      const item: ClubGalleryItem = {
        id: `cgal_${Date.now()}`,
        clubId: club.id,
        caption: String(b.caption || 'Club Activity Photo').trim(),
        imageUrl: String(b.imageUrl),
        uploadedByName: String(b.authorName || 'Club Lead'),
        createdAt: new Date().toISOString(),
      };
      db.clubGallery.unshift(item);
      saveDb(db);
      return res.status(201).json({ galleryItem: item });
    }

    return res.status(400).json({ message: 'Invalid club management action.' });
  });

  // 14. Feedback & Safety Reports
  app.post('/api/events-clubs/feedback', (req: Request, res: Response) => {
    const { eventId, userId, studentName, rating, comment } = req.body || {};
    if (!eventId || !userId || !String(comment || '').trim()) {
      return res.status(400).json({ message: 'Feedback comment is required.' });
    }
    const fb: EventFeedback = {
      id: `efb_${Date.now()}`,
      eventId: String(eventId),
      userId: String(userId),
      studentName: String(studentName || 'Student'),
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: String(comment).trim(),
      createdAt: new Date().toISOString(),
    };
    db.feedback.unshift(fb);
    saveDb(db);
    return res.status(201).json({ feedback: fb });
  });

  app.post('/api/events-clubs/reports', (req: Request, res: Response) => {
    const { userId, userName, targetType, targetId, targetTitle, reason, details } = req.body || {};
    if (!userId || !targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Incomplete report payload.' });
    }
    const report: EventsClubsReport = {
      id: `ecrep_${Date.now()}`,
      reporterId: String(userId),
      reporterName: String(userName || 'Student'),
      targetType,
      targetId: String(targetId),
      targetTitle: String(targetTitle || 'Item'),
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
