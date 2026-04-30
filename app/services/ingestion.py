"""Document ingestion service."""

import logging
from pathlib import Path

import fitz  # PyMuPDF
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import Chunk, Document
from app.schemas.documents import IngestResponse

logger = logging.getLogger(__name__)
settings = get_settings()


class IngestionService:
    """Service for ingesting PDF documents into the vector store."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.embed_model = OpenAIEmbedding(
            model=settings.openai_embedding_model,
            api_key=settings.openai_api_key,
        )
        self.splitter = SentenceSplitter(
            chunk_size=512,
            chunk_overlap=50,
        )

    async def ingest_directory(self, directory_path: str | None = None) -> IngestResponse:
        """Recursively ingest all PDFs in a directory."""
        path = Path(directory_path or settings.documents_path)

        if not path.exists():
            raise FileNotFoundError(f"Directory not found: {path}")

        pdf_files = list(path.rglob("*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files to ingest")

        documents_ingested = 0
        total_chunks = 0
        errors: list[str] = []

        for pdf_path in pdf_files:
            try:
                doc_id, chunk_count = await self._ingest_pdf(pdf_path)
                documents_ingested += 1
                total_chunks += chunk_count
                logger.info(f"Ingested {pdf_path.name}: {chunk_count} chunks")
            except Exception as e:
                error_msg = f"Failed to ingest {pdf_path.name}: {e}"
                logger.error(error_msg)
                errors.append(error_msg)

        return IngestResponse(
            documents_ingested=documents_ingested,
            total_chunks=total_chunks,
            errors=errors,
        )

    async def _ingest_pdf(self, pdf_path: Path) -> tuple[str, int]:
        """Ingest a single PDF file."""
        # Extract text from PDF
        pages = self._extract_pages(pdf_path)

        # Determine document type from path
        doc_type = self._infer_document_type(pdf_path)

        # Create document record
        document = Document(
            filename=pdf_path.name,
            file_path=str(pdf_path),
            document_type=doc_type,
            total_pages=len(pages),
            metadata_={"source_directory": str(pdf_path.parent.name)},
        )
        self.db.add(document)
        await self.db.flush()

        # Process each page
        chunk_count = 0
        for page_num, page_text in enumerate(pages, start=1):
            if not page_text.strip():
                continue

            # Chunk the page
            chunks = self.splitter.split_text(page_text)

            for idx, chunk_text in enumerate(chunks):
                # Generate embedding
                embedding = await self._get_embedding(chunk_text)

                chunk = Chunk(
                    document_id=document.id,
                    page_number=page_num,
                    chunk_index=idx,
                    content=chunk_text,
                    embedding=embedding,
                    metadata_={
                        "filename": pdf_path.name,
                        "page": page_num,
                    },
                )
                self.db.add(chunk)
                chunk_count += 1

        await self.db.flush()
        return str(document.id), chunk_count

    def _extract_pages(self, pdf_path: Path) -> list[str]:
        """Extract text from PDF pages."""
        doc = fitz.open(pdf_path)
        pages = []

        for page in doc:
            text = page.get_text()
            # Sanitize: remove null bytes and other problematic characters
            text = self._sanitize_text(text)

            # If text is too short, might be scanned - log warning
            # OCR integration would go here
            if len(text.strip()) < 50:
                logger.warning(f"Low text content on page {page.number + 1} of {pdf_path.name}")

            pages.append(text)

        doc.close()
        return pages

    def _sanitize_text(self, text: str) -> str:
        """Remove null bytes and other problematic characters for PostgreSQL."""
        # Remove null bytes (0x00) which PostgreSQL doesn't accept
        text = text.replace("\x00", "")
        # Remove other control characters except newlines and tabs
        text = "".join(char for char in text if char == "\n" or char == "\t" or not (0 <= ord(char) < 32))
        return text

    def _infer_document_type(self, pdf_path: Path) -> str:
        """Infer document type from path or filename."""
        path_lower = str(pdf_path).lower()

        if "depo" in path_lower or "transcript" in path_lower:
            return "deposition"
        elif "exhibit" in path_lower:
            return "exhibit"
        elif "letter" in path_lower or "email" in path_lower or "correspondence" in path_lower:
            return "correspondence"
        else:
            return "other"

    async def _get_embedding(self, text: str) -> list[float]:
        """Generate embedding for text."""
        # LlamaIndex's OpenAIEmbedding is sync, wrap in executor for async
        embedding = self.embed_model.get_text_embedding(text)
        return embedding
