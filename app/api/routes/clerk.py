"""Clerk Agent endpoint - attorney's research assistant."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.clerk import ClerkQuery, ClerkResponse
from app.services.clerk import ClerkService

router = APIRouter()


@router.post("/clerk/ask", response_model=ClerkResponse)
async def ask_clerk(
    request: ClerkQuery,
    db: AsyncSession = Depends(get_db),
) -> ClerkResponse:
    """
    Ask the clerk agent a research question.

    The clerk searches case documents and the fact ledger,
    then provides a citation-backed answer.
    """
    service = ClerkService(db)
    return await service.ask(
        query=request.query,
        session_id=request.session_id,
        conversation_history=request.conversation_history,
    )
