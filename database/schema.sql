-- KAMPUS Database Schema (PostgreSQL)
-- Production-ready relational schema for the complete KAMPUS ecosystem

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Module State Storage (Versioned JSONB State for High-Integrity Module Backends)
CREATE TABLE IF NOT EXISTS module_state (
    module_key VARCHAR(128) PRIMARY KEY,
    state JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    checksum VARCHAR(64) NOT NULL,
    record_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_module_state_updated ON module_state(updated_at);

-- 1. Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    mobile VARCHAR(32),
    name VARCHAR(255) NOT NULL,
    college VARCHAR(255),
    course VARCHAR(255),
    branch VARCHAR(255),
    semester VARCHAR(64),
    enrollment_no VARCHAR(128),
    avatar_url TEXT,
    bio TEXT,
    skills TEXT[],
    interests TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(32) NOT NULL, -- 'login', 'register', 'forgot_password'
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_tokens(email, purpose);

CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Admin System & RBAC
CREATE TABLE IF NOT EXISTS admin_roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(128),
    role_id VARCHAR(64) REFERENCES admin_roles(id),
    status VARCHAR(32) DEFAULT 'Active', -- 'Active', 'Suspended'
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id VARCHAR(64) NOT NULL,
    admin_email VARCHAR(255),
    action VARCHAR(128) NOT NULL,
    section VARCHAR(64) NOT NULL,
    target_id VARCHAR(128),
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Dynamic App Configuration & Branding
CREATE TABLE IF NOT EXISTS app_configurations (
    key VARCHAR(128) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by VARCHAR(64),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_configurations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    icon VARCHAR(64),
    cover_image TEXT,
    banner_image TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT,
    order_index INT DEFAULT 0,
    sub_features JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_sections (
    id VARCHAR(64) PRIMARY KEY,
    section_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    config_json JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Study Hub
CREATE TABLE IF NOT EXISTS study_subjects (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    course VARCHAR(255),
    semester VARCHAR(64),
    level VARCHAR(64),
    accent_color VARCHAR(32) DEFAULT 'blue',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_materials (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject_id VARCHAR(64),
    category VARCHAR(64) NOT NULL,
    level VARCHAR(64),
    semester VARCHAR(64),
    file_url TEXT NOT NULL,
    file_type VARCHAR(32) DEFAULT 'pdf',
    author_id VARCHAR(64),
    author_name VARCHAR(255),
    college VARCHAR(255),
    downloads_count INT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    reviews_count INT DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practice_tests (
    id VARCHAR(64) PRIMARY KEY,
    subject_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    duration_minutes INT DEFAULT 30,
    total_marks INT DEFAULT 100,
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. KAMPUS AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    mode VARCHAR(64) DEFAULT 'chat', -- 'chat', 'pdf_analysis', 'quiz_generator', 'notes_generator'
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Student Community & Real-time Messaging
CREATE TABLE IF NOT EXISTS community_posts (
    id VARCHAR(64) PRIMARY KEY,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    category VARCHAR(64) DEFAULT 'General',
    content TEXT NOT NULL,
    media_urls TEXT[],
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_comments (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) DEFAULT 'direct', -- 'direct', 'group'
    title VARCHAR(255),
    participant_ids TEXT[] NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Campus Life (Notices, Events, Clubs, Voice)
CREATE TABLE IF NOT EXISTS campus_notices (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) DEFAULT 'Academic',
    content TEXT NOT NULL,
    college VARCHAR(255),
    is_official BOOLEAN DEFAULT TRUE,
    published_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campus_events (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    college VARCHAR(255),
    date VARCHAR(64) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    category VARCHAR(64),
    banner_url TEXT,
    organizer_name VARCHAR(255),
    capacity INT DEFAULT 500,
    registered_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(64) REFERENCES campus_events(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    ticket_code VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS campus_clubs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    college VARCHAR(255),
    description TEXT,
    category VARCHAR(64),
    logo_url TEXT,
    members_count INT DEFAULT 0,
    leads JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_voice_posts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Grievance', 'Feedback', 'Suggestion'
    description TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'Under Review', -- 'Under Review', 'In Progress', 'Resolved', 'Closed'
    upvotes INT DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Career & Placements
CREATE TABLE IF NOT EXISTS career_opportunities (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_logo TEXT,
    type VARCHAR(32) NOT NULL, -- 'Internship', 'Full-time', 'Part-time'
    location VARCHAR(255) NOT NULL,
    stipend_or_salary VARCHAR(128),
    deadline VARCHAR(64),
    requirements TEXT[],
    apply_url TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS career_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id VARCHAR(64) REFERENCES career_opportunities(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'Applied', -- 'Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. College Explorer
CREATE TABLE IF NOT EXISTS college_directory (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(128) NOT NULL,
    city VARCHAR(128) NOT NULL,
    category VARCHAR(64),
    rating NUMERIC(3, 2) DEFAULT 4.5,
    established_year INT,
    courses_offered TEXT[],
    nirf_rank INT,
    fees_range VARCHAR(128),
    image_url TEXT,
    website_url TEXT,
    reviews JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. KAMPUS Market
CREATE TABLE IF NOT EXISTS market_listings (
    id VARCHAR(64) PRIMARY KEY,
    seller_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    seller_name VARCHAR(255) NOT NULL,
    seller_college VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Books', 'Electronics', 'Hostel Essentials', 'Stationery', 'Free'
    description TEXT NOT NULL,
    price INT DEFAULT 0,
    condition VARCHAR(64) DEFAULT 'Good',
    images TEXT[],
    status VARCHAR(32) DEFAULT 'Active', -- 'Active', 'Sold', 'Reserved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Student Toolkit (Planner, Locker, Rewards, Notifications)
CREATE TABLE IF NOT EXISTS planner_tasks (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(128),
    due_date VARCHAR(64),
    priority VARCHAR(32) DEFAULT 'Medium',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locker_files (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Mark Sheet', 'Certificate', 'ID Proof', 'Notes'
    file_url TEXT NOT NULL,
    file_size_kb INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_rewards (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points INT DEFAULT 120,
    tier VARCHAR(32) DEFAULT 'Silver Scholar',
    streak_days INT DEFAULT 5,
    badges JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(64) DEFAULT 'General',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Schema Migrations & Alterations for Existing Databases
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_salt VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS module_state (
    module_key VARCHAR(128) PRIMARY KEY,
    state JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    checksum VARCHAR(64) NOT NULL,
    record_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_module_state_updated ON module_state(updated_at);

