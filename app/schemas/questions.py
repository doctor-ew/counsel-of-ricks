"""Schemas for batch question generation."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class QuestionGenerateRequest(BaseModel):
    """Request to generate batch questions."""

    count: int = Field(default=5, ge=1, le=20)
    focus_area: str | None = None  # e.g., "timeline", "damages", "communications"
    difficulty: Literal["standard", "aggressive", "expert"] = "standard"
    include_citations: bool = True


class GeneratedQuestion(BaseModel):
    """A single generated question."""

    question: str
    purpose: str  # Why this question matters
    suggested_followups: list[str]
    citations: list[dict] = []  # Document references supporting this question
    topic: str  # Categorization


class QuestionGenerateResponse(BaseModel):
    """Response with generated questions."""

    session_id: UUID
    questions: list[GeneratedQuestion]
    focus_area: str | None
    difficulty: str
    generated_count: int


class QuestionExportRequest(BaseModel):
    """Request to export questions."""

    format: Literal["text", "markdown", "pdf"] = "markdown"
    include_citations: bool = True
    include_followups: bool = True
    include_purpose: bool = False
