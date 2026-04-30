"""API routes for batch question generation."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Session
from app.schemas.questions import (
    QuestionExportRequest,
    QuestionGenerateRequest,
    QuestionGenerateResponse,
)
from app.services.questions import (
    QuestionGenerator,
    format_questions_markdown,
    format_questions_text,
)

router = APIRouter(prefix="/sessions", tags=["questions"])


@router.post("/{session_id}/generate-questions", response_model=QuestionGenerateResponse)
async def generate_questions(
    session_id: UUID,
    request: QuestionGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate batch deposition questions for a session."""
    # Verify session exists
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Generate questions
    generator = QuestionGenerator(db)
    try:
        questions = await generator.generate_questions(session_id, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

    return QuestionGenerateResponse(
        session_id=session_id,
        questions=questions,
        focus_area=request.focus_area,
        difficulty=request.difficulty,
        generated_count=len(questions),
    )


@router.post("/{session_id}/export-questions")
async def export_questions(
    session_id: UUID,
    request: QuestionExportRequest,
    db: AsyncSession = Depends(get_db),
):
    """Export previously generated questions in various formats."""
    # Verify session exists
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Generate fresh questions for export (could cache these in future)
    generator = QuestionGenerator(db)
    gen_request = QuestionGenerateRequest(count=10, include_citations=request.include_citations)

    try:
        questions = await generator.generate_questions(session_id, gen_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

    # Format based on requested format
    if request.format == "markdown":
        content = format_questions_markdown(
            questions,
            include_citations=request.include_citations,
            include_followups=request.include_followups,
            include_purpose=request.include_purpose,
        )
        return PlainTextResponse(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=questions_{session_id}.md"},
        )

    elif request.format == "text":
        content = format_questions_text(
            questions,
            include_citations=request.include_citations,
            include_followups=request.include_followups,
        )
        return PlainTextResponse(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=questions_{session_id}.txt"},
        )

    else:  # PDF - for now return markdown, PDF generation could be added later
        content = format_questions_markdown(
            questions,
            include_citations=request.include_citations,
            include_followups=request.include_followups,
            include_purpose=request.include_purpose,
        )
        return PlainTextResponse(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=questions_{session_id}.md"},
        )
