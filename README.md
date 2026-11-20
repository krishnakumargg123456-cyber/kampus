# KAMPUS – Your Student Life, Connected.
## Production-Ready Student Mobile Application & Ecosystem

Welcome to **KAMPUS**, the comprehensive student ecosystem engineered for university and college campuses. KAMPUS bridges academics, Google Gemini AI assistance, student peer communities, career & placement tracking, campus life notices, a student marketplace, and a centralized Super Admin Control Center into an app-first experience.

---

## 📱 Architecture & Tech Stack

### 1. Mobile Application (`mobile/`)
- **Framework**: React Native with Expo (SDK 52) & TypeScript
- **Navigation**: React Navigation (Bottom Tab Navigator with 5 main tabs + Native Stack)
- **Design System**: Dynamic Design Tokens (Colors, Typography, Elevation, Spacing), Dark & Light Theme synchronization with Super Admin branding
- **Build Workflows**: Android (APK & AAB) and iOS (IPA) ready via standard `eas.json` & `app.json`

### 2. Backend & Real-time Services (`server/`)
- **Server**: Node.js & Express with TypeScript (`server.ts`)
- **Real-time Messaging**: WebSockets (`ws`) for 1-to-1 Chat, Group Chat, and Live 24/7 Study Rooms
- **AI Engine**: Google Gemini API via `@google/genai` (Document analysis, Question solving, Flashcards, Quiz generator)
- **Auth & Security**: Real 6-digit cryptographic Email OTP verification, bcrypt password hashing, and signed JWT session tokens

### 3. Database Layer (`database/`)
- **Production Database**: PostgreSQL (`database/schema.sql` with 21 relational tables)
- **High-Resilience Fallback**: Auto-detects PostgreSQL (`DATABASE_URL`). In local/offline mode, operates seamlessly with persistent JSON storage (`.kampus_*_db.json`) ensuring **zero data loss**!

---

## 🎯 The 10 Primary Navigation Features (Preserving all 21 Legacy Modules)

```
========================================================================================
FEATURE 1: STUDY HUB               -> Subjects, Notes Download/Upload, PYQs, Tests
FEATURE 2: KAMPUS AI               -> 24/7 AI Copilot (Gemini), PDF Analyzer, Quizzes
FEATURE 3: STUDENT COMMUNITY       -> Community Feed, Real-time Chat, Study Partners, SkillSwap
FEATURE 4: CAMPUS LIFE             -> Official Circulars, Hackathons, Clubs, Student Voice
FEATURE 5: CAREER & PLACEMENT      -> Verified Internships, ATS Resume Builder, Roadmaps
FEATURE 6: COLLEGE EXPLORER        -> NIRF Ranked Colleges, Cutoffs, Reviews & Comparisons
FEATURE 7: KAMPUS MARKET           -> Peer-to-Peer Marketplace, Books, Electronics, Free Corner
FEATURE 8: STUDENT TOOLKIT         -> Daily Tasks, Pomodoro Timer, Digital Locker Vault
FEATURE 9: KAMPUS ID & PROFILE     -> Verified Digital Student ID Card & Signed QR Pass
FEATURE 10: SETTINGS & PRIVACY     -> Account Security, Sessions, Theme, DPDP Data Export
----------------------------------------------------------------------------------------
SUPER ADMIN CONTROL CENTER         -> 14 Admin Modules, RBAC, Homepage Builder, Branding
========================================================================================
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.x (`node -v`)
- npm >= 10.x (`npm -v`)
- (Optional) PostgreSQL database instance
- (Optional) Google Gemini API Key

### 1. Backend Server Setup
From the root directory:
```bash
# Install dependencies
npm install --legacy-peer-deps

# Configure environment variables
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY, DATABASE_URL, and SMTP credentials if available

# Run unit tests verifying Authentication & Real OTP
npx tsx tests/authBackend.test.ts

# Start the Backend Server (Port 3000)
npm run dev
```

### 2. Mobile Application Setup
From the `mobile/` directory:
```bash
cd mobile

# Install mobile dependencies
npm install --legacy-peer-deps

# Verify TypeScript compilation (0 errors)
npx tsc --noEmit

# Start Expo Development Server
npm start
```
- Press `a` in the terminal to launch on an **Android Emulator / Device**.
- Press `i` to launch on an **iOS Simulator**.
- Press `w` to launch in a **Web Browser**.
- Or scan the QR code using the **Expo Go** mobile app on your physical phone!

---

## 🔐 Authentication Specifications

KAMPUS features a dual-login authentication gateway:

### Option A: Email + Password Login
- Validated email & bcrypt hashed password
- 30-day authenticated JWT session token
- Protection against brute-force login attempts

### Option B: Real Email OTP Login
- Dispatches a 6-digit cryptographic code via SMTP gateway (`nodemailer`)
- When running in local dev environments without SMTP configured, the code is output directly to the secure server console:
  ```
  ====================================================
  [KAMPUS REAL EMAIL OTP] To: student@kampus.edu.in
  >>> VERIFICATION CODE: [ 943726 ] <<<
  ====================================================
  ```
- 10-minute TTL expiry with strict 60-second cooldown and replay protection

### 5-Step Registration Wizard
1. **Personal**: Full Name, Email, Mobile
2. **Academic**: College, Course, Branch, Semester, Enrollment No
3. **Security**: Password & Confirmation
4. **Verification**: Real 6-digit OTP confirmation
5. **Onboarding**: Academic interests & key skills selection

---

## 🛠️ Super Admin Control Center

Accessible directly inside the Mobile App (via `More -> Super Admin Control Center`) and via the Web Portal (`/admin`):

1. **Overview Dashboard**: Active students, DAU/MAU, pending uploads, Gemini query metrics
2. **Feature Management**: Live toggles for each of the 10 main features
3. **Design & Branding Control**: Modify global primary colors, theme modes, and app display titles with instant reflection across client apps
4. **User & RBAC Management**: Manage Super Admins, Moderators, and Content Managers
5. **Security & Audit Logs**: Immutable chronological logs of all administrative modifications

---

## 📦 Building Mobile Binaries (Android & iOS)

KAMPUS is configured for **EAS Build** (Expo Application Services):

```bash
cd mobile

# Build Android APK for testing
npx eas-cli build --platform android --profile preview

# Build Android Production App Bundle (AAB for Google Play Store)
npx eas-cli build --platform android --profile production

# Build iOS Production Archive (IPA for Apple App Store / TestFlight)
npx eas-cli build --platform ios --profile production
```

---

## 📜 Privacy & Compliance
KAMPUS adheres to the Digital Personal Data Protection (DPDP) Act:
- Student academic documents are client-side encrypted in the Digital Locker Vault.
- Complete data export functionality allows students to download their entire history in machine-readable JSON format.
- One-click account deletion permanently removes user data and active sessions.
