"""Profile service for witness profile management."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Document, ProfileDocument, Session, WitnessProfile
from app.schemas.profiles import (
    ProfileContext,
    ProfileCreate,
    ProfileDocumentCreate,
    ProfileResponse,
    ProfileSummary,
    ProfileUpdate,
)


async def create_profile(db: AsyncSession, profile_data: ProfileCreate) -> WitnessProfile:
    """Create a new witness profile."""
    profile = WitnessProfile(
        name=profile_data.name,
        role=profile_data.role,
        relationship_to_case=profile_data.relationship_to_case,
        knowledge_areas=profile_data.knowledge_areas,
        limitations=profile_data.limitations,
        notes=profile_data.notes,
        agent_intensity=profile_data.agent_intensity,
    )
    db.add(profile)
    await db.flush()

    # Add familiar documents if provided
    for doc_id in profile_data.familiar_document_ids:
        profile_doc = ProfileDocument(
            profile_id=profile.id,
            document_id=doc_id,
            familiarity_level="familiar",
        )
        db.add(profile_doc)

    await db.flush()
    return profile


async def get_profile(db: AsyncSession, profile_id: UUID) -> WitnessProfile | None:
    """Get a profile by ID with all relationships loaded."""
    result = await db.execute(
        select(WitnessProfile)
        .options(selectinload(WitnessProfile.familiar_documents).selectinload(ProfileDocument.document))
        .where(WitnessProfile.id == profile_id)
    )
    return result.scalar_one_or_none()


async def get_profile_with_session_count(db: AsyncSession, profile_id: UUID) -> ProfileResponse | None:
    """Get a profile by ID with session count."""
    profile = await get_profile(db, profile_id)
    if not profile:
        return None

    # Get session count
    session_count_result = await db.execute(
        select(func.count(Session.id)).where(Session.profile_id == profile_id)
    )
    session_count = session_count_result.scalar() or 0

    return ProfileResponse(
        id=profile.id,
        name=profile.name,
        role=profile.role,
        relationship_to_case=profile.relationship_to_case,
        knowledge_areas=profile.knowledge_areas,
        limitations=profile.limitations,
        notes=profile.notes,
        agent_intensity=profile.agent_intensity,
        familiar_documents=[
            {
                "document_id": pd.document_id,
                "document_name": pd.document.filename,
                "familiarity_level": pd.familiarity_level,
            }
            for pd in profile.familiar_documents
        ],
        session_count=session_count,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def list_profiles(db: AsyncSession) -> list[ProfileSummary]:
    """List all profiles with session counts."""
    # Get profiles with session counts
    result = await db.execute(
        select(
            WitnessProfile.id,
            WitnessProfile.name,
            WitnessProfile.role,
            WitnessProfile.relationship_to_case,
            func.count(Session.id).label("session_count"),
        )
        .outerjoin(Session, Session.profile_id == WitnessProfile.id)
        .group_by(WitnessProfile.id)
        .order_by(WitnessProfile.name)
    )

    profiles = []
    for row in result:
        profiles.append(
            ProfileSummary(
                id=row.id,
                name=row.name,
                role=row.role,
                relationship_to_case=row.relationship_to_case,
                session_count=row.session_count or 0,
            )
        )
    return profiles


async def update_profile(
    db: AsyncSession, profile_id: UUID, profile_data: ProfileUpdate
) -> WitnessProfile | None:
    """Update an existing profile."""
    profile = await get_profile(db, profile_id)
    if not profile:
        return None

    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.flush()
    return profile


async def delete_profile(db: AsyncSession, profile_id: UUID) -> bool:
    """Delete a profile."""
    profile = await get_profile(db, profile_id)
    if not profile:
        return False

    await db.delete(profile)
    return True


async def add_document_to_profile(
    db: AsyncSession, profile_id: UUID, doc_data: ProfileDocumentCreate
) -> ProfileDocument | None:
    """Add a document to a profile's familiar documents."""
    # Verify profile exists
    profile = await get_profile(db, profile_id)
    if not profile:
        return None

    # Verify document exists
    doc_result = await db.execute(select(Document).where(Document.id == doc_data.document_id))
    if not doc_result.scalar_one_or_none():
        return None

    # Check if already exists
    existing = await db.execute(
        select(ProfileDocument).where(
            ProfileDocument.profile_id == profile_id,
            ProfileDocument.document_id == doc_data.document_id,
        )
    )
    if existing.scalar_one_or_none():
        # Update familiarity level
        await db.execute(
            ProfileDocument.__table__.update()
            .where(
                ProfileDocument.profile_id == profile_id,
                ProfileDocument.document_id == doc_data.document_id,
            )
            .values(familiarity_level=doc_data.familiarity_level)
        )
        return await db.execute(
            select(ProfileDocument).where(
                ProfileDocument.profile_id == profile_id,
                ProfileDocument.document_id == doc_data.document_id,
            )
        ).scalar_one()

    profile_doc = ProfileDocument(
        profile_id=profile_id,
        document_id=doc_data.document_id,
        familiarity_level=doc_data.familiarity_level,
    )
    db.add(profile_doc)
    await db.flush()
    return profile_doc


async def remove_document_from_profile(
    db: AsyncSession, profile_id: UUID, document_id: UUID
) -> bool:
    """Remove a document from a profile's familiar documents."""
    result = await db.execute(
        select(ProfileDocument).where(
            ProfileDocument.profile_id == profile_id,
            ProfileDocument.document_id == document_id,
        )
    )
    profile_doc = result.scalar_one_or_none()
    if not profile_doc:
        return False

    await db.delete(profile_doc)
    return True


async def get_profile_context(db: AsyncSession, profile_id: UUID) -> ProfileContext | None:
    """Get profile context for agent prompt injection."""
    profile = await get_profile(db, profile_id)
    if not profile:
        return None

    return ProfileContext(
        name=profile.name,
        role=profile.role,
        relationship_to_case=profile.relationship_to_case,
        knowledge_areas=profile.knowledge_areas,
        limitations=profile.limitations,
        notes=profile.notes,
        agent_intensity=profile.agent_intensity,
        familiar_document_names=[pd.document.filename for pd in profile.familiar_documents],
    )
