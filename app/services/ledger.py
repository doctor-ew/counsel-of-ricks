"""Fact ledger service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FactLedger
from app.schemas.ledger import ContradictionPair, FactEntry, LedgerResponse


class LedgerService:
    """Service for managing the fact ledger."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_ledger(self, session_id: UUID) -> LedgerResponse:
        """Get all facts for a session with stats."""
        result = await self.db.execute(
            select(FactLedger)
            .where(FactLedger.session_id == session_id)
            .where(FactLedger.superseded_by.is_(None))  # Exclude superseded facts
            .order_by(FactLedger.created_at)
        )
        facts = result.scalars().all()

        fact_entries = [
            FactEntry(
                id=f.id,
                fact_text=f.fact_text,
                confidence=f.confidence,
                source_type=f.source_type,
                citations=f.citations,
                contradicts=f.contradicts,
                created_at=f.created_at,
            )
            for f in facts
        ]

        # Count contradictions and unsupported claims
        contradiction_count = sum(1 for f in facts if f.contradicts)
        unsupported_count = sum(1 for f in facts if not f.citations)

        return LedgerResponse(
            facts=fact_entries,
            contradiction_count=contradiction_count,
            unsupported_count=unsupported_count,
        )

    async def get_contradictions(self, session_id: UUID) -> list[ContradictionPair]:
        """Get all contradiction pairs for a session."""
        result = await self.db.execute(
            select(FactLedger)
            .where(FactLedger.session_id == session_id)
            .where(FactLedger.superseded_by.is_(None))
        )
        all_facts = {f.id: f for f in result.scalars().all()}

        pairs = []
        seen_pairs = set()

        for fact in all_facts.values():
            for contradicted_id in fact.contradicts:
                # Avoid duplicate pairs
                pair_key = tuple(sorted([str(fact.id), str(contradicted_id)]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                contradicted_fact = all_facts.get(UUID(contradicted_id))
                if contradicted_fact:
                    pairs.append(
                        ContradictionPair(
                            fact_1=FactEntry(
                                id=fact.id,
                                fact_text=fact.fact_text,
                                confidence=fact.confidence,
                                source_type=fact.source_type,
                                citations=fact.citations,
                                contradicts=fact.contradicts,
                                created_at=fact.created_at,
                            ),
                            fact_2=FactEntry(
                                id=contradicted_fact.id,
                                fact_text=contradicted_fact.fact_text,
                                confidence=contradicted_fact.confidence,
                                source_type=contradicted_fact.source_type,
                                citations=contradicted_fact.citations,
                                contradicts=contradicted_fact.contradicts,
                                created_at=contradicted_fact.created_at,
                            ),
                            explanation=f"Facts '{fact.fact_text[:50]}...' and "
                            f"'{contradicted_fact.fact_text[:50]}...' may contradict.",
                        )
                    )

        return pairs

    async def add_fact(
        self,
        session_id: UUID,
        fact_text: str,
        confidence: str,
        source_type: str,
        source_message_id: UUID | None = None,
        citations: list = None,
        contradicts: list = None,
    ) -> FactLedger:
        """Add a new fact to the ledger."""
        fact = FactLedger(
            session_id=session_id,
            fact_text=fact_text,
            confidence=confidence,
            source_type=source_type,
            source_message_id=source_message_id,
            citations=citations or [],
            contradicts=contradicts or [],
        )
        self.db.add(fact)
        await self.db.flush()
        return fact
