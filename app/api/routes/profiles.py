"""API routes for witness profiles."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.profiles import (
    ProfileCreate,
    ProfileDocumentCreate,
    ProfileDocumentResponse,
    ProfileResponse,
    ProfileSummary,
    ProfileUpdate,
)
from app.services import profiles as profile_service

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=list[ProfileSummary])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    """List all witness profiles."""
    return await profile_service.list_profiles(db)


@router.post("", response_model=ProfileResponse, status_code=201)
async def create_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new witness profile."""
    profile = await profile_service.create_profile(db, profile_data)
    return await profile_service.get_profile_with_session_count(db, profile.id)


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a witness profile by ID."""
    profile = await profile_service.get_profile_with_session_count(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: UUID,
    profile_data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a witness profile."""
    profile = await profile_service.update_profile(db, profile_id, profile_data)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return await profile_service.get_profile_with_session_count(db, profile.id)


@router.delete("/{profile_id}", status_code=204)
async def delete_profile(
    profile_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a witness profile."""
    deleted = await profile_service.delete_profile(db, profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found")


@router.post("/{profile_id}/documents", response_model=ProfileDocumentResponse, status_code=201)
async def add_document_to_profile(
    profile_id: UUID,
    doc_data: ProfileDocumentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a document to a profile's familiar documents."""
    profile_doc = await profile_service.add_document_to_profile(db, profile_id, doc_data)
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile or document not found")

    # Reload to get document name
    profile = await profile_service.get_profile(db, profile_id)
    for pd in profile.familiar_documents:
        if pd.document_id == doc_data.document_id:
            return ProfileDocumentResponse(
                document_id=pd.document_id,
                document_name=pd.document.filename,
                familiarity_level=pd.familiarity_level,
            )


@router.delete("/{profile_id}/documents/{document_id}", status_code=204)
async def remove_document_from_profile(
    profile_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Remove a document from a profile's familiar documents."""
    removed = await profile_service.remove_document_from_profile(db, profile_id, document_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Profile-document association not found")
