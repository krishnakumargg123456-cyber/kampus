import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ModuleStorage } from '../database/moduleStorage.ts';
import type {
  AcademicDeadline,
  CampusAlert,
  CampusAnnouncement,
  CampusDepartment,
  CampusInstitution,
  CampusPoll,
  CampusPulseRole,
  FacilityUpdate,
  LostFoundPost,
  PublisherRecord,
  PulseAnalyticsSnapshot,
  PulseCategoryId,
  PulseNotificationPrefs,
  PulseReport,
  ReadingHistoryItem,
  StudentSubmission,
} from '../src/types/campusPulse.ts';

interface StoredPulseFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Data: string;
  uploadedBy: string;
  createdAt: string;
}

interface CampusPulseDatabase {
  institutions: CampusInstitution[];
  departments: CampusDepartment[];
  announcements: CampusAnnouncement[];
  alerts: CampusAlert[];
  deadlines: AcademicDeadline[];
  facilities: FacilityUpdate[];
  lostFound: LostFoundPost[];
  polls: CampusPoll[];
  submissions: StudentSubmission[];
  reports: PulseReport[];
  publishers: PublisherRecord[];
  activeRoleOverrideByUser: Record<
    string,
    { role: CampusPulseRole; assignedDepartmentId?: string; staffTitle?: string }
  >;
  selectedInstitutionByUser: Record<string, string>;
  savedNoticesByUser: Record<string, string[]>;
  savedDeadlinesByUser: Record<string, string[]>;
  followedDeptsByUser: Record<string, string[]>;
  readingHistoryByUser: Record<string, ReadingHistoryItem[]>;
  notificationPrefsByUser: Record<string, PulseNotificationPrefs>;
  files: Record<string, StoredPulseFile>;
}

const DB_FILE = path.join(process.cwd(), '.kampus_campus_pulse_db.json');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const DEFAULT_NOTIF_PREFS: PulseNotificationPrefs = {
  officialNotices: true,
  examAlerts: true,
  upcomingDeadlines: true,
  departmentUpdates: true,
  classChanges: true,
  facilityDisruptions: true,
  pollReminders: true,
  moderationUpdates: true,
};

const STAFF_PASSKEYS: Record<
  string,
  { role: CampusPulseRole; assignedDepartmentId?: string; staffTitle: string }
> = {
  'IITB-REG-2026': {
    role: 'Institutional Admin',
    staffTitle: 'Office of the Academic Registrar',
  },
  'IITB-CSE-2026': {
    role: 'Department Admin',
    assignedDepartmentId: 'dept_cse',
    staffTitle: 'Department Coordinator · CSE',
  },
  'IITB-PUB-2026': {
    role: 'Authorized Publisher',
    assignedDepartmentId: 'dept_services',
    staffTitle: 'Campus Facilities & Library Desk',
  },
};

function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hoursAgoISO(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function escapePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLines(text: string, maxLen = 78): string[] {
  const paragraphs = text.split(/\n+/);
  const out: string[] = [];
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push('');
      continue;
    }
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > maxLen) {
        if (line) out.push(line);
        line = w;
      } else {
        line = line ? `${line} ${w}` : w;
      }
    }
    if (line) out.push(line);
    out.push('');
  }
  return out;
}

