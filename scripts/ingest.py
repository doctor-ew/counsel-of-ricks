#!/usr/bin/env python3
"""CLI script for document ingestion."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.db.database import async_session_maker
from app.services.ingestion import IngestionService


async def main(directory: str | None = None):
    """Run document ingestion."""
    settings = get_settings()
    target_dir = directory or settings.documents_path

    if not target_dir:
        print("Error: No directory specified. Set DOCUMENTS_PATH in .env or pass as argument.")
        sys.exit(1)

    print(f"Starting ingestion from: {target_dir}")

    async with async_session_maker() as db:
        service = IngestionService(db)
        result = await service.ingest_directory(target_dir)
        await db.commit()

    print(f"\nIngestion complete!")
    print(f"  Documents ingested: {result.documents_ingested}")
    print(f"  Total chunks: {result.total_chunks}")

    if result.errors:
        print(f"\nErrors ({len(result.errors)}):")
        for error in result.errors[:10]:
            print(f"  - {error}")
        if len(result.errors) > 10:
            print(f"  ... and {len(result.errors) - 10} more")


if __name__ == "__main__":
    directory = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(main(directory))
