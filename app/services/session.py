"""Session management service."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FactLedger, Message, Session
from app.schemas.sessions import SessionSummary


class SessionService:
    """Service for session management and summary generation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_summary(self, session_id: UUID) -> SessionSummary:
        """Generate a comprehensive session summary."""
        # Get session
        result = await self.db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one()

        # Get message count
        msg_result = await self.db.execute(
            select(func.count(Message.id)).where(Message.session_id == session_id)
        )
        total_messages = msg_result.scalar() or 0

        # Get facts
        facts_result = await self.db.execute(
            select(FactLedger)
            .where(FactLedger.session_id == session_id)
            .where(FactLedger.superseded_by.is_(None))
        )
        facts = facts_result.scalars().all()

        # Calculate stats
        facts_established = len(facts)
        contradictions_found = sum(1 for f in facts if f.contradicts)
        unsupported_claims = sum(1 for f in facts if not f.citations)

        # Calculate duration
        ended = session.ended_at or datetime.utcnow()
        duration_minutes = int((ended - session.started_at).total_seconds() / 60)

        # Extract key facts (certain ones with citations)
        key_facts = [
            f.fact_text
            for f in facts
            if f.confidence == "certain" and f.citations
        ][:5]

        # Extract weak spots (uncertain, unsupported, or contradicted)
        weak_spots = []
        for f in facts:
            if f.confidence in ("uncertain", "estimate", "dont_recall"):
                weak_spots.append(f"Uncertain: {f.fact_text[:100]}...")
            elif not f.citations:
                weak_spots.append(f"Unsupported: {f.fact_text[:100]}...")
            elif f.contradicts:
                weak_spots.append(f"Contradicted: {f.fact_text[:100]}...")

        # Generate attack vectors based on weak spots
        attack_vectors = []
        if unsupported_claims > 0:
            attack_vectors.append(
                f"{unsupported_claims} claims lack documentary support - expect challenges"
            )
        if contradictions_found > 0:
            attack_vectors.append(
                f"{contradictions_found} potential contradictions identified - review carefully"
            )

        # Suggested follow-ups
        recommended_followups = []
        for f in facts:
            if not f.citations:
                recommended_followups.append(f"Find document supporting: {f.fact_text[:50]}...")

        return SessionSummary(
            session_id=session_id,
            witness_name=session.witness_name,
            agent_mode=session.agent_mode,
            duration_minutes=duration_minutes,
            total_exchanges=total_messages // 2,  # Approximate Q&A pairs
            facts_established=facts_established,
            contradictions_found=contradictions_found,
            unsupported_claims=unsupported_claims,
            key_facts=key_facts[:5],
            weak_spots=weak_spots[:5],
            attack_vectors=attack_vectors[:5],
            recommended_followups=recommended_followups[:5],
        )
