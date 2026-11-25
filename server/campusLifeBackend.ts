import { ModuleStorage } from '../database/moduleStorage.ts';
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { dispatchNotification } from './notificationsBackend.ts';

export interface CampusLifeEvent {
  id: string;
  title: string;
  description: string;
  category: 'Hackathon' | 'Cultural Fest' | 'Workshop' | 'Seminar' | 'Sports' | 'Technical';
  organizer: string;
  organizerRole?: string;
  venue: string;
  date: string;
  time: string;
  startDateISO: string;
  endDateISO: string;
  capacity: number;
  registeredCount: number;
  prizePool?: string;
  image: string;
  featured: boolean;
  registrationOpen: boolean;
  tags: string[];
  createdAt: string;
}

export interface CampusClub {
  id: string;
  name: string;
  category: 'Technical' | 'Cultural' | 'Literary' | 'Sports' | 'Social' | 'Entrepreneurship';
  description: string;
  leadName: string;
  leadRole: string;
  leadAvatar?: string;
  membersCount: number;
  establishedYear: number;
  meetingSchedule: string;
  venue: string;
  logo: string;
  featured: boolean;
  activeProjects: string[];
  socialLinks?: {
    instagram?: string;
    github?: string;
    linkedin?: string;
  };
  createdAt: string;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  department: string;
  publishedBy: string;
  verifiedOfficial: boolean;
  priority: 'Urgent' | 'High' | 'Normal';
  date: string;
  content: string;
  category: 'Academic' | 'Hostel' | 'Examination' | 'Facilities' | 'General';
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

export interface LostAndFoundItem {
  id: string;
  title: string;
  description: string;
  type: 'Lost' | 'Found';
  category: 'Electronics' | 'IDs & Cards' | 'Books & Notes' | 'Accessories' | 'Keys' | 'Other';
  location: string;
  dateReported: string;
  status: 'Open' | 'Resolved' | 'Claimed';
  reporterId: string;
  reporterName: string;
  reporterContact?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface EventRegistrationRecord {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  registeredAt: string;
  status: 'Confirmed' | 'Cancelled';
}

export interface ClubMembershipRecord {
  id: string;
  clubId: string;
  userId: string;
  userName: string;
  joinedAt: string;
  status: 'Active' | 'Pending';
}

export interface CampusLifeDatabase {
  events: CampusLifeEvent[];
  clubs: CampusClub[];
  announcements: CampusAnnouncement[];
  lostAndFound: LostAndFoundItem[];
  registrations: EventRegistrationRecord[];
  memberships: ClubMembershipRecord[];
}

const DB_PATH = path.join(process.cwd(), '.kampus_campus_life_db.json');

function createSeedDatabase(): CampusLifeDatabase {
  return {
    events: [
      {
        id: 'ev_codewave_2026',
        title: 'Annual Flagship Hackathon: CodeWave 2026',
        description: '36-hour non-stop hackathon with problem statements in AI Copilots, Web3, FinTech, and Campus Automation. Mentorship from industry leads, high-speed Wi-Fi, food, and swag kits provided.',
        category: 'Hackathon',
        organizer: 'Google Developer Student Clubs (GDSC)',
        organizerRole: 'Campus Technical Chapter',
        venue: 'Main Convocation Auditorium & Innovation Lab',
        date: 'Dec 05 - 07, 2026',
        time: 'Starts 09:00 AM',
        startDateISO: '2026-12-05T09:00:00Z',
        endDateISO: '2026-12-07T21:00:00Z',
        capacity: 500,
        registeredCount: 412,
        prizePool: '₹2,50,000 Cash + Cloud Credits',
        image: '/src/assets/images/campus_hackathon_1794407584703.jpg',
        featured: true,
        registrationOpen: true,
        tags: ['Hackathon', 'AI', 'Prizes', 'Team Event'],
        createdAt: '2026-11-20T10:00:00Z',
      },
      {
        id: 'ev_mood_indigo_prelims',
        title: 'KAMPUS Cultural Extravaganza: Festivo 2026',
        description: 'Inter-college battle of the bands, street play (Nukkad Natak), fashion parade, and standup comedy night. Celebrity guest performances on closing day.',
        category: 'Cultural Fest',
        organizer: 'Student Cultural Council',
        organizerRole: 'Student Senate',
        venue: 'Open Air Theatre (OAT)',
        date: 'Dec 12 - 14, 2026',
        time: '05:00 PM Daily',
        startDateISO: '2026-12-12T17:00:00Z',
        endDateISO: '2026-12-14T23:00:00Z',
        capacity: 1200,
        registeredCount: 890,
        prizePool: 'Trophies & National Passes',
        image: '/src/assets/images/events_cultural_fest_1794564537193.jpg',
        featured: true,
        registrationOpen: true,
        tags: ['Music', 'Drama', 'Dance', 'OAT'],
        createdAt: '2026-11-21T11:00:00Z',
      },
      {
        id: 'ev_ml_deep_dive',
        title: 'Practical Hands-on Machine Learning & LLM Fine-Tuning',
        description: 'Deep dive into PyTorch, Hugging Face transformers, and fine-tuning open weights models on campus GPU clusters. Bring your own laptop.',
        category: 'Workshop',
        organizer: 'AI & Data Science Guild',
        organizerRole: 'Technical Society',
        venue: 'CS Block Seminar Hall 3',
        date: 'Dec 02, 2026',
        time: '02:00 PM - 05:30 PM',
        startDateISO: '2026-12-02T14:00:00Z',
        endDateISO: '2026-12-02T17:30:00Z',
        capacity: 120,
        registeredCount: 114,
        prizePool: 'Verified Digital Certificates',
        image: '/src/assets/images/events_workshop_seminar_1794564537593.jpg',
        featured: false,
        registrationOpen: true,
        tags: ['Machine Learning', 'Python', 'Hands-on'],
        createdAt: '2026-11-22T08:00:00Z',
      },
      {
        id: 'ev_inter_hostel_cricket',
        title: 'Inter-Hostel Cricket Championship: Super 8 Trophy',
        description: 'T20 knockout tournament between hostel wings. Red leather ball matches under floodlights. Trophies and player of the tournament kit.',
        category: 'Sports',
        organizer: 'Campus Sports Department',
        organizerRole: 'Athletic Board',
        venue: 'Main University Cricket Pavilion',
        date: 'Nov 28 - 30, 2026',
        time: '04:00 PM Matchups',
        startDateISO: '2026-11-28T16:00:00Z',
        endDateISO: '2026-11-30T22:00:00Z',
        capacity: 350,
        registeredCount: 280,
        prizePool: 'Champion Shield & Cash ₹50,000',
        image: '/src/assets/images/campus_life_activities_1794488255584.jpg',
        featured: false,
        registrationOpen: true,
        tags: ['Cricket', 'Sports', 'Hostel Cup'],
        createdAt: '2026-11-22T12:00:00Z',
      },
    ],
    clubs: [
      {
        id: 'cl_robotics',
        name: 'Robotics & Automation Guild',
        category: 'Technical',
        description: 'Designing autonomous rovers, battle bots, quadcopters, and industrial IoT solutions. Participates in national IIT techfests and Robocon.',
        leadName: 'Aditya Sharma',
        leadRole: 'President (Final Year ECE)',
        membersCount: 340,
        establishedYear: 2018,
        meetingSchedule: 'Wednesdays & Fridays at 5:30 PM',
        venue: 'Mechanical Workshop Bay 4',
        logo: '/src/assets/images/events_tech_hackathon_1794564537496.jpg',
        featured: true,
        activeProjects: ['Mars Rover Prototype 3', 'Campus Autonomous Delivery Buggy', 'Combat Bot "Vajra"'],
        socialLinks: {
          github: 'https://github.com',
          instagram: 'https://instagram.com',
        },
        createdAt: '2026-11-15T10:00:00Z',
      },
      {
        id: 'cl_literary',
        name: 'Literary & Debating Society (LitSoc)',
        category: 'Literary',
        description: 'Parliamentary debates, Model United Nations (MUN), creative writing, and poetry slams. Fostering sharp rhetoric and civil discourse.',
        leadName: 'Ananya Deshmukh',
        leadRole: 'Convener (3rd Year Humanities)',
        membersCount: 215,
        establishedYear: 2016,
        meetingSchedule: 'Tuesdays at 6:00 PM',
        venue: 'Library Amphitheatre',
        logo: '/src/assets/images/college_iit_tech_campus_1794572775766.jpg',
        featured: true,
        activeProjects: ['Annual KAMPUS MUN 2027', 'Campus Literary Anthology "Varta"', 'Freshers Debate League'],
        socialLinks: {
          instagram: 'https://instagram.com',
        },
        createdAt: '2026-11-15T11:00:00Z',
      },
      {
        id: 'cl_music_band',
        name: 'Symphony: The Campus Music Collective',
        category: 'Cultural',
        description: 'Fusion band, acoustic sets, choral harmonies, and audio production. Complete practice studio with drum kits, amps, and recording console.',
        leadName: 'Kabir Sen',
        leadRole: 'Bandmaster (3rd Year CS)',
        membersCount: 180,
        establishedYear: 2019,
        meetingSchedule: 'Mondays & Thursdays at 7:00 PM',
        venue: 'Student Activity Center (SAC) Music Room',
        logo: '/src/assets/images/events_cultural_fest_1794564537193.jpg',
        featured: false,
        activeProjects: ['Campus Original Album 2026', 'Acoustic Unplugged Nights', 'Fest Headliner Set'],
        createdAt: '2026-11-15T12:00:00Z',
      },
      {
        id: 'cl_e_cell',
        name: 'Entrepreneurship Cell (E-Cell)',
        category: 'Entrepreneurship',
        description: 'Startup incubation, investor pitch days, founder speaker series, and seed micro-grants for student-led campus enterprises.',
        leadName: 'Priya Nair',
        leadRole: 'Lead (4th Year Management)',
        membersCount: 290,
        establishedYear: 2017,
        meetingSchedule: 'Saturdays at 11:00 AM',
        venue: 'Incubation Center Seminar Hall',
        logo: '/src/assets/images/hero_students_campus_1794449577723.jpg',
        featured: false,
        activeProjects: ['KAMPUS Startup Bootcamp', 'Venture Pitch 2026', 'Alumni Angel Network'],
        createdAt: '2026-11-15T13:00:00Z',
      },
    ],
    announcements: [
      {
        id: 'ann_end_sem_schedule',
        title: 'Mandatory Submission of End-Sem Laboratory Journals',
        department: 'Dean of Academic Affairs',
        publishedBy: 'Prof. R. K. Mukherjee',
        verifiedOfficial: true,
        priority: 'Urgent',
        date: 'Nov 24, 2026',
        category: 'Academic',
        content: 'All B.Tech semester 3, 5 and 7 scholars must produce hardcopy journals signed by internal examiners before Nov 30, 05:00 PM. No grace period will be granted.',
        attachmentName: 'Lab_Journal_Format_2026.pdf',
        createdAt: '2026-11-24T09:30:00Z',
      },
      {
        id: 'ann_hostel_wifi',
        title: 'Hostel Wi-Fi Upgradation & 10G Fiber Maintenance Window',
        department: 'Computer Center Operations',
        publishedBy: 'System Admin Cell',
        verifiedOfficial: true,
        priority: 'Normal',
        date: 'Nov 23, 2026',
        category: 'Hostel',
        content: 'Scheduled core router firmware updates in Hostels 4, 5, 6 and Girls Hostel Block B between 02:00 AM and 05:00 AM this Saturday. Wired network in library remains uninterrupted.',
        createdAt: '2026-11-23T14:00:00Z',
      },
      {
        id: 'ann_scholarships',
        title: 'State Merit-cum-Means Scholarship Portal Verification',
        department: 'Student Welfare Section',
        publishedBy: 'Dr. S. K. Verma',
        verifiedOfficial: true,
        priority: 'High',
        date: 'Nov 22, 2026',
        category: 'General',
        content: 'Scholars eligible for state government fee waivers must report to Admin Block Room 102 with physical domicile, income certificate and Aadhaar card.',
        attachmentName: 'Scholarship_Notice_Guidelines.pdf',
        createdAt: '2026-11-22T11:00:00Z',
      },
    ],
    lostAndFound: [
      {
        id: 'lf_casio_calc',
        title: 'Casio fx-991CW Calculator in Black Leather Case',
        description: 'Found on the 2nd bench of CS Block Room 204 after Data Structures lecture. The owner can collect after stating the serial number.',
        type: 'Found',
        category: 'Electronics',
        location: 'CS Lecture Hall 204',
        dateReported: 'Nov 24, 2026',
        status: 'Open',
        reporterId: 'student_rohan_99',
        reporterName: 'Rohan Verma (Year 2 CS)',
        reporterContact: 'Room 312, Hostel 4',
        createdAt: '2026-11-24T16:00:00Z',
      },
      {
        id: 'lf_boat_airpodes',
        title: 'boAt Airdopes 141 Charging Case (Carbon Black)',
        description: 'Lost somewhere between Central Cafeteria and Sports Complex ground during lunch hour.',
        type: 'Lost',
        category: 'Electronics',
        location: 'Between Cafeteria & Ground',
        dateReported: 'Nov 23, 2026',
        status: 'Open',
        reporterId: 'student_aditya_21',
        reporterName: 'Aditya Gupta (Year 1 Mechanical)',
        reporterContact: '+91 98765 43210',
        createdAt: '2026-11-23T15:00:00Z',
      },
      {
        id: 'lf_room_keys',
        title: 'Hostel Room Key with Metallic Batman Keychain',
        description: 'Found near the Library water cooler on 1st floor. Deposited at Library reception desk.',
        type: 'Found',
        category: 'Keys',
        location: 'Central Library 1st Floor',
        dateReported: 'Nov 22, 2026',
        status: 'Resolved',
        reporterId: 'student_meera_44',
        reporterName: 'Meera Patel (Year 3 ECE)',
        reporterContact: 'Library Helpdesk',
        createdAt: '2026-11-22T17:00:00Z',
      },
    ],
    registrations: [
      {
        id: 'reg_demo_1',
        eventId: 'ev_codewave_2026',
        userId: 'student_default',
        userName: 'Scholar Default',
        registeredAt: '2026-11-24T10:00:00Z',
        status: 'Confirmed',
      },
    ],
    memberships: [
      {
        id: 'mem_demo_1',
        clubId: 'cl_robotics',
        userId: 'student_default',
        userName: 'Scholar Default',
        joinedAt: '2026-11-20T10:00:00Z',
        status: 'Active',
      },
    ],
  };
}

const campusLifeStorage = new ModuleStorage<CampusLifeDatabase>(
  'campus_life',
  DB_PATH,
  () => createSeedDatabase()
);

function loadDb(): CampusLifeDatabase {
  return campusLifeStorage.get();
}

function saveDb(db: CampusLifeDatabase): void {
  campusLifeStorage.saveSync(db);
}

function getAuthenticatedUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.sub || decoded.userId)) {
        return decoded.sub || decoded.userId;
      }
    } catch {}
  }
  const headerUserId = req.headers['x-user-id'] || req.headers['x-clerk-user-id'];
  if (headerUserId && typeof headerUserId === 'string' && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }
  const queryUid = req.query.userId || req.body?.userId;
  if (queryUid && typeof queryUid === 'string' && queryUid.trim().length > 0) {
    return queryUid.trim();
  }
  return 'student_default';
}

