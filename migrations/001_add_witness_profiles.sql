-- Migration: Add Witness Profiles feature
-- Run this on existing databases to add profile support

-- Witness Profiles table
CREATE TABLE IF NOT EXISTS witness_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL,
    relationship_to_case TEXT NOT NULL,
    knowledge_areas VARCHAR(200)[] DEFAULT '{}',
    limitations TEXT,
    notes TEXT,
    agent_intensity INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Profile Documents junction table (documents a witness is familiar with)
CREATE TABLE IF NOT EXISTS profile_documents (
    profile_id UUID REFERENCES witness_profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    familiarity_level VARCHAR(50) DEFAULT 'familiar',
    PRIMARY KEY (profile_id, document_id)
);

-- Add profile_id to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES witness_profiles(id);

-- Add index for profile lookups
CREATE INDEX IF NOT EXISTS sessions_profile_idx ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS profile_documents_profile_idx ON profile_documents(profile_id);
CREATE INDEX IF NOT EXISTS profile_documents_document_idx ON profile_documents(document_id);
