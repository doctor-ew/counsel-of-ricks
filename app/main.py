"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, chat, clerk, documents, health, ledger, profiles, questions, reports, sessions
from app.api.routes.auth import require_auth
from app.config import get_settings
from app.db.database import init_db

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    logger.info("Starting Deposition Prep Simulator...")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Deposition Prep Simulator",
    description="AI-powered deposition preparation system",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes (no auth required)
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])

# Protected routes (require valid JWT)
app.include_router(
    documents.router,
    prefix="/api/v1",
    tags=["documents"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    sessions.router,
    prefix="/api/v1",
    tags=["sessions"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    chat.router,
    prefix="/api/v1",
    tags=["chat"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    ledger.router,
    prefix="/api/v1",
    tags=["ledger"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    reports.router,
    prefix="/api/v1",
    tags=["reports"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    profiles.router,
    prefix="/api/v1",
    tags=["profiles"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    questions.router,
    prefix="/api/v1",
    tags=["questions"],
    dependencies=[Depends(require_auth)],
)
app.include_router(
    clerk.router,
    prefix="/api/v1",
    tags=["clerk"],
    dependencies=[Depends(require_auth)],
)

# Serve frontend static files in production
frontend_path = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_path.exists():
    # Serve static assets
    app.mount("/assets", StaticFiles(directory=frontend_path / "assets"), name="assets")

    # Catch-all route for SPA - serve index.html for all non-API routes
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Serve the SPA for all non-API routes."""
        # If it's an API route, this won't be reached (API routes are registered first)
        # For all other routes, serve index.html so React Router can handle them
        index_file = frontend_path / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return FileResponse(frontend_path / "index.html")
