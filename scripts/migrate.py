"""
Run all SQL migrations against DATABASE_URL in order, idempotently.
Called by Railway start command before uvicorn boots.

Execution order:
  1. docker/init.sql   — full base schema (all IF NOT EXISTS)
  2. migrations/*.sql  — incremental changes, sorted lexicographically

Tracks applied migrations in a `_migrations` table so re-running is safe.
"""

import asyncio
import os
import re
import sys
from pathlib import Path

import asyncpg

HERE = Path(__file__).parent.parent  # project root


async def run() -> None:
    raw_url = os.environ.get("DATABASE_URL", "")
    if not raw_url:
        print("ERROR: DATABASE_URL not set", flush=True)
        sys.exit(1)

    # asyncpg uses plain postgres:// or postgresql://
    url = re.sub(r"^postgresql\+asyncpg://", "postgresql://", raw_url)
    url = re.sub(r"^postgres\+asyncpg://", "postgres://", url)

    print(f"Connecting to database…", flush=True)
    conn = await asyncpg.connect(url)

    try:
        # Tracking table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                name TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        # Collect files: base schema first, then numbered migrations
        files: list[Path] = []
        base = HERE / "docker" / "init.sql"
        if base.exists():
            files.append(base)
        for f in sorted((HERE / "migrations").glob("*.sql")):
            files.append(f)

        for path in files:
            name = path.name
            already = await conn.fetchval(
                "SELECT name FROM _migrations WHERE name = $1", name
            )
            if already:
                print(f"  skip  {name}", flush=True)
                continue

            sql = path.read_text()
            print(f"  apply {name}", flush=True)
            await conn.execute(sql)
            await conn.execute(
                "INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING",
                name,
            )
            print(f"  done  {name}", flush=True)

        print("Migrations complete.", flush=True)

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run())
