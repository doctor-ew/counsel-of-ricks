-- sql/ghost-bootstrap.sql
-- One-shot bootstrap applied to ghost.build (Timescale Cloud) on 2026-04-30.
-- Captures exactly the SQL run during initial Railway deploy setup.
--
-- For local Docker: use docker/docker-compose.yml which runs docker/init.sql.
-- For a new cloud DB: run this file once, then let scripts/migrate.py handle
-- any future migrations.
--
-- Requires: PostgreSQL 15+, pgvector extension available on the host.

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;  -- pgvector 0.8.2 on ghost.build

-- ── Core tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename      VARCHAR(500) NOT NULL,
    file_path     VARCHAR(1000) NOT NULL,
    document_type VARCHAR(50)  DEFAULT 'other',
    deponent_name VARCHAR(200),
    total_pages   INTEGER,
    ingested_at   TIMESTAMP DEFAULT NOW(),
    metadata      JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS chunks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID REFERENCES documents(id) ON DELETE CASCADE,
    page_number  INTEGER NOT NULL,
    chunk_index  INTEGER NOT NULL,
    content      TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    embedding    vector(1536),          -- OpenAI text-embedding-3-small
    metadata     JSONB DEFAULT '{}',
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS witness_profiles (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(200) NOT NULL,
    role                 VARCHAR(50)  NOT NULL,
    relationship_to_case TEXT NOT NULL,
    knowledge_areas      VARCHAR(200)[] DEFAULT '{}',
    limitations          TEXT,
    notes                TEXT,
    agent_intensity      INTEGER DEFAULT 5,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_documents (
    profile_id      UUID REFERENCES witness_profiles(id) ON DELETE CASCADE,
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
    familiarity_level VARCHAR(50) DEFAULT 'familiar',
    PRIMARY KEY (profile_id, document_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    witness_name VARCHAR(200) NOT NULL,
    profile_id   UUID REFERENCES witness_profiles(id),
    agent_mode   VARCHAR(50)  NOT NULL,
    started_at   TIMESTAMP DEFAULT NOW(),
    ended_at     TIMESTAMP,
    status       VARCHAR(50) DEFAULT 'active',
    summary      JSONB
);

CREATE TABLE IF NOT EXISTS messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role         VARCHAR(50) NOT NULL,
    content      TEXT NOT NULL,
    citations    JSONB DEFAULT '[]',
    arbiter_flags JSONB DEFAULT '[]',
    truth_score  INTEGER NULL,          -- GH-8: arbiter confidence 0-100, null = pre-migration row
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fact_ledger (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID REFERENCES sessions(id) ON DELETE CASCADE,
    fact_text        TEXT NOT NULL,
    confidence       VARCHAR(50) NOT NULL,
    source_type      VARCHAR(50) NOT NULL,
    source_message_id UUID REFERENCES messages(id),
    citations        JSONB DEFAULT '[]',
    contradicts      JSONB DEFAULT '[]',
    created_at       TIMESTAMP DEFAULT NOW(),
    superseded_by    UUID REFERENCES fact_ledger(id)
);

-- ── Migration tracker (used by scripts/migrate.py) ────────────────────────────
CREATE TABLE IF NOT EXISTS _migrations (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mark all baseline migrations as already applied so migrate.py skips them.
INSERT INTO _migrations (name) VALUES
    ('init.sql'),
    ('001_add_witness_profiles.sql'),
    ('002_add_message_truth_score.sql'),
    ('003_create_migrations_tracker.sql')
ON CONFLICT DO NOTHING;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS chunks_document_idx
    ON chunks(document_id);

CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS messages_session_idx
    ON messages(session_id);

CREATE INDEX IF NOT EXISTS fact_ledger_session_idx
    ON fact_ledger(session_id);

CREATE INDEX IF NOT EXISTS sessions_profile_idx
    ON sessions(profile_id);

CREATE INDEX IF NOT EXISTS profile_documents_profile_idx
    ON profile_documents(profile_id);

CREATE INDEX IF NOT EXISTS profile_documents_document_idx
    ON profile_documents(document_id);