export function registerCampusLifeBackend(app: Express) {
  const db = loadDb();

  // 1. Unified Campus Life Overview
  app.get('/api/campus-life/overview', (req: Request, res: Response) => {
    const uid = getAuthenticatedUserId(req);

    const featuredEvent = db.events.find((e) => e.featured) || db.events[0];
    const registeredEventIds = new Set(
      db.registrations
        .filter((r) => r.userId === uid && r.status === 'Confirmed')
        .map((r) => r.eventId)
    );
    const joinedClubIds = new Set(
      db.memberships
        .filter((m) => m.userId === uid && m.status === 'Active')
        .map((m) => m.clubId)
    );

    const eventsWithMeta = db.events.map((e) => ({
      ...e,
      isRegistered: registeredEventIds.has(e.id),
      spotsLeft: Math.max(0, e.capacity - e.registeredCount),
    }));

    const clubsWithMeta = db.clubs.map((c) => ({
      ...c,
      isMember: joinedClubIds.has(c.id),
    }));

    return res.json({
      featuredEvent: featuredEvent
        ? {
            ...featuredEvent,
            isRegistered: registeredEventIds.has(featuredEvent.id),
            spotsLeft: Math.max(0, featuredEvent.capacity - featuredEvent.registeredCount),
          }
        : null,
      events: eventsWithMeta,
      clubs: clubsWithMeta,
      announcements: db.announcements,
      lostAndFound: db.lostAndFound,
      stats: {
        totalEvents: db.events.length,
        totalClubs: db.clubs.length,
        activeAnnouncements: db.announcements.length,
        openLostFound: db.lostAndFound.filter((i) => i.status === 'Open').length,
        myRegistrationsCount: registeredEventIds.size,
        myClubsCount: joinedClubIds.size,
      },
    });
  });

  // 2. Events List with Search & Category
  app.get('/api/campus-life/events', (req: Request, res: Response) => {
    const uid = getAuthenticatedUserId(req);
    const category = req.query.category ? String(req.query.category).trim() : null;
    const query = req.query.q ? String(req.query.q).toLowerCase().trim() : null;

    const registeredEventIds = new Set(
      db.registrations
        .filter((r) => r.userId === uid && r.status === 'Confirmed')
        .map((r) => r.eventId)
    );

    let list = [...db.events];
    if (category && category !== 'All') {
      list = list.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }
    if (query) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.venue.toLowerCase().includes(query) ||
          e.organizer.toLowerCase().includes(query)
      );
    }

    const result = list.map((e) => ({
      ...e,
      isRegistered: registeredEventIds.has(e.id),
      spotsLeft: Math.max(0, e.capacity - e.registeredCount),
    }));

    return res.json({ events: result, count: result.length });
  });

  // 3. Register for Event (Validates Capacity & Prevents Duplicate)
  app.post('/api/campus-life/events/:id/register', (req: Request, res: Response) => {
    const { id } = req.params;
    const uid = getAuthenticatedUserId(req);
    const { userName = 'KAMPUS Student', userEmail } = req.body || {};

    const event = db.events.find((e) => e.id === id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (!event.registrationOpen) {
      return res.status(400).json({ success: false, message: 'Registrations are closed for this event.' });
    }

    const existingReg = db.registrations.find(
      (r) => r.eventId === id && r.userId === uid && r.status === 'Confirmed'
    );
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event.' });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'This event has reached full seating capacity. Please check back for cancellations.',
      });
    }

    // Add registration
    const regId = `reg_${crypto.randomUUID().slice(0, 10)}`;
    const regRecord: EventRegistrationRecord = {
      id: regId,
      eventId: id,
      userId: uid,
      userName: String(userName),
      userEmail: userEmail ? String(userEmail) : undefined,
      registeredAt: new Date().toISOString(),
      status: 'Confirmed',
    };
    db.registrations.push(regRecord);

    // Increment count
    event.registeredCount += 1;
    saveDb(db);

    // Cross-module notification dispatch!
    dispatchNotification({
      userId: uid,
      title: `Registration Confirmed: ${event.title}`,
      description: `Your pass for ${event.title} is confirmed at ${event.venue}. We look forward to seeing you!`,
      details: `Event starts ${event.date} • ${event.time}. Bring your student ID card or KAMPUS digital pass.`,
      category: 'Campus',
      priority: 'Important',
      linkRoute: 'CampusLife',
      actionLabel: 'View Event',
      sourceModule: 'campus_life',
      important: true,
    });

    return res.json({
      success: true,
      message: 'Successfully registered for event.',
      registration: regRecord,
      event: {
        ...event,
        isRegistered: true,
        spotsLeft: Math.max(0, event.capacity - event.registeredCount),
      },
    });
  });

  // 4. Cancel Event Registration
  app.post('/api/campus-life/events/:id/cancel', (req: Request, res: Response) => {
    const { id } = req.params;
    const uid = getAuthenticatedUserId(req);

    const event = db.events.find((e) => e.id === id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const regIndex = db.registrations.findIndex(
      (r) => r.eventId === id && r.userId === uid && r.status === 'Confirmed'
    );
    if (regIndex === -1) {
      return res.status(400).json({ success: false, message: 'No active registration found to cancel.' });
    }

    db.registrations[regIndex].status = 'Cancelled';
    event.registeredCount = Math.max(0, event.registeredCount - 1);
    saveDb(db);

    dispatchNotification({
      userId: uid,
      title: `Registration Cancelled: ${event.title}`,
      description: `Your registration for ${event.title} has been cancelled. Your seat has been released for other students.`,
      category: 'Campus',
      priority: 'Normal',
      linkRoute: 'CampusLife',
      sourceModule: 'campus_life',
    });

    return res.json({
      success: true,
      message: 'Registration successfully cancelled.',
      event: {
        ...event,
        isRegistered: false,
        spotsLeft: Math.max(0, event.capacity - event.registeredCount),
      },
    });
  });

  // 5. Clubs List
  app.get('/api/campus-life/clubs', (req: Request, res: Response) => {
    const uid = getAuthenticatedUserId(req);
    const category = req.query.category ? String(req.query.category).trim() : null;
    const joinedClubIds = new Set(
      db.memberships
        .filter((m) => m.userId === uid && m.status === 'Active')
        .map((m) => m.clubId)
    );

    let list = [...db.clubs];
    if (category && category !== 'All') {
      list = list.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }

    const clubs = list.map((c) => ({
      ...c,
      isMember: joinedClubIds.has(c.id),
    }));

    return res.json({ clubs, count: clubs.length });
  });

  // 6. Join Club / Request Membership
  app.post('/api/campus-life/clubs/:id/join', (req: Request, res: Response) => {
    const { id } = req.params;
    const uid = getAuthenticatedUserId(req);
    const { userName = 'KAMPUS Student' } = req.body || {};

    const club = db.clubs.find((c) => c.id === id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found.' });

    const existingMem = db.memberships.find(
      (m) => m.clubId === id && m.userId === uid && m.status === 'Active'
    );
    if (existingMem) {
      return res.status(400).json({ success: false, message: 'You are already an active member of this club.' });
    }

    const memRecord: ClubMembershipRecord = {
      id: `mem_${crypto.randomUUID().slice(0, 10)}`,
      clubId: id,
      userId: uid,
      userName: String(userName),
      joinedAt: new Date().toISOString(),
      status: 'Active',
    };
    db.memberships.push(memRecord);
    club.membersCount += 1;
    saveDb(db);

    dispatchNotification({
      userId: uid,
      title: `Welcome to ${club.name}!`,
      description: `Your membership application has been approved. Connect with club lead ${club.leadName} for onboarding.`,
      details: `Weekly meetings: ${club.meetingSchedule} at ${club.venue}.`,
      category: 'Campus',
      priority: 'Important',
      linkRoute: 'CampusLife',
      actionLabel: 'Open Club',
      sourceModule: 'campus_life',
      important: true,
    });

    return res.json({
      success: true,
      message: `Welcome to ${club.name}!`,
      club: { ...club, isMember: true },
    });
  });

  // 7. Announcements List
  app.get('/api/campus-life/announcements', (_req: Request, res: Response) => {
    return res.json({ announcements: db.announcements, count: db.announcements.length });
  });

  // 8. Lost & Found List
  app.get('/api/campus-life/lost-found', (req: Request, res: Response) => {
    const type = req.query.type ? String(req.query.type).trim() : null;
    let list = [...db.lostAndFound];
    if (type && (type === 'Lost' || type === 'Found')) {
      list = list.filter((i) => i.type === type);
    }
    return res.json({ items: list, count: list.length });
  });

  // 9. Report Lost or Found Item
  app.post('/api/campus-life/lost-found', (req: Request, res: Response) => {
    const uid = getAuthenticatedUserId(req);
    const {
      title,
      description,
      type = 'Lost',
      category = 'Other',
      location,
      reporterName = 'KAMPUS Student',
      reporterContact,
      imageUrl,
    } = req.body || {};

    if (!title || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and location are required.',
      });
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newItem: LostAndFoundItem = {
      id: `lf_${crypto.randomUUID().slice(0, 10)}`,
      title: String(title).trim(),
      description: String(description).trim(),
      type: type === 'Found' ? 'Found' : 'Lost',
      category: category as any,
      location: String(location).trim(),
      dateReported: dateFormatted,
      status: 'Open',
      reporterId: uid,
      reporterName: String(reporterName).trim(),
      reporterContact: reporterContact ? String(reporterContact).trim() : undefined,
      imageUrl: imageUrl ? String(imageUrl) : undefined,
      createdAt: now.toISOString(),
    };

    db.lostAndFound.unshift(newItem);
    saveDb(db);

    dispatchNotification({
      userId: uid,
      title: `Lost & Found Post Live`,
      description: `Your ${newItem.type.toLowerCase()} report for "${newItem.title}" has been published to student discovery feeds.`,
      category: 'Campus',
      priority: 'Normal',
      linkRoute: 'CampusLife',
      sourceModule: 'campus_life',
    });

    return res.status(201).json({
      success: true,
      message: 'Item reported successfully.',
      item: newItem,
    });
  });

  // 10. Mark Lost & Found Item as Claimed/Resolved
  app.patch('/api/campus-life/lost-found/:id/resolve', (req: Request, res: Response) => {
    const { id } = req.params;
    const uid = getAuthenticatedUserId(req);

    const item = db.lostAndFound.find((i) => i.id === id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    item.status = 'Resolved';
    saveDb(db);

    dispatchNotification({
      userId: uid,
      title: `Item Resolved: ${item.title}`,
      description: `Item "${item.title}" has been marked as resolved and closed.`,
      category: 'Campus',
      priority: 'Normal',
      linkRoute: 'CampusLife',
      sourceModule: 'campus_life',
    });

    return res.json({ success: true, item });
  });

  console.log('[CampusLifeBackend] Registered Campus Life endpoints on /api/campus-life/*');
}
