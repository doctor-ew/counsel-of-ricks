"""Fact ledger endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import FactLedger, Session
from app.schemas.ledger import ContradictionPair, FactEntry, FactUpdate, LedgerResponse
from app.services.ledger import LedgerService

router = APIRouter()


@router.get("/sessions/{session_id}/ledger", response_model=LedgerResponse)
async def get_ledger(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> LedgerResponse:
    """Get the fact ledger for a session."""
    # Verify session exists
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    service = LedgerService(db)
    return await service.get_ledger(session_id)


@router.get("/sessions/{session_id}/contradictions", response_model=list[ContradictionPair])
async def get_contradictions(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[ContradictionPair]:
    """Get all contradiction pairs for a session."""
    # Verify session exists
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    service = LedgerService(db)
    return await service.get_contradictions(session_id)


@router.patch("/ledger/{fact_id}", response_model=FactEntry)
async def update_fact(
    fact_id: UUID,
    update: FactUpdate,
    db: AsyncSession = Depends(get_db),
) -> FactEntry:
    """Update a fact's confidence or mark as superseded."""
    result = await db.execute(select(FactLedger).where(FactLedger.id == fact_id))
    fact = result.scalar_one_or_none()

    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")

    if update.confidence:
        fact.confidence = update.confidence

    if update.superseded_by:
        fact.superseded_by = update.superseded_by

    await db.flush()

    return FactEntry(
        id=fact.id,
        fact_text=fact.fact_text,
        confidence=fact.confidence,
        source_type=fact.source_type,
        citations=fact.citations,
        contradicts=fact.contradicts,
        created_at=fact.created_at,
    )
