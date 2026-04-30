-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'other',
    deponent_name VARCHAR(200),
    total_pages INTEGER,
    ingested_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Chunks table (with embeddings)
CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

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

-- Profile Documents junction table
CREATE TABLE IF NOT EXISTS profile_documents (
    profile_id UUID REFERENCES witness_profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    familiarity_level VARCHAR(50) DEFAULT 'familiar',
    PRIMARY KEY (profile_id, document_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    witness_name VARCHAR(200) NOT NULL,
    profile_id UUID REFERENCES witness_profiles(id),
    agent_mode VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    summary JSONB
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    arbiter_flags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fact Ledger table
CREATE TABLE IF NOT EXISTS fact_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    fact_text TEXT NOT NULL,
    confidence VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_message_id UUID REFERENCES messages(id),
    citations JSONB DEFAULT '[]',
    contradicts JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    superseded_by UUID REFERENCES fact_ledger(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS chunks_document_idx ON chunks(document_id);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS messages_session_idx ON messages(session_id);
CREATE INDEX IF NOT EXISTS fact_ledger_session_idx ON fact_ledger(session_id);
CREATE INDEX IF NOT EXISTS sessions_profile_idx ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS profile_documents_profile_idx ON profile_documents(profile_id);
CREATE INDEX IF NOT EXISTS profile_documents_document_idx ON profile_documents(document_id);
