-- Migration: 003_create_migrations_tracker.sql
-- Creates the _migrations tracking table used by scripts/migrate.py.
-- Applied to the ghost.build production DB on 2026-04-30 during initial deploy.
-- On a fresh Docker spin-up this table is already created by docker/init.sql,
-- so this is a no-op for local dev. Idempotent via IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS _migrations (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);