function generateNoticePdfBuffer(notice: CampusAnnouncement, institutionName: string): Buffer {
  const headerLines = [
    institutionName.toUpperCase(),
    `OFFICIAL CIRCULAR REFERENCE: ${notice.circularCode || notice.id.toUpperCase()}`,
    `Issuing Authority: ${notice.publishingAuthority}`,
    `Department: ${notice.departmentName}`,
    `Published: ${new Date(notice.publishedAt).toDateString()}${
      notice.deadlineAt ? `   |   Deadline: ${new Date(notice.deadlineAt).toDateString()}` : ''
    }`,
    '------------------------------------------------------------------------------',
    notice.title,
    '',
  ];
  const bodyLines = wrapLines(notice.content, 76);
  const allLines = [...headerLines, ...bodyLines].slice(0, 44);

  const ops: string[] = ['BT', '/F1 10 Tf', '50 760 Td', '14 TL'];
  allLines.forEach((line, idx) => {
    const safe = escapePdfText(line);
    if (idx === 0) {
      ops.push(`/F2 12 Tf (${safe}) Tj T* /F1 10 Tf`);
    } else if (idx === 6) {
      ops.push(`/F2 11 Tf (${safe}) Tj T* /F1 10 Tf`);
    } else {
      ops.push(`(${safe}) Tj T*`);
    }
  });
  ops.push('ET');

  const streamContent = ops.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(streamContent, 'utf8')} >> stream\n${streamContent}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj + '\n';
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function createSeedDatabase(): CampusPulseDatabase {
  const institutions: CampusInstitution[] = [
    {
      id: 'inst_iitb',
      name: 'Indian Institute of Technology, Bombay',
      shortName: 'IIT Bombay',
      location: 'Powai, Mumbai, Maharashtra',
      institutionType: 'Autonomous Public Technical University',
      verificationStatus: 'Self-Described Directory Entry',
      verificationNote:
        'Published notices below use manual authorized campus entries in KAMPUS rather than an automated external university ERP feed.',
      description:
        'Centralized campus circulars, examination office schedules, departmental announcements, and verified facility updates.',
      academicSession: 'Autumn Semester 2026',
    },
    {
      id: 'inst_dtu',
      name: 'Delhi Technological University',
      shortName: 'DTU Delhi',
      location: 'Rohini, New Delhi',
      institutionType: 'State Technical University',
      verificationStatus: 'Self-Described Directory Entry',
      verificationNote:
        'Manual authorized campus entries in KAMPUS. Official university portal verification is required for live ERP sync.',
      description:
        'Academic schedules, registrar circulars, campus services, and student community notices.',
      academicSession: 'Odd Semester 2026',
    },
  ];

  const departments: CampusDepartment[] = [
    {
      id: 'dept_acad',
      institutionId: 'inst_iitb',
      code: 'ACAD-REG',
      name: 'Academic & Examination Office',
      description:
        'Handles semester course registration, examination timetables, hall tickets, grade moderation, and academic calendar revisions.',
      officeLocation: 'Main Building, 1st Floor, Academic Section',
      officeHours: 'Mon - Fri · 9:30 AM - 5:30 PM',
      restrictedPolicyNote: 'Internal grade-audit circulars require Registrar authorization.',
    },
    {
      id: 'dept_cse',
      institutionId: 'inst_iitb',
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description:
        'B.Tech, Dual Degree, and M.Tech coursework schedules, Systems Lab schedules, seminar series, and capstone reviews.',
      officeLocation: 'Kanwal Rekhi Building (KReSIT), 2nd Floor',
      officeHours: 'Mon - Fri · 9:30 AM - 5:00 PM',
      restrictedPolicyNote: 'Lab server credential advisories are restricted to enrolled CSE students.',
    },
    {
      id: 'dept_ee',
      institutionId: 'inst_iitb',
      code: 'EE',
      name: 'Electrical Engineering',
      description:
        'Undergraduate circuits & signal processing labs, faculty office hours, and department colloquia.',
      officeLocation: 'Electrical Engineering Annex, Ground Floor',
      officeHours: 'Mon - Fri · 10:00 AM - 5:00 PM',
      restrictedPolicyNote: 'High-voltage lab safety clearances apply before equipment booking.',
    },
    {
      id: 'dept_services',
      institutionId: 'inst_iitb',
      code: 'INFRA',
      name: 'Central Library & Campus Services',
      description:
        'Central Library schedule changes, hostel administration updates, shuttle timetables, and campus maintenance advisories.',
      officeLocation: 'Central Library & Estate Office Wing',
      officeHours: 'Mon - Sat · 9:00 AM - 6:00 PM',
      restrictedPolicyNote: 'Facility notices list verified office sources and update timestamps.',
    },
    {
      id: 'dept_dtu_cse',
      institutionId: 'inst_dtu',
      code: 'DTU-CSE',
      name: 'Computer Engineering Department',
      description:
        'DTU Computer Engineering academic circulars, practical viva schedules, and registration notices.',
      officeLocation: 'Academic Block, 3rd Floor',
      officeHours: 'Mon - Fri · 9:30 AM - 5:00 PM',
      restrictedPolicyNote: 'Faculty-only rubric memos are restricted.',
    },
  ];

  const announcements: CampusAnnouncement[] = [
    {
      id: 'ann_midsem_schedule',
      institutionId: 'inst_iitb',
      circularCode: 'ACAD/EXAM/2026-41',
      title: 'Autumn Mid-Semester Examination Seating & Admit Card Instructions',
      summary:
        'Admit card downloads open on the academic portal; carry physical Institute ID cards 20 minutes prior to morning and afternoon shifts.',
      content:
        'All undergraduate and postgraduate students registered for Autumn Semester 2026 courses are informed that Mid-Semester Examinations will begin next week across Lecture Hall Complex (LHC 101-304) and Main Building Examination Halls.\n\n1. Eligibility & Admit Cards: Students with cleared fee registration and minimum required course registration status can download their stamped digital admit card.\n2. Required Documents: Carry both your printed Admit Card and valid Institute Photo ID Card. Digital screenshots without photo ID are not permitted inside exam halls.\n3. Seating Allocation: Room numbers are mapped strictly by Enrollment Number suffix and published in Attachment Circular ACAD/EXAM/2026-41.\n4. Prohibited Items: Programmable calculators unless explicitly approved by the course instructor, smartwatches, and mobile phones must remain in designated hall bags.',
      categoryId: 'examination-updates',
      subcategory: 'Admit card announcements',
      departmentId: 'dept_acad',
      departmentName: 'Academic & Examination Office',
      targetSemester: 'Semester 6',
      authorId: 'adm_registrar_iitb',
      authorName: 'Office of the Academic Registrar',
      authorRole: 'Institutional Admin',
      publishingAuthority: 'Academic & Examination Section, IIT Bombay',
      isOfficial: true,
      verificationLabel: 'Authorized Institutional Notice',
      status: 'Urgent',
      priority: 'Critical',
      isPinned: true,
      publishedAt: hoursAgoISO(2),
      deadlineAt: `${daysFromNowISO(4)}T17:00:00.000Z`,
      attachments: [
        {
          id: 'att_circular_exam41',
          fileName: 'ACAD_EXAM_2026_41_Instructions.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 4280,
          url: '/api/campus-pulse/circular-pdf/ann_midsem_schedule',
          kind: 'pdf',
        },
      ],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
    {
      id: 'ann_course_drop',
      institutionId: 'inst_iitb',
      circularCode: 'REG/2026-19',
      title: 'Last Date for Elective Course Adjustment & Credit Audit Registration',
      summary:
        'Semester 5-8 students opting to convert an elective to Audit or drop an extra elective must submit faculty advisor approval before Friday 5:00 PM.',
      content:
        'Students wishing to modify credit/audit status or drop an optional minor/honours elective for Autumn Semester 2026 must submit the signed Credit Adjustment Request via their Faculty Advisor.\n\nRequired Steps:\n- Verify minimum semester credit floor (18 credits for regular B.Tech students).\n- Obtain instructor endorsement if attendance is below 80%.\n- Late submissions after the portal window closes will not be processed retroactively.',
      categoryId: 'admission-registration',
      subcategory: 'Course registration',
      departmentId: 'dept_acad',
      departmentName: 'Academic & Examination Office',
      targetCourse: 'B.Tech',
      targetSemester: 'Semester 6',
      authorId: 'adm_registrar_iitb',
      authorName: 'Office of the Academic Registrar',
      authorRole: 'Institutional Admin',
      publishingAuthority: 'Academic Registration Desk, IIT Bombay',
      isOfficial: true,
      verificationLabel: 'Authorized Institutional Notice',
      status: 'Important',
      priority: 'High',
      isPinned: true,
      publishedAt: hoursAgoISO(7),
      deadlineAt: `${daysFromNowISO(3)}T17:00:00.000Z`,
      attachments: [
        {
          id: 'att_circular_reg19',
          fileName: 'Credit_Adjustment_Circular_2026.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 3940,
          url: '/api/campus-pulse/circular-pdf/ann_course_drop',
          kind: 'pdf',
        },
      ],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
    {
      id: 'ann_cse_cs304_reschedule',
      institutionId: 'inst_iitb',
      circularCode: 'CSE/ACAD/2026-08',
      title: 'CS-304 DBMS Lab Batch B2 Rescheduled to Thursday Afternoon',
      summary:
        'Due to scheduled UPS firmware maintenance in KReSIT Systems Lab 2, CS-304 Lab Batch B2 shifts from Wednesday 2:00 PM to Thursday 4:00 PM this week only.',
      content:
        'All Semester 6 CSE students enrolled in CS-304 (Database Management Systems) Lab Batch B2 should note that the Wednesday 2:00 PM practical slot is rescheduled to Thursday, 4:00 PM - 6:00 PM in Software Lab 1, KReSIT Building.\n\nTeaching Assistants will evaluate Assignment 3 (B+ Tree & Indexing) during the rescheduled slot. Please upload SQL scripts before Thursday 3:30 PM.',
      categoryId: 'academic-updates',
      subcategory: 'Practical and laboratory updates',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      targetCourse: 'B.Tech in Computer Science & AI',
      targetSemester: 'Semester 6',
      authorId: 'adm_cse_iitb',
      authorName: 'Prof. Arvind Kulkarni (CSE Office)',
      authorRole: 'Department Admin',
      publishingAuthority: 'Department of Computer Science & Engineering',
      isOfficial: true,
      verificationLabel: 'Authorized Department Notice',
      status: 'New',
      priority: 'High',
      isPinned: false,
      publishedAt: hoursAgoISO(11),
      deadlineAt: `${daysFromNowISO(2)}T15:30:00.000Z`,
      attachments: [
        {
          id: 'att_circular_cse08',
          fileName: 'CSE_Lab_Reschedule_Notice.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 3610,
          url: '/api/campus-pulse/circular-pdf/ann_cse_cs304_reschedule',
          kind: 'pdf',
        },
      ],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
    {
      id: 'ann_library_extended_hours',
      institutionId: 'inst_iitb',
      circularCode: 'LIB/2026-14',
      title: 'Central Library Reading Halls Extended Until 2:00 AM During Mid-Sem Weeks',
      summary:
        'Reading Halls 1 and 2 in the Central Library remain open until 2:00 AM for two weeks ahead of Mid-Semester examinations.',
      content:
        'To support students preparing for Mid-Semester Examinations, Central Library Reading Halls 1 & 2 will stay open from 8:00 AM to 2:00 AM daily starting tomorrow for a 14-day period.\n\nBook circulation counters continue regular hours (9:00 AM to 8:00 PM). Valid Institute ID card verification at the main desk is mandatory after 10:00 PM.',
      categoryId: 'facility-updates',
      subcategory: 'Library announcements',
      departmentId: 'dept_services',
      departmentName: 'Central Library & Campus Services',
      authorId: 'pub_library_iitb',
      authorName: 'Central Library Desk',
      authorRole: 'Authorized Publisher',
      publishingAuthority: 'Central Library Administration',
      isOfficial: true,
      verificationLabel: 'Authorized Department Notice',
      status: 'New',
      priority: 'Normal',
      isPinned: false,
      publishedAt: hoursAgoISO(16),
      attachments: [],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
    {
      id: 'ann_robotics_solar_grant',
      institutionId: 'inst_iitb',
      circularCode: 'NEWS/2026-22',
      title: 'Undergraduate Autonomous Microgrid Research Team Selected for National Finals',
      summary:
        'A 5-student interdisciplinary team from EE and CSE qualified for the National Smart Grid Innovation Showcase.',
      content:
        'An interdisciplinary student group from Electrical Engineering and Computer Science & Engineering has advanced to the national finals with their campus microgrid forecasting prototype.\n\nDepartment demonstration sessions will be held at the EE Seminar Room next Tuesday at 4:30 PM.',
      categoryId: 'campus-news',
      subcategory: 'Student achievements',
      departmentId: 'dept_ee',
      departmentName: 'Electrical Engineering',
      authorId: 'adm_registrar_iitb',
      authorName: 'Campus Communications Desk',
      authorRole: 'Institutional Admin',
      publishingAuthority: 'Office of Student & Public Relations',
      isOfficial: true,
      verificationLabel: 'Authorized Institutional Notice',
      status: 'New',
      priority: 'Informational',
      isPinned: false,
      publishedAt: hoursAgoISO(24),
      attachments: [],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
    {
      id: 'ann_cse_restricted_ssh',
      institutionId: 'inst_iitb',
      circularCode: 'CSE/INT/2026-03',
      title: 'CSE Departmental Compute Cluster Maintenance & VPN Whitelist Policy',
      summary:
        'Internal notice for CSE department faculty and enrolled CSE students regarding scheduled cluster key rotation.',
      content:
        'CSE Departmental GPU/CPU cluster login nodes will undergo OpenSSH key-policy upgrades this Saturday between 11:00 PM and 2:00 AM. Enrolled CSE project students must regenerate Ed25519 keys using the departmental guide.',
      categoryId: 'official-notices',
      subcategory: 'Important instructions',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      targetCourse: 'B.Tech in Computer Science & AI',
      authorId: 'adm_cse_iitb',
      authorName: 'CSE Systems Committee',
      authorRole: 'Department Admin',
      publishingAuthority: 'Department of Computer Science & Engineering',
      isOfficial: true,
      verificationLabel: 'Authorized Department Notice',
      status: 'Important',
      priority: 'Normal',
      isPinned: false,
      isRestricted: true,
      restrictedAudienceLabel: 'Computer Science & Engineering students & faculty',
      publishedAt: hoursAgoISO(30),
      attachments: [],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
    {
      id: 'ann_archived_convocation',
      institutionId: 'inst_iitb',
      circularCode: 'REG/2026-02',
      title: 'Spring Semester Academic Standing & Re-registration Circular (Archived)',
      summary:
        'Archived reference circular covering previous semester academic standing guidelines and fee clearance steps.',
      content:
        'This notice is retained for archival reference only. All Spring Semester deadlines referenced in REG/2026-02 have concluded.',
      categoryId: 'official-notices',
      subcategory: 'Institutional circulars',
      departmentId: 'dept_acad',
      departmentName: 'Academic & Examination Office',
      authorId: 'adm_registrar_iitb',
      authorName: 'Office of the Academic Registrar',
      authorRole: 'Institutional Admin',
      publishingAuthority: 'Academic & Examination Section, IIT Bombay',
      isOfficial: true,
      verificationLabel: 'Authorized Institutional Notice',
      status: 'Archived',
      priority: 'Informational',
      isPinned: false,
      publishedAt: hoursAgoISO(480),
      attachments: [],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
    {
      id: 'ann_student_book_swap',
      institutionId: 'inst_iitb',
      title: 'Student-Organized Used Textbooks Desk Outside LHC Foyer',
      summary:
        'Approved student update: Senior semester students are coordinating a textbook hand-me-down desk near LHC Ground Foyer.',
      content:
        'Approved student notice (unverified by Academic Office): Third- and fourth-year students are coordinating textbook hand-offs for CS-213, MA-106, and EE-101 between 5:00 PM and 6:30 PM on Friday outside Lecture Hall Complex.',
      categoryId: 'student-information',
      subcategory: 'Student-submitted campus information',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      authorId: 'stu_peer_rohan',
      authorName: 'Rohan Nair',
      authorRole: 'Student',
      publishingAuthority: 'Student Community Submission (Moderated)',
      isOfficial: false,
      verificationLabel: 'Approved Student Submission',
      status: 'New',
      priority: 'Informational',
      isPinned: false,
      publishedAt: hoursAgoISO(14),
      attachments: [],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
    {
      id: 'ann_dtu_exam',
      institutionId: 'inst_dtu',
      circularCode: 'DTU/EXAM/2026-11',
      title: 'Odd Semester Mid-Term Theory Examination Date Sheet Published',
      summary:
        'Revised date sheet for B.Tech 3rd, 5th, and 7th semester theory examinations published by Controller of Examinations.',
      content:
        'Students of B.Tech 3rd, 5th, and 7th Semesters are advised to verify their registered subject codes against the published date sheet and report any clash to the Examination Branch within 48 hours.',
      categoryId: 'examination-updates',
      subcategory: 'Examination schedules',
      departmentId: 'dept_dtu_cse',
      departmentName: 'Computer Engineering Department',
      authorId: 'adm_registrar_iitb',
      authorName: 'DTU Examination Office',
      authorRole: 'Institutional Admin',
      publishingAuthority: 'Controller of Examinations, DTU',
      isOfficial: true,
      verificationLabel: 'Authorized Institutional Notice',
      status: 'Important',
      priority: 'High',
      isPinned: true,
      publishedAt: hoursAgoISO(5),
      deadlineAt: `${daysFromNowISO(5)}T16:00:00.000Z`,
      attachments: [
        {
          id: 'att_dtu_exam11',
          fileName: 'DTU_OddSem_Datesheet_2026.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 3820,
          url: '/api/campus-pulse/circular-pdf/ann_dtu_exam',
          kind: 'pdf',
        },
      ],
      viewCount: 0,
      moderationStatus: 'Approved',
    },
  ];

  const alerts: CampusAlert[] = [
    {
      id: 'alt_admit_card',
      institutionId: 'inst_iitb',
      alertType: 'Examination deadline',
      title: 'Mid-Semester Admit Card Verification Closes in 4 Days',
      priority: 'Critical',
      description:
        'Download and print your Mid-Semester Admit Card before exam halls lock seating rosters. Carry valid Institute ID card.',
      publishingSource: 'Academic & Examination Office',
      departmentName: 'Academic & Examination Office',
      publishedAt: hoursAgoISO(2),
      expiresAt: `${daysFromNowISO(4)}T17:00:00.000Z`,
      isOfficial: true,
      relatedAnnouncementId: 'ann_midsem_schedule',
    },
    {
      id: 'alt_cs304_reschedule',
      institutionId: 'inst_iitb',
      alertType: 'Schedule changes',
      title: 'CS-304 DBMS Lab Batch B2 Shifted to Thursday 4:00 PM',
      priority: 'High',
      description:
        'Temporary single-week shift to KReSIT Software Lab 1 due to scheduled UPS maintenance in Systems Lab 2.',
      publishingSource: 'Computer Science & Engineering',
      departmentName: 'Computer Science & Engineering',
      publishedAt: hoursAgoISO(11),
      expiresAt: `${daysFromNowISO(3)}T18:00:00.000Z`,
      isOfficial: true,
      relatedAnnouncementId: 'ann_cse_cs304_reschedule',
    },
    {
      id: 'alt_water_hostel',
      institutionId: 'inst_iitb',
      alertType: 'Facility disruption',
      title: 'Hostel 12-16 Tank Cleaning: Scheduled Water Shutoff (2:00 PM - 4:30 PM)',
      priority: 'Normal',
      description:
        'Routine overhead tank cleaning scheduled on Sunday afternoon by Estate Maintenance Wing. Normal supply resumes at 4:30 PM.',
      publishingSource: 'Central Library & Campus Services',
      departmentName: 'Central Library & Campus Services',
      publishedAt: hoursAgoISO(19),
      expiresAt: `${daysFromNowISO(2)}T16:30:00.000Z`,
      isOfficial: true,
    },
    {
      id: 'alt_scholarship_info',
      institutionId: 'inst_iitb',
      alertType: 'Important administrative update',
      title: 'Merit-cum-Means Scholarship Renewal Portal Open',
      priority: 'Informational',
      description:
        'Eligible students may upload current semester income and registration documents for scholarship renewal review.',
      publishingSource: 'Academic & Examination Office',
      departmentName: 'Academic & Examination Office',
      publishedAt: hoursAgoISO(28),
      expiresAt: `${daysFromNowISO(12)}T23:59:00.000Z`,
      isOfficial: true,
    },
  ];

  const deadlines: AcademicDeadline[] = [
    {
      id: 'dl_cs304_assign',
      institutionId: 'inst_iitb',
      title: 'CS-304 Assignment 3 SQL Script Upload',
      kind: 'Assignment',
      dateISO: daysFromNowISO(2),
      timeLabel: '3:30 PM',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      targetSemester: 'Semester 6',
      description: 'Submit B+ Tree & Indexing lab scripts prior to rescheduled Batch B2 evaluation.',
      source: 'Department of Computer Science & Engineering',
      isConfirmedOfficial: true,
      relatedAnnouncementId: 'ann_cse_cs304_reschedule',
    },
    {
      id: 'dl_elective_drop',
      institutionId: 'inst_iitb',
      title: 'Elective Drop / Credit-to-Audit Request Deadline',
      kind: 'Registration',
      dateISO: daysFromNowISO(3),
      timeLabel: '5:00 PM',
      departmentId: 'dept_acad',
      departmentName: 'Academic & Examination Office',
      targetSemester: 'Semester 6',
      description: 'Faculty advisor endorsed credit adjustment requests close on the academic portal.',
      source: 'Academic & Examination Office',
      isConfirmedOfficial: true,
      relatedAnnouncementId: 'ann_course_drop',
    },
    {
      id: 'dl_midsem_start',
      institutionId: 'inst_iitb',
      title: 'Mid-Semester Examinations Commence',
      kind: 'Examination',
      dateISO: daysFromNowISO(4),
      timeLabel: '9:30 AM',
      departmentId: 'dept_acad',
      departmentName: 'Academic & Examination Office',
      targetSemester: 'Semester 6',
      description: 'Morning and afternoon examination shifts across LHC and Main Building halls.',
      source: 'Academic & Examination Section (Circular ACAD/EXAM/2026-41)',
      isConfirmedOfficial: true,
      relatedAnnouncementId: 'ann_midsem_schedule',
    },
    {
      id: 'dl_ee_colloquium',
      institutionId: 'inst_iitb',
      title: 'Microgrid Showcase & Department Seminar',
      kind: 'Academic Event',
      dateISO: daysFromNowISO(6),
      timeLabel: '4:30 PM',
      departmentId: 'dept_ee',
      departmentName: 'Electrical Engineering',
      description: 'Student research prototype showcase at EE Seminar Room.',
      source: 'Electrical Engineering Office',
      isConfirmedOfficial: true,
      relatedAnnouncementId: 'ann_robotics_solar_grant',
    },
    {
      id: 'dl_project_proposal_tentative',
      institutionId: 'inst_iitb',
      title: 'B.Tech Capstone Stage-1 Abstract Submission (Tentative)',
      kind: 'Semester Date',
      dateISO: daysFromNowISO(14),
      timeLabel: '5:00 PM',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      targetSemester: 'Semester 6',
      description: 'Provisional window pending final department UG coordinator confirmation.',
      source: 'CSE UG Coordinator (Tentative Notice)',
      isConfirmedOfficial: false,
    },
    {
      id: 'dl_holiday',
      institutionId: 'inst_iitb',
      title: 'Institute Gazetted Holiday — Campus Academic Offices Closed',
      kind: 'Holiday',
      dateISO: daysFromNowISO(10),
      timeLabel: 'All Day',
      departmentId: 'dept_acad',
      departmentName: 'Academic & Examination Office',
      description: 'No scheduled theory classes or administrative counters; Central Library reading halls follow holiday schedule.',
      source: 'Institute Academic Calendar 2026',
      isConfirmedOfficial: true,
    },
  ];

  const facilities: FacilityUpdate[] = [
    {
      id: 'fac_library',
      institutionId: 'inst_iitb',
      facilityCategory: 'Library',
      facilityName: 'Central Library & Reading Halls',
      title: 'Extended Mid-Semester Reading Hall Hours (8:00 AM - 2:00 AM)',
      details:
        'Reading Halls 1 & 2 operate on extended pre-exam schedule until 2:00 AM. Book issue/return desk remains 9:00 AM - 8:00 PM Monday to Saturday.',
      operatingInfo: 'Reading Halls: 8:00 AM - 2:00 AM · Circulation Desk: 9:00 AM - 8:00 PM',
      statusNote: 'Institute ID required after 10:00 PM',
      source: 'Central Library Office (LIB/2026-14)',
      isOfficial: true,
      lastUpdatedAt: hoursAgoISO(16),
    },
    {
      id: 'fac_hostel',
      institutionId: 'inst_iitb',
      facilityCategory: 'Hostel',
      facilityName: 'Hostel Zone 12-16 Utility Office',
      title: 'Scheduled Overhead Water Tank Cleaning (Sunday Afternoon)',
      details:
        'Preventive cleaning of Wing B and C overhead tanks on Sunday from 2:00 PM to 4:30 PM. Residents are advised to store water beforehand.',
      operatingInfo: 'Maintenance Window: Sunday 2:00 PM - 4:30 PM',
      statusNote: 'Scheduled Maintenance Notice',
      source: 'Estate & Hostel Maintenance Wing',
      isOfficial: true,
      lastUpdatedAt: hoursAgoISO(19),
    },
    {
      id: 'fac_transport',
      institutionId: 'inst_iitb',
      facilityCategory: 'Transport',
      facilityName: 'Internal Campus Bus Service',
      title: 'Updated Evening Loop Route Via Main Gate & Hostel 15',
      details:
        'Posted campus bus timetable lists 15-minute scheduled intervals between Main Gate, Academic Area (LHC), and Hostel Complex from 7:30 AM to 10:30 PM. Temporary diversion near Convo Hall for cable trenching.',
      operatingInfo: 'Posted Schedule: 7:30 AM - 10:30 PM · Route A1 & B2 active',
      statusNote: 'Route Diversion Near Convo Hall',
      source: 'Campus Transport & Security Section',
      isOfficial: true,
      lastUpdatedAt: hoursAgoISO(9),
    },
    {
      id: 'fac_cafeteria',
      institutionId: 'inst_iitb',
      facilityCategory: 'Cafeteria',
      facilityName: 'Gulmohar & SAC Student Canteens',
      title: 'SAC Night Canteen Deep-Clean Closure on Monday Morning',
      details:
        'SAC Canteen kitchen undergoes scheduled sanitization Monday 8:00 AM - 11:30 AM and reopens for afternoon service at 12:00 PM. Gulmohar Ground Floor remains open normally (8:00 AM - 9:00 PM).',
      operatingInfo: 'Gulmohar: 8:00 AM - 9:00 PM · SAC Canteen: Closed Mon 8:00 - 11:30 AM',
      statusNote: 'Partial Morning Closure',
      source: 'Student Affairs Hospitality Committee',
      isOfficial: true,
      lastUpdatedAt: hoursAgoISO(22),
    },
    {
      id: 'fac_labs',
      institutionId: 'inst_iitb',
      facilityCategory: 'Laboratories',
      facilityName: 'KReSIT Systems Lab 2 & EE Circuits Lab',
      title: 'Systems Lab 2 UPS Firmware Upgrade Window',
      details:
        'KReSIT Systems Lab 2 is closed Wednesday 1:30 PM - 4:30 PM for electrical UPS maintenance. CS-304 Lab Batch B2 moved to Software Lab 1 on Thursday.',
      operatingInfo: 'Closure: Wed 1:30 PM - 4:30 PM · Software Lab 1 unaffected',
      statusNote: 'Schedule Revision Active',
      source: 'Department of Computer Science & Engineering',
      isOfficial: true,
      lastUpdatedAt: hoursAgoISO(11),
    },
    {
      id: 'fac_other',
      institutionId: 'inst_iitb',
      facilityCategory: 'Other Facilities',
      facilityName: 'Student Wellness & Indoor Sports Complex',
      title: 'Badminton Court Flooring Varnish Cure & Wellness Center Hours',
      details:
        'Main indoor badminton courts 1 & 2 remain closed until Friday morning for floor refinishing. Student Counselling & Wellness Center operates Mon - Sat 9:30 AM - 6:00 PM.',
      operatingInfo: 'Wellness Center: Mon - Sat 9:30 AM - 6:00 PM',
      statusNote: 'Courts 1 & 2 Closed Until Friday',
      source: 'Gymkhana & Student Support Services',
      isOfficial: true,
      lastUpdatedAt: hoursAgoISO(32),
    },
  ];

  const lostFound: LostFoundPost[] = [
    {
      id: 'lf_calc_01',
      institutionId: 'inst_iitb',
      postType: 'Found Item',
      itemName: 'Casio fx-991EX Scientific Calculator (Black)',
      category: 'Electronics',
      description:
        'Found near the front row seats of Lecture Hall LH-101 after the 11:00 AM Algorithms lecture. Has a blue sticker on the sliding cover.',
      approximateLocation: 'Lecture Hall Complex · LH-101 Front Row',
      dateISO: daysFromNowISO(-1),
      posterId: 'stu_ananya_desai',
      posterName: 'Ananya Desai',
      posterDepartment: 'Visual Communication (IDC)',
      status: 'Open',
      createdAt: hoursAgoISO(18),
    },
    {
      id: 'lf_id_02',
      institutionId: 'inst_iitb',
      postType: 'Lost Item',
      itemName: 'Institute Student ID Card & Dark Blue Lanyard',
      category: 'ID Cards',
      description:
        'Misplaced somewhere between Central Library 2nd Floor Reading Hall and Gulmohar Cafeteria stairs around 4:30 PM.',
      approximateLocation: 'Central Library Stairs / Gulmohar Path',
      dateISO: daysFromNowISO(0),
      posterId: 'stu_rohan_nair',
      posterName: 'Rohan Nair',
      posterDepartment: 'Electrical Engineering',
      status: 'Open',
      createdAt: hoursAgoISO(4),
    },
  ];

  const polls: CampusPoll[] = [
    {
      id: 'poll_lib_quiet',
      institutionId: 'inst_iitb',
      question: 'Which weekend Central Library reading hall timing works best during non-exam weeks?',
      purpose: 'Facility Feedback',
      options: [
        { id: 'opt_1', text: '8:00 AM - 11:00 PM (current)', voteCount: 0 },
        { id: 'opt_2', text: '9:00 AM - 1:00 AM extended evening', voteCount: 0 },
        { id: 'opt_3', text: '7:00 AM - 10:00 PM early opening', voteCount: 0 },
      ],
      votedUserIds: [],
      closesAt: `${daysFromNowISO(7)}T23:59:00.000Z`,
      isAnonymous: true,
      createdById: 'pub_library_iitb',
      createdByName: 'Central Library Desk',
      createdByRole: 'Authorized Publisher',
      createdAt: hoursAgoISO(20),
    },
    {
      id: 'poll_shuttle_loop',
      institutionId: 'inst_iitb',
      question: 'Where should the evening campus shuttle add an extra 8:30 PM departure?',
      purpose: 'Campus Improvement',
      options: [
        { id: 'opt_a', text: 'Lecture Hall Complex (LHC) Main Porch', voteCount: 0 },
        { id: 'opt_b', text: 'Central Library Gate', voteCount: 0 },
        { id: 'opt_c', text: 'KReSIT / CSE Building Turnaround', voteCount: 0 },
      ],
      votedUserIds: [],
      closesAt: `${daysFromNowISO(5)}T23:59:00.000Z`,
      isAnonymous: false,
      createdById: 'adm_registrar_iitb',
      createdByName: 'Campus Services Committee',
      createdByRole: 'Institutional Admin',
      createdAt: hoursAgoISO(36),
    },
  ];

  const publishers: PublisherRecord[] = [
    {
      userId: 'adm_registrar_iitb',
      name: 'Office of the Academic Registrar',
      role: 'Institutional Admin',
      grantedBy: 'System Directory',
      grantedAt: hoursAgoISO(720),
    },
    {
      userId: 'adm_cse_iitb',
      name: 'Prof. Arvind Kulkarni (CSE Office)',
      role: 'Department Admin',
      assignedDepartmentId: 'dept_cse',
      assignedDepartmentName: 'Computer Science & Engineering',
      grantedBy: 'Office of the Academic Registrar',
      grantedAt: hoursAgoISO(600),
    },
    {
      userId: 'pub_library_iitb',
      name: 'Central Library Desk',
      role: 'Authorized Publisher',
      assignedDepartmentId: 'dept_services',
      assignedDepartmentName: 'Central Library & Campus Services',
      grantedBy: 'Office of the Academic Registrar',
      grantedAt: hoursAgoISO(500),
    },
  ];

  const submissions: StudentSubmission[] = [
    {
      id: 'sub_seed_1',
      institutionId: 'inst_iitb',
      postType: 'Facility Information',
      title: 'Water Cooler Filter Replaced on KReSIT 2nd Floor Corridor',
      categoryId: 'facility-updates',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      description:
        'Water dispenser near Seminar Room 204 has been serviced and is functioning again.',
      supportingInfo: 'Verified with KReSIT building supervisor at 11:15 AM.',
      attachments: [],
      authorId: 'stu_kabir_mehta',
      authorName: 'Kabir Mehta',
      moderationStatus: 'Under Review',
      createdAt: hoursAgoISO(6),
      updatedAt: hoursAgoISO(5),
    },
  ];

  return {
    institutions,
    departments,
    announcements,
    alerts,
    deadlines,
    facilities,
    lostFound,
    polls,
    submissions,
    reports: [],
    publishers,
    activeRoleOverrideByUser: {},
    selectedInstitutionByUser: {},
    savedNoticesByUser: {},
    savedDeadlinesByUser: {},
    followedDeptsByUser: {},
    readingHistoryByUser: {},
    notificationPrefsByUser: {},
    files: {},
  };
}

const campusPulseStorage = new ModuleStorage<CampusPulseDatabase>(
  'campus_pulse',
  DB_FILE,
  () => createSeedDatabase()
);

function loadDb(): CampusPulseDatabase {
  return campusPulseStorage.get();
}

function saveDb(db: CampusPulseDatabase) {
  campusPulseStorage.saveSync(db);
}

function getEffectiveAuth(
  db: CampusPulseDatabase,
  userId: string
): { role: CampusPulseRole; assignedDepartmentId?: string; staffTitle?: string } {
  const override = db.activeRoleOverrideByUser[userId];
  if (override) return override;
  const pub = db.publishers.find((p) => p.userId === userId);
  if (pub) {
    return {
      role: pub.role,
      assignedDepartmentId: pub.assignedDepartmentId,
      staffTitle: pub.name,
    };
  }
  return { role: 'Student' };
}

function hasPrivateContactLeak(text: string): boolean {
  return /(\+?\d[\d\s-]{8,}\d)/.test(text) || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
}

export function registerCampusPulseBackend(app: Express) {
  const db = loadDb();

  // 1. Bootstrap full Campus Pulse state for user
  app.get('/api/campus-pulse/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }
    const collegeHint = String(req.query.college || '');
    if (!db.selectedInstitutionByUser[userId]) {
      const matched = db.institutions.find((inst) =>
        collegeHint.toLowerCase().includes(inst.shortName.toLowerCase())
      );
      db.selectedInstitutionByUser[userId] = matched?.id || 'inst_iitb';
    }
    if (!db.followedDeptsByUser[userId]) {
      db.followedDeptsByUser[userId] = ['dept_acad', 'dept_cse'];
    }

    const effective = getEffectiveAuth(db, userId);

    return res.json({
      institutions: db.institutions,
      departments: db.departments,
      selectedInstitutionId: db.selectedInstitutionByUser[userId],
      roleInfo: effective,
      announcements: db.announcements,
      alerts: db.alerts,
      deadlines: db.deadlines,
      facilities: db.facilities,
      lostFound: db.lostFound,
      polls: db.polls,
      submissions: db.submissions.filter(
        (s) =>
          s.authorId === userId ||
          effective.role === 'Institutional Admin' ||
          (effective.role === 'Department Admin' &&
            s.departmentId === effective.assignedDepartmentId)
      ),
      reports:
        effective.role === 'Institutional Admin'
          ? db.reports
          : db.reports.filter((r) => r.reporterId === userId),
      publishers: effective.role === 'Institutional Admin' ? db.publishers : [],
      savedNoticeIds: db.savedNoticesByUser[userId] || [],
      savedDeadlineIds: db.savedDeadlinesByUser[userId] || [],
      followedDepartmentIds: db.followedDeptsByUser[userId] || [],
      readingHistory: db.readingHistoryByUser[userId] || [],
      notificationPrefs: db.notificationPrefsByUser[userId] || DEFAULT_NOTIF_PREFS,
    });
  });

  // 2. Role Verification / Institutional Staff Session (Backend Enforced)
  app.post('/api/campus-pulse/auth/role-session', (req: Request, res: Response) => {
    const { userId, passkey, revertToStudent } = req.body || {};
    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }
    if (revertToStudent) {
      delete db.activeRoleOverrideByUser[userId];
      saveDb(db);
      return res.json({ roleInfo: getEffectiveAuth(db, userId) });
    }
    const cleanKey = String(passkey || '').trim().toUpperCase();
    const matched = STAFF_PASSKEYS[cleanKey];
    if (!matched) {
      return res.status(403).json({
        message: 'Invalid institutional authorization code. Access remains restricted to Student.',
      });
    }
    db.activeRoleOverrideByUser[userId] = {
      role: matched.role,
      assignedDepartmentId: matched.assignedDepartmentId,
      staffTitle: matched.staffTitle,
    };
    saveDb(db);
    return res.json({ roleInfo: db.activeRoleOverrideByUser[userId] });
  });

  // 3. Generate Real Downloadable/Previewable Official Circular PDF
  app.get('/api/campus-pulse/circular-pdf/:id', (req: Request, res: Response) => {
    const notice = db.announcements.find((a) => a.id === req.params.id);
    if (!notice) {
      return res.status(404).send('Notice not found');
    }
    const inst = db.institutions.find((i) => i.id === notice.institutionId);
    const pdfBuf = generateNoticePdfBuffer(notice, inst?.name || 'KAMPUS Institution');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${(notice.circularCode || notice.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`
    );
    return res.send(pdfBuf);
  });

  // 4. Upload Attachment / Lost & Found Photo (<= 5 MB) & Serve Stored File
  app.post('/api/campus-pulse/upload', (req: Request, res: Response) => {
    const { userId, fileName, mimeType, base64Data } = req.body || {};
    if (!userId || !fileName || !base64Data) {
      return res.status(400).json({ message: 'Missing file upload payload.' });
    }
    const clean = String(base64Data).includes(',')
      ? String(base64Data).split(',')[1]
      : String(base64Data);
    const buffer = Buffer.from(clean, 'base64');
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ message: 'Uploaded file exceeds the 5 MB limit.' });
    }
    const id = `cpfile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.files[id] = {
      id,
      fileName: String(fileName),
      mimeType: String(mimeType || 'application/octet-stream'),
      sizeBytes: buffer.length,
      base64Data: clean,
      uploadedBy: String(userId),
      createdAt: new Date().toISOString(),
    };
    saveDb(db);

    const kind: 'pdf' | 'image' | 'document' = String(mimeType || '').includes('pdf')
      ? 'pdf'
      : String(mimeType || '').startsWith('image/')
        ? 'image'
        : 'document';

    return res.status(201).json({
      attachment: {
        id,
        fileName: db.files[id].fileName,
        mimeType: db.files[id].mimeType,
        sizeBytes: buffer.length,
        url: `/api/campus-pulse/files/${id}`,
        kind,
      },
    });
  });

  app.get('/api/campus-pulse/files/:fileId', (req: Request, res: Response) => {
    const f = db.files[req.params.fileId];
    if (!f) return res.status(404).send('File not found');
    const buf = Buffer.from(f.base64Data, 'base64');
    res.setHeader('Content-Type', f.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${f.fileName.replace(/"/g, '')}"`);
    return res.send(buf);
  });

  // 5. Publish Official Notice / Department Announcement (RBAC Strictly Enforced)
  app.post('/api/campus-pulse/announcements', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const auth = getEffectiveAuth(db, userId);

    if (auth.role === 'Student') {
      return res.status(403).json({
        message:
          'Students cannot publish official campus notices directly. Please use Student Submissions for review.',
      });
    }

    if (
      auth.role === 'Department Admin' &&
      auth.assignedDepartmentId &&
      b.departmentId &&
      b.departmentId !== auth.assignedDepartmentId
    ) {
      return res.status(403).json({
        message: 'Department Admins can only publish notices within their assigned department.',
      });
    }

    if (auth.role === 'Authorized Publisher' && b.categoryId === 'official-notices') {
      return res.status(403).json({
        message:
          'Authorized Publishers cannot publish top-level Institutional Policy Notices without Institutional Admin approval.',
      });
    }

    const title = String(b.title || '').trim();
    const content = String(b.content || '').trim();
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and full notice content are required.' });
    }

    const dept = db.departments.find((d) => d.id === b.departmentId) || db.departments[0];
    const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const attachments = Array.isArray(b.attachments) ? [...b.attachments] : [];
    if (attachments.length === 0 && b.generateOfficialPdf !== false) {
      attachments.push({
        id: `att_auto_${id}`,
        fileName: `${(b.circularCode || id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 3800,
        url: `/api/campus-pulse/circular-pdf/${id}`,
        kind: 'pdf',
      });
    }

    const announcement: CampusAnnouncement = {
      id,
      institutionId: b.institutionId || 'inst_iitb',
      circularCode: String(b.circularCode || `KMP/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 89)}`),
      title,
      summary: String(b.summary || content.slice(0, 170)).trim(),
      content,
      categoryId: (b.categoryId as PulseCategoryId) || 'official-notices',
      subcategory: String(b.subcategory || 'Administrative announcements'),
      departmentId: dept.id,
      departmentName: dept.name,
      targetCourse: b.targetCourse || undefined,
      targetSemester: b.targetSemester || undefined,
      authorId: userId,
      authorName: auth.staffTitle || String(b.authorName || 'Campus Office'),
      authorRole: auth.role,
      publishingAuthority: String(b.publishingAuthority || auth.staffTitle || dept.name),
      isOfficial: true,
      verificationLabel:
        auth.role === 'Institutional Admin'
          ? 'Authorized Institutional Notice'
          : 'Authorized Department Notice',
      status: b.status || 'New',
      priority: b.priority || 'Normal',
      isPinned: Boolean(b.isPinned && auth.role === 'Institutional Admin'),
      isRestricted: Boolean(b.isRestricted),
      restrictedAudienceLabel: b.isRestricted ? `${dept.name} students & faculty` : undefined,
      publishedAt: now,
      deadlineAt: b.deadlineAt || undefined,
      attachments,
      viewCount: 0,
      moderationStatus: 'Approved',
    };

    db.announcements.unshift(announcement);
    saveDb(db);
    return res.status(201).json({ announcement });
  });

  // 6. Edit / Pin / Archive Announcement (RBAC Strictly Enforced)
  app.patch('/api/campus-pulse/announcements/:id', (req: Request, res: Response) => {
    const ann = db.announcements.find((a) => a.id === req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found.' });
    const { userId, action, title, summary, content, status, priority } = req.body || {};
    const auth = getEffectiveAuth(db, String(userId || ''));

    if (auth.role === 'Student') {
      return res.status(403).json({ message: 'Students cannot modify official notices.' });
    }
    if (
      auth.role === 'Department Admin' &&
      auth.assignedDepartmentId &&
      ann.departmentId !== auth.assignedDepartmentId
    ) {
      return res.status(403).json({ message: 'Restricted to your assigned department.' });
    }
    if (auth.role === 'Authorized Publisher' && ann.authorId !== userId) {
      return res.status(403).json({ message: 'Publishers may only edit their own notices.' });
    }

    if (action === 'toggle-pin') {
      if (auth.role !== 'Institutional Admin') {
        return res.status(403).json({ message: 'Only Institutional Admins can pin announcements.' });
      }
      ann.isPinned = !ann.isPinned;
    } else if (action === 'archive') {
      ann.status = ann.status === 'Archived' ? 'New' : 'Archived';
      if (ann.status === 'Archived') ann.isPinned = false;
    } else {
      if (title) ann.title = String(title).trim();
      if (summary) ann.summary = String(summary).trim();
      if (content) ann.content = String(content).trim();
      if (status) ann.status = status;
      if (priority) ann.priority = priority;
    }

    saveDb(db);
    return res.json({ announcement: ann });
  });

  // 7. Record Real Announcement View & Reading History
  app.post('/api/campus-pulse/announcements/:id/view', (req: Request, res: Response) => {
    const ann = db.announcements.find((a) => a.id === req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found.' });
    const { userId } = req.body || {};
    ann.viewCount = (ann.viewCount || 0) + 1;

    if (userId) {
      const list = (db.readingHistoryByUser[userId] || []).filter(
        (h) => h.announcementId !== ann.id
      );
      list.unshift({
        announcementId: ann.id,
        title: ann.title,
        categoryId: ann.categoryId,
        viewedAt: new Date().toISOString(),
      });
      db.readingHistoryByUser[userId] = list.slice(0, 30);
    }

    saveDb(db);
    return res.json({
      viewCount: ann.viewCount,
      readingHistory: userId ? db.readingHistoryByUser[userId] : [],
    });
  });

  // 8. Create Official Campus Alert (RBAC Enforced)
  app.post('/api/campus-pulse/alerts', (req: Request, res: Response) => {
    const b = req.body || {};
    const auth = getEffectiveAuth(db, String(b.userId || ''));
    if (auth.role === 'Student') {
      return res.status(403).json({ message: 'Only authorized campus staff can issue alerts.' });
    }
    if (!String(b.title || '').trim() || !String(b.description || '').trim()) {
      return res.status(400).json({ message: 'Alert title and description are required.' });
    }
    const alert: CampusAlert = {
      id: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      institutionId: b.institutionId || 'inst_iitb',
      alertType: b.alertType || 'Important administrative update',
      title: String(b.title).trim(),
      priority: b.priority || 'Normal',
      description: String(b.description).trim(),
      publishingSource: auth.staffTitle || String(b.publishingSource || 'Campus Office'),
      departmentName: String(b.departmentName || 'Academic & Examination Office'),
      publishedAt: new Date().toISOString(),
      expiresAt: b.expiresAt || undefined,
      isOfficial: true,
    };
    db.alerts.unshift(alert);
    saveDb(db);
    return res.status(201).json({ alert });
  });

  // 9. Create Academic Deadline (RBAC Enforced for Confirmed Official)
  app.post('/api/campus-pulse/deadlines', (req: Request, res: Response) => {
    const b = req.body || {};
    const auth = getEffectiveAuth(db, String(b.userId || ''));
    if (auth.role === 'Student') {
      return res.status(403).json({ message: 'Only authorized staff can publish calendar deadlines.' });
    }
    if (!String(b.title || '').trim() || !b.dateISO) {
      return res.status(400).json({ message: 'Title and date are required.' });
    }
    const dept = db.departments.find((d) => d.id === b.departmentId) || db.departments[0];
    const deadline: AcademicDeadline = {
      id: `dl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      institutionId: b.institutionId || 'inst_iitb',
      title: String(b.title).trim(),
      kind: b.kind || 'Academic Event',
      dateISO: String(b.dateISO),
      timeLabel: b.timeLabel || undefined,
      departmentId: dept.id,
      departmentName: dept.name,
      targetSemester: b.targetSemester || undefined,
      description: String(b.description || '').trim(),
      source: auth.staffTitle || dept.name,
      isConfirmedOfficial: Boolean(b.isConfirmedOfficial),
    };
    db.deadlines.unshift(deadline);
    saveDb(db);
    return res.status(201).json({ deadline });
  });

  // 10. Create / Update Facility Notice (RBAC Enforced)
  app.post('/api/campus-pulse/facilities', (req: Request, res: Response) => {
    const b = req.body || {};
    const auth = getEffectiveAuth(db, String(b.userId || ''));
    if (auth.role === 'Student') {
      return res.status(403).json({ message: 'Facility status updates require authorized staff.' });
    }
    if (!String(b.title || '').trim() || !String(b.details || '').trim()) {
      return res.status(400).json({ message: 'Facility title and notice details are required.' });
    }
    const facility: FacilityUpdate = {
      id: `fac_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      institutionId: b.institutionId || 'inst_iitb',
      facilityCategory: b.facilityCategory || 'Other Facilities',
      facilityName: String(b.facilityName || b.facilityCategory || 'Campus Facility').trim(),
      title: String(b.title).trim(),
      details: String(b.details).trim(),
      operatingInfo: String(b.operatingInfo || 'See source notice for hours').trim(),
      statusNote: String(b.statusNote || 'Updated Notice').trim(),
      source: auth.staffTitle || 'Campus Services Desk',
      isOfficial: true,
      lastUpdatedAt: new Date().toISOString(),
    };
    db.facilities.unshift(facility);
    saveDb(db);
    return res.status(201).json({ facility });
  });

  // 11. Lost & Found Create + Recover (Privacy-checked)
  app.post('/api/campus-pulse/lost-found', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !String(b.itemName || '').trim() || !String(b.approximateLocation || '').trim()) {
      return res.status(400).json({ message: 'Item name and approximate location are required.' });
    }
    const combinedText = `${b.itemName || ''} ${b.description || ''} ${b.approximateLocation || ''}`;
    if (hasPrivateContactLeak(combinedText)) {
      return res.status(400).json({
        message:
          'For student privacy, please do not post phone numbers or email addresses. Peers will reach you safely via KAMPUS Chat.',
      });
    }
    const post: LostFoundPost = {
      id: `lf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      institutionId: b.institutionId || 'inst_iitb',
      postType: b.postType === 'Found Item' ? 'Found Item' : 'Lost Item',
      itemName: String(b.itemName).trim(),
      category: b.category || 'Other',
      description: String(b.description || '').trim(),
      imageUrl: b.imageUrl || undefined,
      approximateLocation: String(b.approximateLocation).trim(),
      dateISO: String(b.dateISO || daysFromNowISO(0)),
      posterId: userId,
      posterName: String(b.posterName || 'Student'),
      posterDepartment: String(b.posterDepartment || 'Campus Student'),
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    db.lostFound.unshift(post);
    saveDb(db);
    return res.status(201).json({ post });
  });

  app.patch('/api/campus-pulse/lost-found/:id', (req: Request, res: Response) => {
    const post = db.lostFound.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ message: 'Lost & Found post not found.' });
    const { userId, status } = req.body || {};
    const auth = getEffectiveAuth(db, String(userId || ''));
    if (post.posterId !== userId && auth.role !== 'Institutional Admin') {
      return res.status(403).json({ message: 'Only the poster or an admin can update item status.' });
    }
    post.status = status === 'Open' ? 'Open' : 'Recovered';
    saveDb(db);
    return res.json({ post });
  });

  // 12. Campus Polls Create & Vote (Duplicate Voting Prevented)
  app.post('/api/campus-pulse/polls', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const auth = getEffectiveAuth(db, userId);
    const options = Array.isArray(b.options)
      ? b.options.map((o: string) => String(o).trim()).filter(Boolean)
      : [];
    if (!userId || !String(b.question || '').trim() || options.length < 2) {
      return res.status(400).json({ message: 'Poll question and at least 2 options are required.' });
    }
    const poll: CampusPoll = {
      id: `poll_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      institutionId: b.institutionId || 'inst_iitb',
      question: String(b.question).trim(),
      purpose: b.purpose || 'General Opinion',
      options: options.map((text: string, idx: number) => ({
        id: `opt_${Date.now()}_${idx}`,
        text,
        voteCount: 0,
      })),
      votedUserIds: [],
      closesAt: String(b.closesAt || `${daysFromNowISO(7)}T23:59:00.000Z`),
      isAnonymous: Boolean(b.isAnonymous),
      createdById: userId,
      createdByName: auth.staffTitle || String(b.userName || 'Student'),
      createdByRole: auth.role,
      createdAt: new Date().toISOString(),
    };
    db.polls.unshift(poll);
    saveDb(db);
    return res.status(201).json({ poll });
  });

  app.post('/api/campus-pulse/polls/:id/vote', (req: Request, res: Response) => {
    const poll = db.polls.find((p) => p.id === req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });
    if (new Date(poll.closesAt).getTime() < Date.now()) {
      return res.status(400).json({ message: 'This poll has closed.' });
    }
    const { userId, optionId } = req.body || {};
    if (!userId || !optionId) {
      return res.status(400).json({ message: 'userId and optionId are required.' });
    }
    if (poll.votedUserIds.includes(userId)) {
      return res.status(400).json({ message: 'You have already submitted a vote for this poll.' });
    }
    const option = poll.options.find((o) => o.id === optionId);
    if (!option) return res.status(404).json({ message: 'Selected option not found.' });
    option.voteCount += 1;
    poll.votedUserIds.push(userId);
    saveDb(db);
    return res.json({ poll });
  });

  // 13. Student Submissions (Draft / Submit / Edit) & Admin Moderation (Never auto-marked official)
  app.post('/api/campus-pulse/submissions', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || !String(b.title || '').trim() || !String(b.description || '').trim()) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }
    const dept = db.departments.find((d) => d.id === b.departmentId) || db.departments[0];
    const now = new Date().toISOString();

    if (b.id) {
      const existing = db.submissions.find((s) => s.id === b.id);
      if (!existing) return res.status(404).json({ message: 'Submission not found.' });
      if (existing.authorId !== userId) {
        return res.status(403).json({ message: 'Only the author can edit this submission.' });
      }
      existing.postType = b.postType || existing.postType;
      existing.title = String(b.title).trim();
      existing.categoryId = b.categoryId || existing.categoryId;
      existing.departmentId = dept.id;
      existing.departmentName = dept.name;
      existing.description = String(b.description).trim();
      existing.supportingInfo = String(b.supportingInfo || '').trim();
      if (Array.isArray(b.attachments)) existing.attachments = b.attachments;
      existing.moderationStatus = b.saveAsDraft ? 'Draft' : 'Submitted';
      existing.updatedAt = now;
      saveDb(db);
      return res.json({ submission: existing });
    }

    const submission: StudentSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      institutionId: b.institutionId || 'inst_iitb',
      postType: b.postType || 'Student Update',
      title: String(b.title).trim(),
      categoryId: b.categoryId || 'student-information',
      departmentId: dept.id,
      departmentName: dept.name,
      description: String(b.description).trim(),
      supportingInfo: String(b.supportingInfo || '').trim(),
      attachments: Array.isArray(b.attachments) ? b.attachments : [],
      authorId: userId,
      authorName: String(b.userName || 'Student'),
      moderationStatus: b.saveAsDraft ? 'Draft' : 'Submitted',
      createdAt: now,
      updatedAt: now,
    };
    db.submissions.unshift(submission);
    saveDb(db);
    return res.status(201).json({ submission });
  });

  app.post('/api/campus-pulse/submissions/:id/moderate', (req: Request, res: Response) => {
    const sub = db.submissions.find((s) => s.id === req.params.id);
    if (!sub) return res.status(404).json({ message: 'Submission not found.' });
    const { userId, decision, note } = req.body || {};
    const auth = getEffectiveAuth(db, String(userId || ''));

    if (auth.role !== 'Institutional Admin' && auth.role !== 'Department Admin') {
      return res.status(403).json({
        message: 'Only Institutional or Department Admins can moderate student submissions.',
      });
    }
    if (
      auth.role === 'Department Admin' &&
      auth.assignedDepartmentId &&
      sub.departmentId !== auth.assignedDepartmentId
    ) {
      return res.status(403).json({
        message: 'Department Admins can only moderate submissions for their department.',
      });
    }

    if (decision === 'Under Review') {
      sub.moderationStatus = 'Under Review';
      sub.moderatorNote = String(note || '').trim() || undefined;
      sub.updatedAt = new Date().toISOString();
      saveDb(db);
      return res.json({ submission: sub });
    }

    if (decision === 'Rejected') {
      sub.moderationStatus = 'Rejected';
      sub.moderatorNote = String(note || '').trim() || 'Did not meet verification criteria.';
      sub.updatedAt = new Date().toISOString();
      saveDb(db);
      return res.json({ submission: sub });
    }

    if (decision === 'Approved') {
      sub.moderationStatus = 'Approved';
      sub.moderatorNote = String(note || '').trim() || 'Approved for student campus feed.';
      sub.updatedAt = new Date().toISOString();

      // Strictly publish with isOfficial: false & explicit Approved Student Submission label
      const published: CampusAnnouncement = {
        id: `ann_stu_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        institutionId: sub.institutionId,
        title: sub.title,
        summary: sub.description.slice(0, 170),
        content: `${sub.description}${
          sub.supportingInfo ? `\n\nSupporting Context: ${sub.supportingInfo}` : ''
        }`,
        categoryId: 'student-information',
        subcategory: 'Student-submitted campus information',
        departmentId: sub.departmentId,
        departmentName: sub.departmentName,
        authorId: sub.authorId,
        authorName: sub.authorName,
        authorRole: 'Student',
        publishingAuthority: 'Approved Student Submission (Unverified Official Status)',
        isOfficial: false,
        verificationLabel: 'Approved Student Submission',
        status: 'New',
        priority: 'Informational',
        isPinned: false,
        publishedAt: new Date().toISOString(),
        attachments: sub.attachments,
        viewCount: 0,
        moderationStatus: 'Approved',
      };
      sub.publishedAnnouncementId = published.id;
      db.announcements.unshift(published);
      saveDb(db);
      return res.json({ submission: sub, announcement: published });
    }

    return res.status(400).json({ message: 'Invalid moderation decision.' });
  });

  // 14. Saved Notices, Saved Deadlines & Followed Departments
  app.post('/api/campus-pulse/saved', (req: Request, res: Response) => {
    const { userId, kind, targetId } = req.body || {};
    if (!userId || !kind || !targetId) {
      return res.status(400).json({ message: 'userId, kind, and targetId are required.' });
    }
    const map =
      kind === 'notice'
        ? db.savedNoticesByUser
        : kind === 'deadline'
          ? db.savedDeadlinesByUser
          : db.followedDeptsByUser;

    const current = map[userId] || [];
    const exists = current.includes(targetId);
    map[userId] = exists ? current.filter((i) => i !== targetId) : [...current, targetId];
    saveDb(db);
    return res.json({
      savedNoticeIds: db.savedNoticesByUser[userId] || [],
      savedDeadlineIds: db.savedDeadlinesByUser[userId] || [],
      followedDepartmentIds: db.followedDeptsByUser[userId] || [],
    });
  });

  // 15. User Preferences (Selected Institution & Notification Preferences)
  app.put('/api/campus-pulse/preferences', (req: Request, res: Response) => {
    const { userId, selectedInstitutionId, notificationPrefs } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (selectedInstitutionId) {
      db.selectedInstitutionByUser[userId] = String(selectedInstitutionId);
    }
    if (notificationPrefs) {
      db.notificationPrefsByUser[userId] = {
        ...DEFAULT_NOTIF_PREFS,
        ...notificationPrefs,
      };
    }
    saveDb(db);
    return res.json({
      selectedInstitutionId: db.selectedInstitutionByUser[userId],
      notificationPrefs: db.notificationPrefsByUser[userId] || DEFAULT_NOTIF_PREFS,
    });
  });

  // 16. Safety & Accuracy Reports
  app.post('/api/campus-pulse/reports', (req: Request, res: Response) => {
    const { userId, userName, targetType, targetId, targetTitle, reason, details } = req.body || {};
    if (!userId || !targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Incomplete report payload.' });
    }
    const report: PulseReport = {
      id: `cprep_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      reporterId: String(userId),
      reporterName: String(userName || 'Student'),
      targetType,
      targetId: String(targetId),
      targetTitle: String(targetTitle || 'Campus Post'),
      reason: String(reason),
      details: String(details || ''),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    saveDb(db);
    return res.status(201).json({ report });
  });

  app.patch('/api/campus-pulse/reports/:id', (req: Request, res: Response) => {
    const { userId, status } = req.body || {};
    const auth = getEffectiveAuth(db, String(userId || ''));
    if (auth.role !== 'Institutional Admin') {
      return res.status(403).json({ message: 'Only Institutional Admins can resolve reports.' });
    }
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    report.status = status === 'Dismissed' ? 'Dismissed' : 'Reviewed';
    saveDb(db);
    return res.json({ report });
  });

  // 17. Institutional Admin Publisher Management
  app.post('/api/campus-pulse/publishers', (req: Request, res: Response) => {
    const { userId, targetUserId, targetName, role, assignedDepartmentId } = req.body || {};
    const auth = getEffectiveAuth(db, String(userId || ''));
    if (auth.role !== 'Institutional Admin') {
      return res.status(403).json({ message: 'Only Institutional Admins can manage publishers.' });
    }
    if (!targetUserId || !targetName || !role) {
      return res.status(400).json({ message: 'targetUserId, targetName, and role are required.' });
    }
    const dept = db.departments.find((d) => d.id === assignedDepartmentId);
    const existingIdx = db.publishers.findIndex((p) => p.userId === targetUserId);
    if (role === 'Student') {
      if (existingIdx !== -1) db.publishers.splice(existingIdx, 1);
      saveDb(db);
      return res.json({ publishers: db.publishers });
    }
    const record: PublisherRecord = {
      userId: String(targetUserId),
      name: String(targetName),
      role,
      assignedDepartmentId: dept?.id,
      assignedDepartmentName: dept?.name,
      grantedBy: auth.staffTitle || 'Institutional Admin',
      grantedAt: new Date().toISOString(),
    };
    if (existingIdx !== -1) {
      db.publishers[existingIdx] = record;
    } else {
      db.publishers.unshift(record);
    }
    saveDb(db);
    return res.status(201).json({ publishers: db.publishers });
  });

  // 18. Restricted Admin Analytics (Backend Enforced — Real Data Only)
  app.get('/api/campus-pulse/analytics', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    const auth = getEffectiveAuth(db, userId);
    if (auth.role === 'Student') {
      return res.status(403).json({
        message: 'Administrative analytics are restricted to authorized campus roles.',
      });
    }

    const categories: PulseCategoryId[] = [
      'official-notices',
      'academic-updates',
      'examination-updates',
      'admission-registration',
      'campus-news',
      'facility-updates',
      'student-information',
    ];

    const categoryLabels: Record<PulseCategoryId, string> = {
      'official-notices': 'Official Notices',
      'academic-updates': 'Academic Updates',
      'examination-updates': 'Examination Updates',
      'admission-registration': 'Admission & Registration',
      'campus-news': 'Campus News',
      'facility-updates': 'Facility Updates',
      'student-information': 'Student Information',
    };

    const snapshot: PulseAnalyticsSnapshot = {
      totalPublishedAnnouncements: db.announcements.length,
      officialCount: db.announcements.filter((a) => a.isOfficial).length,
      studentApprovedCount: db.announcements.filter((a) => !a.isOfficial).length,
      byCategory: categories.map((cid) => ({
        categoryId: cid,
        label: categoryLabels[cid],
        count: db.announcements.filter((a) => a.categoryId === cid).length,
      })),
      recentPublishingActivity: db.announcements.slice(0, 6).map((a) => ({
        id: a.id,
        title: a.title,
        authorName: a.authorName,
        isOfficial: a.isOfficial,
        publishedAt: a.publishedAt,
      })),
      mostViewedAnnouncements: [...db.announcements]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          title: a.title,
          categoryId: a.categoryId,
          viewCount: a.viewCount || 0,
        })),
      studentSubmissionsSummary: {
        total: db.submissions.length,
        drafts: db.submissions.filter((s) => s.moderationStatus === 'Draft').length,
        submittedOrReview: db.submissions.filter(
          (s) => s.moderationStatus === 'Submitted' || s.moderationStatus === 'Under Review'
        ).length,
        approved: db.submissions.filter((s) => s.moderationStatus === 'Approved').length,
        rejected: db.submissions.filter((s) => s.moderationStatus === 'Rejected').length,
      },
      pendingModerationRequests: db.submissions.filter(
        (s) => s.moderationStatus === 'Submitted' || s.moderationStatus === 'Under Review'
      ).length,
      pendingReportsCount: db.reports.filter((r) => r.status === 'Submitted').length,
      pollParticipation: db.polls.map((p) => ({
        pollId: p.id,
        question: p.question,
        totalVotes: p.votedUserIds.length,
      })),
    };

    return res.json({ analytics: snapshot });
  });
}
