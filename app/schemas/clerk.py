"""Clerk Agent schemas."""

from uuid import UUID

from pydantic import BaseModel

from app.schemas.chat import Citation


class ClerkMessage(BaseModel):
    """A single message in clerk conversation history."""

    role: str  # "user" or "clerk"
    content: str


class ClerkQuery(BaseModel):
    """Request to the clerk agent."""

    query: str
    session_id: UUID | None = None  # Optional: scope to a session's facts
    conversation_history: list[ClerkMessage] = []  # Recent context


class ClerkSource(BaseModel):
    """A source the clerk used to answer."""

    source_type: str  # "document" or "fact_ledger"
    content: str
    document_name: str | None = None
    page_number: int | None = None
    confidence: str | None = None  # For fact ledger entries
    similarity_score: float | None = None


class ClerkResponse(BaseModel):
    """Response from the clerk agent."""

    answer: str
    citations: list[Citation]
    sources: list[ClerkSource]
    facts_referenced: int
    documents_searched: int
