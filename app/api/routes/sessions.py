"""Session management endpoints."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.models import Session, WitnessProfile
from app.schemas.sessions import ProfileBrief, SessionCreate, SessionResponse, SessionSummary
from app.services.session import SessionService

router = APIRouter()


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    request: SessionCreate,
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Create a new preparation session."""
    # Validate profile if provided
    profile = None
    if request.profile_id:
        result = await db.execute(
            select(WitnessProfile).where(WitnessProfile.id == request.profile_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

    session = Session(
        witness_name=request.witness_name,
        agent_mode=request.agent_mode,
        profile_id=request.profile_id,
    )
    db.add(session)
    await db.flush()

    response = SessionResponse(
        id=session.id,
        witness_name=session.witness_name,
        agent_mode=session.agent_mode,
        started_at=session.started_at,
        ended_at=session.ended_at,
        status=session.status,
        profile_id=session.profile_id,
        profile=ProfileBrief(id=profile.id, name=profile.name, role=profile.role) if profile else None,
    )
    return response


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[SessionResponse]:
    """List all sessions with optional status filtering."""
    query = select(Session).options(selectinload(Session.profile)).order_by(Session.started_at.desc())

    if status:
        query = query.where(Session.status == status)

    result = await db.execute(query)
    sessions = result.scalars().all()

    return [
        SessionResponse(
            id=s.id,
            witness_name=s.witness_name,
            agent_mode=s.agent_mode,
            started_at=s.started_at,
            ended_at=s.ended_at,
            status=s.status,
            profile_id=s.profile_id,
            profile=ProfileBrief(id=s.profile.id, name=s.profile.name, role=s.profile.role)
            if s.profile
            else None,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Get a specific session."""
    result = await db.execute(
        select(Session).options(selectinload(Session.profile)).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        id=session.id,
        witness_name=session.witness_name,
        agent_mode=session.agent_mode,
        started_at=session.started_at,
        ended_at=session.ended_at,
        status=session.status,
        profile_id=session.profile_id,
        profile=ProfileBrief(id=session.profile.id, name=session.profile.name, role=session.profile.role)
        if session.profile
        else None,
    )


@router.post("/sessions/{session_id}/end", response_model=SessionSummary)
async def end_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> SessionSummary:
    """End a session and generate summary."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    service = SessionService(db)
    summary = await service.generate_summary(session_id)

    session.status = "completed"
    session.ended_at = datetime.utcnow()
    session.summary = summary.model_dump()

    return summary


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete a session and all related data."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    return {"status": "deleted", "session_id": str(session_id)}
