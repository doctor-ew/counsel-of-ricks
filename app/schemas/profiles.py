"""Witness profile schemas."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileDocumentCreate(BaseModel):
    """Schema for adding a document to a profile."""

    document_id: UUID
    familiarity_level: Literal["authored", "familiar", "mentioned"] = "familiar"


class ProfileDocumentResponse(BaseModel):
    """Schema for profile-document association."""

    document_id: UUID
    document_name: str
    familiarity_level: str

    model_config = {"from_attributes": True}


class ProfileCreate(BaseModel):
    """Schema for creating a witness profile."""

    name: str
    role: Literal["plaintiff", "defendant", "witness", "expert"]
    relationship_to_case: str
    knowledge_areas: list[str] = []
    limitations: str | None = None
    notes: str | None = None
    agent_intensity: int = Field(default=5, ge=1, le=10)
    familiar_document_ids: list[UUID] = []


class ProfileUpdate(BaseModel):
    """Schema for updating a witness profile."""

    name: str | None = None
    role: Literal["plaintiff", "defendant", "witness", "expert"] | None = None
    relationship_to_case: str | None = None
    knowledge_areas: list[str] | None = None
    limitations: str | None = None
    notes: str | None = None
    agent_intensity: int | None = Field(default=None, ge=1, le=10)


class ProfileResponse(BaseModel):
    """Schema for witness profile response."""

    id: UUID
    name: str
    role: str
    relationship_to_case: str
    knowledge_areas: list[str]
    limitations: str | None
    notes: str | None
    agent_intensity: int
    familiar_documents: list[ProfileDocumentResponse] = []
    session_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileSummary(BaseModel):
    """Schema for profile list view."""

    id: UUID
    name: str
    role: str
    relationship_to_case: str
    session_count: int = 0

    model_config = {"from_attributes": True}


class ProfileContext(BaseModel):
    """Profile context for agent prompt injection."""

    name: str
    role: str
    relationship_to_case: str
    knowledge_areas: list[str]
    limitations: str | None
    notes: str | None
    agent_intensity: int
    familiar_document_names: list[str]

    def to_prompt(self) -> str:
        """Convert profile to agent prompt context."""
        knowledge = ", ".join(self.knowledge_areas) if self.knowledge_areas else "Not specified"
        docs = ", ".join(self.familiar_document_names) if self.familiar_document_names else "None specified"

        return f"""
WITNESS PROFILE:
- Name: {self.name}
- Role: {self.role}
- Relationship to Case: {self.relationship_to_case}
- Areas of Knowledge: {knowledge}
- Limitations: {self.limitations or 'None specified'}
- Notes: {self.notes or 'None'}

DOCUMENTS THIS WITNESS IS FAMILIAR WITH:
{docs}

IMPORTANT INSTRUCTIONS:
- Tailor your questions to this witness's knowledge and role
- Only ask about topics within their knowledge areas
- Do not ask about documents they are not familiar with unless testing their knowledge
- Acknowledge their limitations when relevant
- Adjust questioning intensity to level {self.agent_intensity}/10
"""
