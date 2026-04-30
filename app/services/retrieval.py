"""RAG retrieval service."""

import logging
from uuid import UUID

from llama_index.embeddings.openai import OpenAIEmbedding
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import Chunk, Document
from app.schemas.chat import Citation

logger = logging.getLogger(__name__)
settings = get_settings()


class RetrievalService:
    """Service for retrieving relevant document chunks."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.embed_model = OpenAIEmbedding(
            model=settings.openai_embedding_model,
            api_key=settings.openai_api_key,
        )

    async def search(
        self,
        query: str,
        top_k: int = 5,
        document_ids: list[UUID] | None = None,
    ) -> list[dict]:
        """
        Search for relevant chunks using vector similarity.

        Returns list of dicts with document_id, document_name, page_number, content, score.
        """
        # Generate query embedding
        query_embedding = self.embed_model.get_text_embedding(query)

        # Build the similarity search query
        # Using pgvector's <=> operator for cosine distance
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        sql = f"""
            SELECT
                c.id,
                c.document_id,
                c.page_number,
                c.content,
                d.filename,
                1 - (c.embedding <=> '{embedding_str}'::vector) as similarity
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            {"WHERE c.document_id = ANY(:doc_ids)" if document_ids else ""}
            ORDER BY c.embedding <=> '{embedding_str}'::vector
            LIMIT :top_k
        """

        params = {"top_k": top_k}
        if document_ids:
            params["doc_ids"] = [str(d) for d in document_ids]

        result = await self.db.execute(text(sql), params)
        rows = result.fetchall()

        return [
            {
                "chunk_id": row.id,
                "document_id": row.document_id,
                "document_name": row.filename,
                "page_number": row.page_number,
                "content": row.content,
                "score": row.similarity,
            }
            for row in rows
        ]

    async def search_with_citations(
        self,
        query: str,
        top_k: int = 5,
        document_ids: list[UUID] | None = None,
    ) -> tuple[str, list[Citation]]:
        """
        Search and return formatted context with citations.

        Returns a tuple of (combined_context, list of Citations).
        """
        results = await self.search(query, top_k, document_ids)

        if not results:
            return "", []

        # Build context string
        context_parts = []
        citations = []

        for i, result in enumerate(results):
            context_parts.append(
                f"[Source {i + 1}] From {result['document_name']}, page {result['page_number']}:\n"
                f"{result['content']}\n"
            )

            citations.append(
                Citation(
                    document_id=result["document_id"],
                    document_name=result["document_name"],
                    page_number=result["page_number"],
                    excerpt=result["content"][:200] + "..."
                    if len(result["content"]) > 200
                    else result["content"],
                )
            )

        combined_context = "\n---\n".join(context_parts)
        return combined_context, citations

    async def get_document_by_id(self, document_id: UUID) -> Document | None:
        """Get a document by ID."""
        result = await self.db.execute(select(Document).where(Document.id == document_id))
        return result.scalar_one_or_none()
