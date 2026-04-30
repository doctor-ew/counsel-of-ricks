"""Report generation endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Session
from app.schemas.sessions import SessionSummary
from app.services.reports import ReportService

router = APIRouter()


@router.get("/sessions/{session_id}/report", response_model=SessionSummary)
async def get_report(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> SessionSummary:
    """Get or generate a session report."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # If session has cached summary, return it
    if session.summary:
        return SessionSummary(**session.summary)

    # Otherwise generate fresh
    service = ReportService(db)
    return await service.generate_report(session_id)


@router.get("/sessions/{session_id}/report/export")
async def export_report(
    session_id: UUID,
    format: str = "markdown",
    db: AsyncSession = Depends(get_db),
) -> PlainTextResponse:
    """Export session report as markdown or plain text."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    service = ReportService(db)
    report = await service.generate_report(session_id)

    if format == "markdown":
        content = service.to_markdown(report)
        media_type = "text/markdown"
        filename = f"session_{session_id}_report.md"
    else:
        content = service.to_plaintext(report)
        media_type = "text/plain"
        filename = f"session_{session_id}_report.txt"

    return PlainTextResponse(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
