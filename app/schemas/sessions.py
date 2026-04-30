"""Session-related schemas."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class SessionCreate(BaseModel):
    """Schema for creating a new session."""

    witness_name: str
    agent_mode: Literal["plaintiff_coach", "defense_cross"]
    profile_id: UUID | None = None


class ProfileBrief(BaseModel):
    """Brief profile info for session response."""

    id: UUID
    name: str
    role: str

    model_config = {"from_attributes": True}


class SessionResponse(BaseModel):
    """Schema for session response."""

    id: UUID
    witness_name: str
    agent_mode: str
    started_at: datetime
    ended_at: datetime | None
    status: str
    profile_id: UUID | None = None
    profile: ProfileBrief | None = None

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    """Schema for session summary report."""

    session_id: UUID
    witness_name: str
    agent_mode: str
    duration_minutes: int
    total_exchanges: int
    facts_established: int
    contradictions_found: int
    unsupported_claims: int
    key_facts: list[str]
    weak_spots: list[str]
    attack_vectors: list[str]
    recommended_followups: list[str]
