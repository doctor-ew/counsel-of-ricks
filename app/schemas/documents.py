"""Document-related schemas."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class DocumentCreate(BaseModel):
    """Schema for creating a document record."""

    filename: str
    file_path: str
    document_type: Literal["deposition", "exhibit", "correspondence", "other"] | None = "other"
    deponent_name: str | None = None


class DocumentResponse(BaseModel):
    """Schema for document response."""

    id: UUID
    filename: str
    document_type: str | None
    deponent_name: str | None
    total_pages: int | None
    ingested_at: datetime

    model_config = {"from_attributes": True}


class IngestRequest(BaseModel):
    """Schema for document ingestion request."""

    directory_path: str | None = None  # Uses DOCUMENTS_PATH from env if not provided


class IngestResponse(BaseModel):
    """Schema for ingestion response."""

    documents_ingested: int
    total_chunks: int
    errors: list[str] = []
