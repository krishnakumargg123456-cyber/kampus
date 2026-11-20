# KAMPUS – System Architecture & Feature Mapping Master Document

## 1. Project Overview
- **App Name**: KAMPUS
- **Tagline**: Your Student Life, Connected.
- **Mission**: An all-in-one ecosystem for university and college students unifying academics, AI assistance, campus community, career development, campus events, peer-to-peer marketplace, digital student identity, and centralized administration.

---

## 2. 21 Legacy Modules to 10 Primary Features Mapping

| No. | 10 Primary Features | Legacy Modules Integrated | Key Sub-features & Capabilities |
|---|---|---|---|
| 1 | **STUDY HUB** | `StudyHubPage`, `NotesExchangePage` | Study Dashboard, Subject-wise Materials, Notes Sharing & Downloading, Previous Year Question Papers (PYQs), Question Bank, Practice & Mock Tests, Bookmarks, Notes Upload & Approval, Subject Explorer, Reminders, Study Analytics. |
| 2 | **KAMPUS AI** | `KampusAiPage`, `kampusAiService` | AI Chat Assistant, PDF & Document Analysis, Notes Generator, Question Solver, Topic Explainer, Quiz & Flashcard Generator, Exam Preparation, Ask From Notes, AI Study Planner, Conversation History. |
| 3 | **STUDENT COMMUNITY** | `CommunityPage`, `ChatPage`, `SkillSwapPage`, `StudyPartnerPage`, `StudyRoomsPage` | Community Feed, Discussion Forums, Student Q&A, 1-to-1 & Group Real-time Chat (WebSocket), Study Partner Discovery, Study Groups, Live Study Rooms, Shared Whiteboard, SkillSwap, Student Profiles, Polls, Reporting & Blocking. |
| 4 | **CAMPUS LIFE** | `CampusPulsePage`, `EventsClubsPage`, `StudentVoicePage` | Campus Pulse, Official College Notices, Announcements, Events Discovery & Registration, Clubs & Societies Management, Student Voice, Grievance / Feedback Tracker, Campus Polls, Campus Calendar, Lost & Found. |
| 5 | **CAREER & PLACEMENT** | `CareerPage` | Career Dashboard, Internship & Job Opportunities, Placement Drives, Interactive Resume Builder, Portfolio Builder, Career Roadmaps, Interview Prep, Technical Assessments, Aptitude Practice, Scholarships, Application Tracker. |
| 6 | **COLLEGE EXPLORER** | `CollegeExplorerPage` | College Search & Discovery, Detailed College Profiles, Course Explorer, Side-by-side College Comparison, Shortlisted Colleges, Admission & Cutoff Info, Scholarship Info, Moderated Student Reviews, Entrance Exams. |
| 7 | **KAMPUS MARKET** | `MarketPage` | Student Marketplace, Used Books, Electronics & Hardware, Hostel Essentials, Free Corner, Student Exchange, Product Listings with Multi-photo Upload, Seller Profiles, In-app Buyer-Seller Chat, Saved Listings, Reporting. |
| 8 | **STUDENT TOOLKIT** | `PlannerPage`, `DigitalLockerPage`, `RewardsPage`, `NotificationsPage` | Daily To-Do List, Study Planner, Assignment Tracker, Exam Countdown, Timetable, Study Goals, Habit Tracker, Focus Sessions (Pomodoro), Digital Locker Vault for Documents, Rewards Points, Challenges, Badges, Leaderboard, Notification Preferences. |
| 9 | **KAMPUS ID & PROFILE** | `KampusIdPage`, `ProfilePage` | Digital Student ID Card, Secure QR Code Verification, Complete Student Profile, Academic Records, Verified Skills & Interests, Achievements, Certifications, Project Showcase, Public Profile Sharing with Privacy Toggles. |
| 10 | **SETTINGS & PRIVACY** | `SettingsPage`, `AccountProfileSettingsContext` | Account Settings, Password Management, Email Management, Active Sessions & Device Management, Privacy Controls, Notification Preferences, Theme Switching (Light/Dark), Accessibility, Help & Support, Data Export, Account Deletion. |

---

## 3. Technology Stack Architecture

### Mobile Application
- **Framework**: React Native with Expo SDK 52 & TypeScript
- **Navigation**: React Navigation (Bottom Tab Navigator + Native Stack Navigator)
- **UI & Design System**: Custom Design Tokens (Colors, Typography, Elevation, Spacing), Lucide Icons, Glass & Solid Surface Tokens, Dark/Light Mode Engine synchronized with Super Admin Branding
- **Platforms**: Android (APK/AAB) & iOS (IPA) ready via standard Expo / EAS build configuration

### Backend
- **Server**: Node.js with Express & TypeScript (`server.ts` + modular domain routers in `server/`)
- **Real-time Engine**: WebSockets (`ws`) for Instant Messaging & Study Rooms
- **AI Engine**: Google Gemini API via `@google/genai` with rate-limiting, secure system prompts, and multi-modal document extraction (PDF, DOCX, Images)
- **Email & OTP Service**: Real 6-digit cryptographic OTP generation, SHA-256 OTP hashing, TTL expiry, rate-limiting, and SMTP/Nodemailer email transport with development verification console logging

### Database & Persistence
- **Production Database**: PostgreSQL with relational schema (Users, Profiles, OtpTokens, Sessions, AdminUsers, Roles, FeatureConfigs, HomepageConfigs, StudyMaterials, Notes, PracticeTests, CommunityPosts, ChatMessages, StudyRooms, Events, Clubs, CareerOpportunities, Applications, CollegeDirectory, MarketListings, PlannerTasks, LockerFiles, Rewards, Notifications, AuditLogs)
- **ORM / Query Engine**: PostgreSQL driver (`pg` pool) with automated migrations and JSON data seeder ensuring 100% data preservation from legacy `.kampus_*_db.json` files

### Super Admin Control Center
- **Architecture**: Independent role-based administrative control center accessible via web portal and mobile admin view
- **14 Admin Modules**: Overview Dashboard (KPIs, Charts), Student Management, Admin & Staff, Roles & Permissions, 10-Feature Management, Homepage Builder, Global Design & Branding Control, Content Management, Notifications Broadcast, Analytics & Reports, Security Center, Database & Backups, Global App Settings, Audit Logs
- **Security**: RBAC with permission enforcement, Admin Session Management, 2FA support, Audit trails recording before/after state (non-secret values).
