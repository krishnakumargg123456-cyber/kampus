import { getBundledImage } from '../utils/assetResolver';

/**
 * Curated high-resolution, thematic photography for KAMPUS 21 modules & showcases.
 * Every module has a distinct, beautiful, high-quality image bundled by Vite.
 */

export const MODULE_IMAGES: Record<string, string> = {
  // LEARN
  'study-hub': getBundledImage('studyhub_desk_hero_1794549223041.jpg'),
  'kampus-ai': getBundledImage('ai_study_copilot_1794449593187.jpg'),
  'notes-exchange': getBundledImage('notes_exchange_hero_1794550950819.jpg'),

  // CONNECT
  'community': getBundledImage('community_coding_hub_1794552225706.jpg'),
  'study-partner': getBundledImage('studypartner_hero_collab_1794551403758.jpg'),
  'chat': getBundledImage('kampus_ai_study_companion_1794549950125.jpg'),
  'study-rooms': getBundledImage('studyhub_exam_prep_1794549223106.jpg'),
  'skillswap': getBundledImage('skillswap_hero_editorial_1794563089389.jpg'),

  // CAMPUS
  'campus-pulse': getBundledImage('college_management_quad_1794572777420.jpg'),
  'events-clubs': getBundledImage('campus_hackathon_1794407584703.jpg'),
  'kampus-id': getBundledImage('rewards_campus_pass_1794643813947.jpg'),
  'student-voice': getBundledImage('events_workshop_seminar_1794564537593.jpg'),
  'college-explorer': getBundledImage('college_iit_tech_campus_1794572775766.jpg'),

  // CAREER & OPPORTUNITIES
  'career': getBundledImage('career_students_workshop_1794488271245.jpg'),

  // MARKET & STUDENT SERVICES
  'market': getBundledImage('market_hero_student_desk_1794573425705.jpg'),
  'digital-locker': getBundledImage('digital_locker_vault_1794489268512.jpg'),
  'rewards': getBundledImage('rewards_study_pack_1794643814692.jpg'),
  'planner': getBundledImage('studyhub_science_stem_1794549223458.jpg'),

  // ACCOUNT
  'notifications': getBundledImage('notifications_centre_alerts_1794489268441.jpg'),
  'profile': getBundledImage('avatar_priya_1794407582447.jpg'),
  'settings': getBundledImage('settings_preferences_workspace_1794489269069.jpg'),
};

export const SHOWCASE_IMAGES = {
  hero: getBundledImage('hero_students_campus_1794449577723.jpg'),
  aiStudy: getBundledImage('student_laptop_study_1794488294857.jpg'),
  aiShowcase: getBundledImage('ai_study_copilot_1794449593187.jpg'),

  // Campus Life Showcase
  campusLifeWide: getBundledImage('campus_life_activities_1794488255584.jpg'),
  campusEvents: getBundledImage('events_cultural_fest_1794564537193.jpg'),
  studentActivities: getBundledImage('events_tech_hackathon_1794564537496.jpg'),
  announcements: getBundledImage('notes_exchange_hero_1794550950819.jpg'),
  communityHighlights: getBundledImage('community_books_study_1794552226075.jpg'),

  // Career Showcase
  careerWorkshopWide: getBundledImage('career_students_workshop_1794488271245.jpg'),
  internships: getBundledImage('rewards_career_kit_1794643814961.jpg'),
  scholarships: getBundledImage('scholarships_award_grant_1794489529498.jpg'),
  workshops: getBundledImage('events_workshop_seminar_1794564537593.jpg'),
  placements: getBundledImage('kampus_ai_document_studio_1794549950075.jpg'),
};
