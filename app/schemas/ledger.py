"""Fact ledger schemas."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.chat import Citation


class FactEntry(BaseModel):
    """Schema for a fact entry in the ledger."""

    id: UUID
    fact_text: str
    confidence: Literal["certain", "uncertain", "estimate", "dont_recall"]
    source_type: Literal["witness", "document", "inference"]
    citations: list[Citation]
    contradicts: list[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class LedgerResponse(BaseModel):
    """Schema for ledger query response."""

    facts: list[FactEntry]
    contradiction_count: int
    unsupported_count: int


class FactUpdate(BaseModel):
    """Schema for updating a fact."""

    confidence: Literal["certain", "uncertain", "estimate", "dont_recall"] | None = None
    superseded_by: UUID | None = None


class ContradictionPair(BaseModel):
    """Schema for contradiction pairs."""

    fact_1: FactEntry
    fact_2: FactEntry
    explanation: str
