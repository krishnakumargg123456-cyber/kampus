import techCampusImg from '../assets/images/college_iit_tech_campus_1794572775766.jpg';
import medicalCampusImg from '../assets/images/college_medical_hospital_1794572776634.jpg';
import managementCampusImg from '../assets/images/college_management_quad_1794572777420.jpg';
import artsCampusImg from '../assets/images/college_arts_heritage_1794572776602.jpg';
import pharmacyCampusImg from '../assets/images/college_pharmacy_research_1794572777261.jpg';
import heroCampusImg from '../assets/images/hero_students_campus_1794449577723.jpg';
import campusLifeImg from '../assets/images/campus_life_activities_1794488255584.jpg';
import stemLabImg from '../assets/images/studyhub_science_stem_1794549223458.jpg';
import libraryDeskImg from '../assets/images/studyhub_desk_hero_1794549223041.jpg';
import workshopSeminarImg from '../assets/images/events_workshop_seminar_1794564537593.jpg';
import hackathonHallImg from '../assets/images/events_tech_hackathon_1794564537496.jpg';
import scholarshipAwardImg from '../assets/images/scholarships_award_grant_1794489529498.jpg';
import booksStudyImg from '../assets/images/community_books_study_1794552226075.jpg';
import type {
  AdmissionStatus,
  CollegeType,
  DegreeLevel,
  ReviewCategory,
  ScholarshipCategory,
  TrackerApplicationStatus,
} from '../types/collegeExplorer';

export const COLLEGE_PHOTO_ASSETS: Record<string, string> = {
  tech_campus: techCampusImg,
  medical_campus: medicalCampusImg,
  management_campus: managementCampusImg,
  arts_heritage: artsCampusImg,
  pharmacy_research: pharmacyCampusImg,
  hero_quad: heroCampusImg,
  campus_life: campusLifeImg,
  stem_lab: stemLabImg,
  library_desk: libraryDeskImg,
  seminar_hall: workshopSeminarImg,
  hackathon_center: hackathonHallImg,
  scholarship_award: scholarshipAwardImg,
  law_library: booksStudyImg,
};

export function resolveCollegePhoto(photoKey?: string): string {
  if (!photoKey) return techCampusImg;
  if (photoKey.startsWith('http://') || photoKey.startsWith('https://') || photoKey.startsWith('data:image/')) {
    return photoKey;
  }
  return COLLEGE_PHOTO_ASSETS[photoKey] || techCampusImg;
}

export const ALL_COLLEGE_TYPES: CollegeType[] = [
  'University',
  'Government College',
  'Private College',
  'Deemed University',
  'Autonomous College',
  'Medical College',
  'Engineering College',
  'Pharmacy College',
  'Management College',
  'Arts and Science College',
  'Law College',
  'Nursing College',
  'Polytechnic Institution',
];

export const ALL_DEGREE_LEVELS: DegreeLevel[] = [
  'Undergraduate',
  'Postgraduate',
  'Diploma',
  'Professional',
  'Certificate',
];

export const ALL_ADMISSION_STATUSES: AdmissionStatus[] = [
  'Open',
  'Closing Soon',
  'Upcoming',
  'Closed',
  'Check Official Portal',
];

export const ALL_TRACKER_STATUSES: TrackerApplicationStatus[] = [
  'Interested',
  'Researching',
  'Preparing Documents',
  'Application Started',
  'Applied',
  'Entrance Examination',
  'Interview',
  'Selected',
  'Waitlisted',
  'Rejected',
];

export const ALL_REVIEW_CATEGORIES: ReviewCategory[] = [
  'Academics',
  'Faculty',
  'Campus Facilities',
  'Hostel',
  'Infrastructure',
  'Student Support',
  'Placement Support',
  'Campus Environment',
];

export const ALL_SCHOLARSHIP_CATEGORIES: ScholarshipCategory[] = [
  'Government',
  'University',
  'Merit-Based',
  'Need-Based',
  'Category-Specific',
  'Private',
];

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'Not published';
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatExplorerDate(iso?: string): string {
  if (!iso) return 'Check official portal';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
