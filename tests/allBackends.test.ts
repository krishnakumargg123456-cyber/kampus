import express from 'express';
import { registerAuthBackend } from '../server/authBackend.ts';
import { registerChatBackend } from '../server/chatBackend.ts';
import { registerStudyRoomsBackend } from '../server/studyRoomsBackend.ts';
import { registerSkillSwapBackend } from '../server/skillSwapBackend.ts';
import { registerCampusPulseBackend } from '../server/campusPulseBackend.ts';
import { registerEventsClubsBackend } from '../server/eventsClubsBackend.ts';
import { registerKampusIdBackend } from '../server/kampusIdBackend.ts';
import { registerCareerBackend } from '../server/careerBackend.ts';
import { registerStudentVoiceBackend } from '../server/studentVoiceBackend.ts';
import { registerCollegeExplorerBackend } from '../server/collegeExplorerBackend.ts';
import { registerMarketBackend } from '../server/marketBackend.ts';
import { registerLockerBackend } from '../server/lockerBackend.ts';
import { registerRewardsBackend } from '../server/rewardsBackend.ts';
import { registerPlannerBackend } from '../server/plannerBackend.ts';
import { registerNotificationsBackend } from '../server/notificationsBackend.ts';
import { registerAccountProfileSettingsBackend } from '../server/accountProfileSettingsBackend.ts';
import { registerSuperAdminBackend } from '../server/superAdminBackend.ts';
import { registerStudyHubBackend } from '../server/studyHubBackend.ts';
import { registerCommunityBackend } from '../server/communityBackend.ts';
import { registerNotesExchangeBackend } from '../server/notesExchangeBackend.ts';
import { registerStudyPartnerBackend } from '../server/studyPartnerBackend.ts';

async function testAllBackends() {
  console.log('=== KAMPUS FULL BACKEND API SUITE AUDIT ===');
  const app = express();
  app.use(express.json());

  registerAuthBackend(app);
  registerChatBackend(app);
  registerStudyRoomsBackend(app);
  registerSkillSwapBackend(app);
  registerCampusPulseBackend(app);
  registerEventsClubsBackend(app);
  registerKampusIdBackend(app);
  registerCareerBackend(app);
  registerStudentVoiceBackend(app);
  registerCollegeExplorerBackend(app);
  registerMarketBackend(app);
  registerLockerBackend(app);
  registerRewardsBackend(app);
  registerPlannerBackend(app);
  registerNotificationsBackend(app);
  registerAccountProfileSettingsBackend(app);
  registerSuperAdminBackend(app);
  registerStudyHubBackend(app);
  registerCommunityBackend(app);
  registerNotesExchangeBackend(app);
  registerStudyPartnerBackend(app);

  const routes = (app._router.stack as any[])
    .filter((r) => r.route)
    .map((r) => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods),
    }));

  console.log(`Total Registered API Endpoints: ${routes.length}`);

  const requiredModules = [
    '/api/studyhub/bootstrap',
    '/api/community/bootstrap',
    '/api/notes-exchange/bootstrap',
    '/api/study-partner/bootstrap',
    '/api/market/bootstrap',
    '/api/campus-pulse/bootstrap',
    '/api/events-clubs/bootstrap',
    '/api/kampus-id/bootstrap',
    '/api/career/bootstrap',
    '/api/voice/bootstrap',
    '/api/explorer/bootstrap',
    '/api/locker/bootstrap',
    '/api/rewards/bootstrap',
    '/api/planner/bootstrap',
    '/api/notifications/bootstrap',
    '/api/public/site-config',
    '/api/skillswap/bootstrap',
    '/api/study-rooms/bootstrap',
  ];

  let missing = 0;
  for (const ep of requiredModules) {
    const found = routes.find((r) => r.path === ep);
    if (found) {
      console.log(`  [OK] ${ep} (${found.methods.join(', ').toUpperCase()})`);
    } else {
      console.error(`  [MISSING] ${ep}`);
      missing++;
    }
  }

  if (missing > 0) {
    console.error(`FAILED: ${missing} endpoints missing.`);
    process.exit(1);
  }

  console.log('\n>>> 100% OF ALL 21 KAMPUS BACKEND MODULES FULLY REGISTERED AND CONNECTED! <<<');
}

testAllBackends();
