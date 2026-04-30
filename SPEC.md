le# Technical Specification: Deposition Prep Simulator (DPS)

> Derived from `depo_prep_prd.md` — Last updated: 2026-01-31

---

## 1. System Overview

A local-first, document-grounded AI system for deposition preparation featuring three coordinating agents and a persistent fact-tracking layer.

### Core Components

```mermaid
flowchart TB
    subgraph Frontend["React Frontend"]
        Chat["Chat Interface<br/>(Agent Mode Toggle)"]
        Ledger["Fact Ledger Sidebar<br/>(Claims, Contradictions, Cites)"]
    end

    subgraph API["FastAPI Backend"]
        ChatAPI["/chat"]
        SessionAPI["/session"]
        DocsAPI["/documents"]
        IngestAPI["/ingest"]
        LedgerAPI["/ledger"]
        ReportsAPI["/reports"]
    end

    subgraph Core["Core Services"]
        Agents["Agent Layer<br/>(LlamaIndex)"]
        RAG["RAG Pipeline<br/>(LlamaIndex)"]
        Arbiter["Arbiter Engine<br/>(Fact Tracking)"]
    end

    subgraph DB["PostgreSQL + pgvector"]
        Documents[(documents)]
        Chunks[(chunks<br/>embedded)]
        Sessions[(sessions)]
        FactLedger[(fact_ledger)]
    end

    Frontend --> API
    API --> Core
    Core --> DB

    Agents --> RAG
    Arbiter --> RAG
    Arbiter --> FactLedger
```

---

## 2. Technology Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| **Frontend** | React | 18.x | Vite for build tooling |
| **Styling** | Tailwind CSS | 3.x | Rapid UI development |
| **State** | React Query | 5.x | Server state management |
| **Backend** | FastAPI | 0.109+ | Async, type-safe API |
| **RAG** | LlamaIndex | 0.10+ | Document indexing & retrieval |
| **Vector Store** | pgvector | 0.6+ | Postgres extension |
| **Database** | PostgreSQL | 16 | Primary data store |
| **PDF Processing** | PyMuPDF (fitz) | 1.24+ | Text extraction |
| **OCR (optional)** | pytesseract | 0.3+ | For scanned documents |
| **LLM** | OpenAI API | gpt-4o | Primary; configurable |
| **Embeddings** | OpenAI | text-embedding-3-small | 1536 dimensions |

### Development Infrastructure

| Component | Local Dev | Future Production |
|-----------|-----------|-------------------|
| Database | Docker Compose | AWS RDS / Railway Postgres |
| API | uvicorn (local) | Railway / AWS ECS |
| Frontend | Vite dev server | Vercel / S3+CloudFront |

---

## 3. Data Models

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    DOCUMENTS ||--o{ CHUNKS : contains
    SESSIONS ||--o{ MESSAGES : contains
    SESSIONS ||--o{ FACT_LEDGER : tracks
    MESSAGES ||--o| FACT_LEDGER : sources

    DOCUMENTS {
        uuid id PK
        string filename
        string file_path
        string document_type
        string deponent_name
        int total_pages
        timestamp ingested_at
        jsonb metadata
    }

    CHUNKS {
        uuid id PK
        uuid document_id FK
        int page_number
        int chunk_index
        text content
        string content_type
        vector embedding
        jsonb metadata
    }

    SESSIONS {
        uuid id PK
        string witness_name
        string agent_mode
        timestamp started_at
        timestamp ended_at
        string status
        jsonb summary
    }

    MESSAGES {
        uuid id PK
        uuid session_id FK
        string role
        text content
        jsonb citations
        jsonb arbiter_flags
        timestamp created_at
    }

    FACT_LEDGER {
        uuid id PK
        uuid session_id FK
        text fact_text
        string confidence
        string source_type
        uuid source_message_id FK
        jsonb citations
        jsonb contradicts
        uuid superseded_by FK
        timestamp created_at
    }
```

### 3.2 Database Schema

```sql
-- Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    document_type VARCHAR(50), -- 'deposition', 'exhibit', 'correspondence', 'other'
    deponent_name VARCHAR(200), -- For depositions: who was deposed
    total_pages INTEGER,
    ingested_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Chunks table (with embeddings)
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL, -- Order within page
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'qa_pair', 'exhibit_ref'
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX chunks_embedding_idx ON chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    witness_name VARCHAR(200) NOT NULL, -- Who is being prepped
    agent_mode VARCHAR(50) NOT NULL, -- 'plaintiff_coach', 'defense_cross'
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    summary JSONB -- Populated on session end
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'agent', 'witness', 'arbiter'
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]', -- Array of {document_id, page, excerpt}
    arbiter_flags JSONB DEFAULT '[]', -- Flags raised by arbiter
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fact Ledger table
CREATE TABLE fact_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    fact_text TEXT NOT NULL,
    confidence VARCHAR(50) NOT NULL, -- 'certain', 'uncertain', 'estimate', 'dont_recall'
    source_type VARCHAR(50) NOT NULL, -- 'witness', 'document', 'inference'
    source_message_id UUID REFERENCES messages(id),
    citations JSONB DEFAULT '[]', -- Supporting document citations
    contradicts JSONB DEFAULT '[]', -- Array of fact_ledger IDs this contradicts
    created_at TIMESTAMP DEFAULT NOW(),
    superseded_by UUID REFERENCES fact_ledger(id) -- If fact was corrected
);

-- Index for session-based fact queries
CREATE INDEX fact_ledger_session_idx ON fact_ledger(session_id);
```

### 3.3 Pydantic Models

```python
# schemas/documents.py
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Literal

class DocumentCreate(BaseModel):
    filename: str
    file_path: str
    document_type: Optional[Literal['deposition', 'exhibit', 'correspondence', 'other']] = 'other'
    deponent_name: Optional[str] = None

class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    document_type: Optional[str]
    deponent_name: Optional[str]
    total_pages: int
    ingested_at: datetime

class Citation(BaseModel):
    document_id: UUID
    document_name: str
    page_number: int
    excerpt: str

# schemas/sessions.py
class SessionCreate(BaseModel):
    witness_name: str
    agent_mode: Literal['plaintiff_coach', 'defense_cross']

class SessionResponse(BaseModel):
    id: UUID
    witness_name: str
    agent_mode: str
    started_at: datetime
    status: str

# schemas/chat.py
class ChatRequest(BaseModel):
    session_id: UUID
    message: str

class ArbiterFlag(BaseModel):
    flag_type: Literal['contradiction', 'unsupported', 'vague', 'risk']
    description: str
    related_fact_ids: list[UUID] = []

class ChatResponse(BaseModel):
    agent_message: str
    citations: list[Citation]
    arbiter_flags: list[ArbiterFlag]
    new_facts: list[UUID]  # IDs of facts added to ledger

# schemas/ledger.py
class FactEntry(BaseModel):
    id: UUID
    fact_text: str
    confidence: Literal['certain', 'uncertain', 'estimate', 'dont_recall']
    source_type: Literal['witness', 'document', 'inference']
    citations: list[Citation]
    contradicts: list[UUID]
    created_at: datetime

class LedgerResponse(BaseModel):
    facts: list[FactEntry]
    contradiction_count: int
    unsupported_count: int
```

---

## 4. API Design

### 4.1 Endpoints

```yaml
# Document Management
POST   /api/v1/ingest              # Ingest PDF directory
GET    /api/v1/documents           # List all documents
GET    /api/v1/documents/{id}      # Get document details
DELETE /api/v1/documents/{id}      # Remove document

# Session Management
POST   /api/v1/sessions            # Start new prep session
GET    /api/v1/sessions            # List all sessions
GET    /api/v1/sessions/{id}       # Get session details
POST   /api/v1/sessions/{id}/end   # End session, generate summary
DELETE /api/v1/sessions/{id}       # Delete session

# Chat (Core Interaction)
POST   /api/v1/chat                # Send message, get agent response
GET    /api/v1/sessions/{id}/messages  # Get session history

# Fact Ledger
GET    /api/v1/sessions/{id}/ledger           # Get current fact ledger
GET    /api/v1/sessions/{id}/contradictions   # Get contradiction pairs
PATCH  /api/v1/ledger/{fact_id}               # Update fact confidence/supersede

# Reports
GET    /api/v1/sessions/{id}/report           # Generate session report
GET    /api/v1/sessions/{id}/report/export    # Export as markdown/txt

# Health
GET    /api/v1/health              # API health check
```

### 4.2 WebSocket (Future Enhancement)

```yaml
WS /api/v1/ws/session/{id}    # Real-time arbiter updates during chat
```

---

## 5. Agent Architecture

### 5.1 Agent Interaction Flow

```mermaid
flowchart LR
    subgraph Witness["Witness (User)"]
        Input["Text Response"]
    end

    subgraph System["DPS System"]
        direction TB
        Active["Active Agent<br/>(Coach or Defense)"]
        Arb["Arbiter Engine"]
        RAG["RAG Pipeline"]
        FL["Fact Ledger"]
    end

    Input --> Arb
    Arb -->|"1. Extract facts"| RAG
    Arb -->|"2. Check contradictions"| FL
    Arb -->|"3. Flags + context"| Active
    Active -->|"4. Generate question"| RAG
    Active -->|"5. Response"| Output["Agent Question<br/>+ Citations<br/>+ Flags"]
    Arb -->|"6. Store facts"| FL
```

### 5.2 Agent Definitions

Each agent is a LlamaIndex `ReActAgent` with custom system prompts and shared RAG tools.

```python
# agents/base.py
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import QueryEngineTool

class BaseDepositionAgent:
    """Base class for all deposition prep agents."""

    def __init__(self, query_engine, arbiter, session_id: UUID):
        self.query_engine = query_engine
        self.arbiter = arbiter
        self.session_id = session_id
        self.tools = self._build_tools()
        self.agent = self._build_agent()

    def _build_tools(self) -> list[QueryEngineTool]:
        return [
            QueryEngineTool.from_defaults(
                query_engine=self.query_engine,
                name="search_documents",
                description="Search case documents for evidence. Always cite source."
            ),
        ]

    @property
    def system_prompt(self) -> str:
        raise NotImplementedError
```

### 5.3 Plaintiff Coach Agent

```python
# agents/plaintiff_coach.py

PLAINTIFF_COACH_PROMPT = """
You are a skilled plaintiff's attorney preparing a witness for deposition testimony.

YOUR ROLE:
- Help the witness tell their story clearly, accurately, and consistently
- Build a chronological narrative grounded in documents
- Encourage precision without exaggeration
- Teach safe testimony practices ("I don't recall exactly", "I'd need to review the document")

BEHAVIOR:
- Ask one focused question at a time
- After 3-4 exchanges on a topic, summarize what you've established
- When the witness makes a claim, ask if there's documentary support
- Gently correct overstatements or speculation
- Praise good, precise answers

CONSTRAINTS:
- Never coach the witness to be dishonest
- Never fabricate or imply facts not in evidence
- Always ground assertions in retrieved documents when possible
- If no documentary support exists, say so clearly

FORMAT:
- Keep questions conversational but focused
- After establishing facts, briefly note: "Good - we've established [X], supported by [document]"
- Flag areas needing more documentary support
"""

class PlaintiffCoachAgent(BaseDepositionAgent):
    @property
    def system_prompt(self) -> str:
        return PLAINTIFF_COACH_PROMPT
```

### 5.4 Defense Cross-Examiner Agent

```python
# agents/defense_cross.py

DEFENSE_CROSS_PROMPT = """
You are a sharp, skeptical defense attorney cross-examining a hostile witness.

YOUR ROLE:
- Stress-test the witness's testimony aggressively but fairly
- Expose inconsistencies, vagueness, and unsupported claims
- Push for yes/no answers on key admissions
- Challenge causation, damages, and credibility
- Exploit any contradictions flagged by the Arbiter

TACTICS:
- Leading questions: "Isn't it true that..."
- Pin down specifics: dates, times, amounts, exact words
- Highlight gaps: "You have no document showing X, do you?"
- Create tension: "So you're saying [exaggerated version]?"
- Loop back to prior answers: "Earlier you said X, now you're saying Y..."

BEHAVIOR:
- Be persistent but not abusive
- If witness gives a good answer, grudgingly move on
- Track admissions for later use
- Periodically summarize damaging admissions

CONSTRAINTS:
- Stay within bounds of legitimate cross-examination
- Don't fabricate facts or misquote documents
- Use retrieved evidence to challenge claims

GOAL:
Make the witness uncomfortable enough to improve, while staying realistic
to what they'll face in the actual deposition.
"""

class DefenseCrossAgent(BaseDepositionAgent):
    @property
    def system_prompt(self) -> str:
        return DEFENSE_CROSS_PROMPT
```

### 5.5 Arbiter Engine

The Arbiter is not a conversational agent but a processing layer that runs after each witness response.

```mermaid
flowchart TD
    Input["Witness Response"] --> Extract["1. Extract Factual Claims<br/>(LLM structured output)"]
    Extract --> Check["2. Check Against Ledger<br/>(Contradiction detection)"]
    Check --> Search["3. RAG Search<br/>(Find documentary support)"]
    Search --> Flag["4. Generate Flags<br/>(contradiction, unsupported, vague, risk)"]
    Flag --> Suggest["5. Suggest Follow-ups<br/>(For active agent)"]
    Suggest --> Output["ArbiterAnalysis<br/>{facts, flags, followups}"]

    Check <--> FL[(Fact Ledger)]
    Search <--> VS[(Vector Store)]
```

```python
# agents/arbiter.py
from dataclasses import dataclass
from enum import Enum

class FlagType(Enum):
    CONTRADICTION = "contradiction"
    UNSUPPORTED = "unsupported"
    VAGUE = "vague"
    RISK = "risk"

@dataclass
class ArbiterAnalysis:
    extracted_facts: list[dict]  # Facts to add to ledger
    flags: list[dict]            # Issues detected
    suggested_followups: list[str]  # Questions the agent might ask

class ArbiterEngine:
    """
    Processes witness responses to:
    1. Extract factual claims
    2. Check against existing ledger for contradictions
    3. Attempt to find documentary support via RAG
    4. Flag risks and unsupported claims
    """

    def __init__(self, query_engine, ledger_repo):
        self.query_engine = query_engine
        self.ledger_repo = ledger_repo
        self.llm = get_llm()

    async def analyze_response(
        self,
        session_id: UUID,
        witness_message: str,
        conversation_context: list[dict]
    ) -> ArbiterAnalysis:
        # Step 1: Extract factual claims from witness response
        facts = await self._extract_facts(witness_message, conversation_context)

        # Step 2: Check each fact against existing ledger
        contradictions = await self._check_contradictions(session_id, facts)

        # Step 3: Attempt to find documentary support
        supported_facts = await self._find_support(facts)

        # Step 4: Generate flags
        flags = self._generate_flags(facts, contradictions, supported_facts)

        # Step 5: Suggest follow-ups for the agent
        followups = await self._suggest_followups(flags)

        return ArbiterAnalysis(
            extracted_facts=supported_facts,
            flags=flags,
            suggested_followups=followups
        )
```

---

## 6. RAG Pipeline

### 6.1 Ingestion Flow

```mermaid
flowchart LR
    subgraph Input
        Dir["PDF Directory"]
    end

    subgraph Processing
        Extract["Extract Text<br/>(PyMuPDF)"]
        OCR["OCR Fallback<br/>(pytesseract)"]
        Chunk["Chunk by Page<br/>(SentenceSplitter)"]
        Embed["Generate Embeddings<br/>(text-embedding-3-small)"]
    end

    subgraph Storage
        DocTable[(documents)]
        ChunkTable[(chunks + vectors)]
    end

    Dir --> Extract
    Extract -->|"< 50 chars"| OCR
    Extract -->|"text ok"| Chunk
    OCR --> Chunk
    Chunk --> Embed
    Embed --> ChunkTable
    Extract --> DocTable
```

### 6.2 Document Ingestion Service

```python
# services/ingestion.py
import fitz  # PyMuPDF
from pathlib import Path
from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter

class DocumentIngestionService:
    def __init__(self, db, embedding_model):
        self.db = db
        self.embedding_model = embedding_model
        self.chunk_size = 512
        self.chunk_overlap = 50

    async def ingest_directory(self, directory: Path) -> list[UUID]:
        """Recursively ingest all PDFs in directory."""
        pdf_files = list(directory.rglob("*.pdf"))
        ingested_ids = []

        for pdf_path in pdf_files:
            doc_id = await self.ingest_pdf(pdf_path)
            ingested_ids.append(doc_id)

        return ingested_ids

    async def ingest_pdf(self, pdf_path: Path) -> UUID:
        # 1. Extract text with page numbers
        pages = self._extract_pages(pdf_path)

        # 2. Create document record
        doc_id = await self.db.create_document(
            filename=pdf_path.name,
            file_path=str(pdf_path),
            total_pages=len(pages)
        )

        # 3. Chunk each page
        for page_num, page_text in enumerate(pages, start=1):
            chunks = self._chunk_page(page_text, page_num)

            # 4. Embed and store chunks
            for idx, chunk in enumerate(chunks):
                embedding = await self.embedding_model.embed(chunk.text)
                await self.db.create_chunk(
                    document_id=doc_id,
                    page_number=page_num,
                    chunk_index=idx,
                    content=chunk.text,
                    embedding=embedding
                )

        return doc_id

    def _extract_pages(self, pdf_path: Path) -> list[str]:
        """Extract text from PDF, falling back to OCR if needed."""
        doc = fitz.open(pdf_path)
        pages = []

        for page in doc:
            text = page.get_text()

            # If text is too short, might be scanned - try OCR
            if len(text.strip()) < 50:
                text = self._ocr_page(page)

            pages.append(text)

        return pages

    def _chunk_page(self, page_text: str, page_num: int) -> list:
        """Chunk text while preserving page boundaries."""
        splitter = SentenceSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )
        return splitter.split_text(page_text)
```

### 6.3 Retrieval Service

```python
# services/retrieval.py
from llama_index.core import VectorStoreIndex
from llama_index.vector_stores.postgres import PGVectorStore

class RetrievalService:
    def __init__(self, vector_store: PGVectorStore):
        self.vector_store = vector_store
        self.index = VectorStoreIndex.from_vector_store(vector_store)

    def get_query_engine(self, filters: dict = None):
        """Get query engine with optional document filters."""
        return self.index.as_query_engine(
            similarity_top_k=5,
            filters=filters,
            response_mode="no_text"  # Return nodes only, let agent synthesize
        )

    async def search(
        self,
        query: str,
        top_k: int = 5,
        document_ids: list[UUID] = None
    ) -> list[dict]:
        """Search with optional document filtering."""
        filters = None
        if document_ids:
            filters = {"document_id": {"$in": [str(id) for id in document_ids]}}

        engine = self.get_query_engine(filters)
        response = await engine.aquery(query)

        return [
            {
                "document_id": node.metadata["document_id"],
                "document_name": node.metadata["filename"],
                "page_number": node.metadata["page_number"],
                "content": node.text,
                "score": node.score
            }
            for node in response.source_nodes
        ]
```

---

## 7. Frontend Architecture

### 7.1 Component Hierarchy (v1 - Target B)

```mermaid
flowchart TD
    App["App.tsx"]
    App --> Router["React Router"]

    Router --> Home["HomePage"]
    Router --> Session["SessionPage"]

    Home --> SessionList["SessionList"]
    Home --> NewSession["NewSessionButton"]

    Session --> Header["SessionHeader"]
    Session --> ChatContainer["ChatContainer"]
    Session --> LedgerSidebar["LedgerSidebar"]

    ChatContainer --> ModeToggle["AgentModeToggle"]
    ChatContainer --> MessageList["MessageList"]
    ChatContainer --> ChatInput["ChatInput"]

    MessageList --> MessageBubble["MessageBubble"]
    MessageBubble --> Citation["Citation"]

    LedgerSidebar --> LedgerStats["LedgerStats"]
    LedgerSidebar --> FactList["FactList"]
    LedgerSidebar --> ContradictionAlert["ContradictionAlert"]

    FactList --> FactCard["FactCard"]
    FactCard --> ConfidenceBadge["ConfidenceBadge"]
```

### 7.2 Directory Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── AgentModeToggle.tsx
│   │
│   ├── ledger/
│   │   ├── LedgerSidebar.tsx
│   │   ├── FactList.tsx
│   │   ├── FactCard.tsx
│   │   ├── ContradictionAlert.tsx
│   │   └── LedgerStats.tsx
│   │
│   ├── session/
│   │   ├── SessionHeader.tsx
│   │   └── EndSessionModal.tsx
│   │
│   └── common/
│       ├── Citation.tsx
│       ├── ConfidenceBadge.tsx
│       └── LoadingSpinner.tsx
│
├── hooks/
│   ├── useSession.ts
│   ├── useChat.ts
│   ├── useLedger.ts
│   └── useDocuments.ts
│
├── pages/
│   ├── HomePage.tsx
│   └── SessionPage.tsx
│
├── api/
│   └── client.ts
│
└── types/
    └── index.ts
```

### 7.3 Session Page Layout

```mermaid
block-beta
    columns 3

    Header["SessionHeader: Witness | Mode | Duration"]:3

    space
    Chat["Chat Interface"]:2
    Ledger["Fact Ledger Sidebar"]

    space
    Input["ChatInput"]:2
    Stats["LedgerStats"]
```

### 7.4 Upgrade Path to Target C

```mermaid
flowchart LR
    subgraph MVP_B["Target B (MVP)"]
        Chat["Chat + Ledger"]
    end

    subgraph MVP_C["Target C (Enhanced)"]
        Docs["Document Browser"]
        Reports["Session Reports"]
        History["Session History"]
        Dashboard["Dashboard"]
    end

    MVP_B --> MVP_C
```

Additional components for Target C:

```
src/
├── components/
│   ├── documents/
│   │   ├── DocumentBrowser.tsx
│   │   ├── DocumentViewer.tsx
│   │   └── DocumentUpload.tsx
│   │
│   ├── reports/
│   │   ├── SessionReport.tsx
│   │   ├── WeakSpotsCard.tsx
│   │   └── ExportButton.tsx
│   │
│   └── history/
│       ├── SessionList.tsx
│       └── SessionCard.tsx
│
├── pages/
│   ├── DocumentsPage.tsx
│   ├── ReportsPage.tsx
│   └── DashboardPage.tsx
```

---

## 8. Project Structure

```
CourtPrep/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app entry
│   │   ├── config.py              # Settings (pydantic-settings)
│   │   ├── dependencies.py        # DI providers
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── chat.py
│   │   │   │   ├── documents.py
│   │   │   │   ├── sessions.py
│   │   │   │   ├── ledger.py
│   │   │   │   └── reports.py
│   │   │   └── deps.py
│   │   │
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── plaintiff_coach.py
│   │   │   ├── defense_cross.py
│   │   │   └── arbiter.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py
│   │   │   ├── retrieval.py
│   │   │   ├── session.py
│   │   │   └── ledger.py
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   └── repositories/
│   │   │       ├── documents.py
│   │   │       ├── sessions.py
│   │   │       └── ledger.py
│   │   │
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── documents.py
│   │       ├── sessions.py
│   │       ├── chat.py
│   │       └── ledger.py
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_ingestion.py
│   │   ├── test_agents.py
│   │   └── test_api/
│   │
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   │
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── docker/
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
├── docs/
│   ├── api.md
│   └── deployment.md
│
├── scripts/
│   ├── setup.sh
│   └── ingest.py
│
├── depo_prep_prd.md
├── SPEC.md
├── README.md
└── .env.example
```

---

## 9. Configuration

### 9.1 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/deposition_prep

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Application
APP_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173

# Document Storage
DOCUMENTS_PATH=/path/to/case/documents

# Optional: OCR
TESSERACT_PATH=/usr/local/bin/tesseract
```

### 9.2 Docker Compose (Local Dev)

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: depo
      POSTGRES_PASSWORD: localdev
      POSTGRES_DB: deposition_prep
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

---

## 10. Development Workflow

### 10.1 Initial Setup

```bash
# 1. Clone and enter project
cd CourtPrep

# 2. Start database
docker-compose -f docker/docker-compose.yml up -d

# 3. Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head

# 4. Frontend setup
cd ../frontend
npm install

# 5. Set environment
cp .env.example .env
# Edit .env with your OpenAI key and document path

# 6. Ingest documents
python scripts/ingest.py /path/to/case/documents

# 7. Run development servers (separate terminals)
# Backend:
uvicorn app.main:app --reload --port 8000

# Frontend:
npm run dev
```

### 10.2 Testing

```bash
# Backend
pytest                              # All tests
pytest -x -v tests/test_agents.py   # Specific file, verbose

# Frontend
npm test                            # Jest tests
npm run lint                        # ESLint
```

---

## 11. Session Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as FastAPI
    participant Agent as Active Agent
    participant Arbiter as Arbiter
    participant DB as PostgreSQL

    C->>API: POST /sessions {witness_name, agent_mode}
    API->>DB: CREATE session
    DB-->>API: session_id
    API-->>C: {session_id}

    loop Each Turn
        C->>API: POST /chat {session_id, message}

        API->>Arbiter: analyze_response(message)
        Arbiter->>DB: GET existing facts
        Arbiter->>DB: RAG search for support
        Arbiter-->>API: {facts, flags, followups}

        API->>Agent: generate_response(context, arbiter_flags)
        Agent->>DB: RAG search for evidence
        Agent-->>API: agent_message + citations

        API->>DB: STORE message, facts
        API-->>C: {agent_message, citations, arbiter_flags, new_facts}
    end

    C->>API: POST /sessions/{id}/end
    API->>DB: Generate summary
    API-->>C: {session_summary, weak_spots_report}
```

---

## 12. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response latency | < 3s p95 | API timing logs |
| Citation accuracy | 100% valid | No fabricated citations |
| Contradiction detection | > 80% recall | Manual review of session transcripts |
| Session completion | > 70% | Sessions that reach natural end vs abandoned |
| User preparation confidence | Qualitative | Post-session feedback |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucinated citations | High - legal accuracy critical | Strict RAG grounding; citations verified against DB |
| Slow response times | Medium - breaks flow | Streaming responses; optimize chunk retrieval |
| Contradictions missed | High - defeats purpose | Conservative extraction; multiple LLM passes |
| Document OCR quality | Medium - missing evidence | Flag low-confidence OCR; manual review queue |
| Token costs (long sessions) | Low - development phase | Summarization checkpoints; context pruning |

---

## 14. Future Enhancements (Post-MVP)

```mermaid
timeline
    title DPS Roadmap

    section MVP (Target B)
        Chat + Ledger : Core agents
                      : RAG pipeline
                      : Fact tracking

    section Enhanced (Target C)
        Document Browser : Session history
                        : Export reports
                        : Dashboard

    section Future
        Voice I/O : Timeline viz
                  : Multi-witness consistency
                  : Mobile companion
```

1. **Voice I/O** - More realistic deposition simulation
2. **Timeline Visualization** - Graphical display of established facts over time
3. **Multi-witness Consistency** - Cross-reference facts between Mom and Dad's sessions
4. **Difficulty Tuning** - Adjust Defense agent aggressiveness
5. **Export to Case Management** - Integration with legal software formats
6. **Session Replay** - Review past sessions with annotations
7. **Mobile Companion** - React Native app for on-the-go review

---

## Appendix A: Agent Prompt Templates

See `backend/app/agents/*.py` for full prompt implementations.

## Appendix B: API Response Examples

```json
// POST /api/v1/chat Response
{
  "agent_message": "You mentioned the contract was signed in 'mid-March.' Can you be more specific about the exact date? I'm looking at Exhibit A, page 1, which shows a signature date of March 15, 2024.",
  "citations": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "document_name": "Exhibit A - Signed Contract.pdf",
      "page_number": 1,
      "excerpt": "...executed this 15th day of March, 2024..."
    }
  ],
  "arbiter_flags": [
    {
      "flag_type": "vague",
      "description": "Witness used imprecise date 'mid-March' when documentary evidence shows exact date available",
      "related_fact_ids": []
    }
  ],
  "new_facts": ["660e8400-e29b-41d4-a716-446655440001"]
}
```

## Appendix C: State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: App Start

    Idle --> SessionActive: Create Session

    state SessionActive {
        [*] --> WaitingForWitness
        WaitingForWitness --> ProcessingResponse: Witness Responds
        ProcessingResponse --> ArbiterAnalyzing: Parse Message
        ArbiterAnalyzing --> AgentGenerating: Flags Ready
        AgentGenerating --> WaitingForWitness: Response Sent
    }

    SessionActive --> SessionEnded: End Session
    SessionEnded --> ReportGenerated: Generate Report
    ReportGenerated --> Idle: Close Report

    SessionActive --> Idle: Abandon Session
```

---

## 15. Authentication & Authorization

### 15.1 Authentication Strategy

Given this is a private, single-family application with sensitive legal data, we implement a simple but secure authentication layer.

```mermaid
flowchart LR
    subgraph Public
        Login["Login Page"]
    end

    subgraph Protected["Protected (Requires Auth)"]
        App["Full Application"]
        API["API Endpoints"]
    end

    Login -->|"Password Match"| JWT["Issue JWT"]
    JWT --> App
    App -->|"Bearer Token"| API
```

### 15.2 Auth Implementation

**Approach: Shared Password + JWT**

- Single shared password for family access (no user management overhead)
- Password hashed with bcrypt, stored in environment variable
- JWT tokens issued on successful login (24-hour expiry)
- All API routes protected except `/api/v1/health` and `/api/v1/auth/login`

```python
# app/api/routes/auth.py
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.hash import bcrypt
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
settings = get_settings()

class LoginRequest(BaseModel):
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate with shared password."""
    if not bcrypt.verify(request.password, settings.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password")

    expires = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode(
        {"exp": expires, "iat": datetime.utcnow()},
        settings.jwt_secret,
        algorithm="HS256"
    )
    return TokenResponse(access_token=token)

async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> bool:
    """Dependency to require valid JWT."""
    try:
        jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=["HS256"]
        )
        return True
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

### 15.3 Frontend Auth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend

    U->>FE: Visit App
    FE->>FE: Check localStorage for token

    alt No Token
        FE->>U: Show Login Page
        U->>FE: Enter Password
        FE->>API: POST /auth/login
        API-->>FE: {access_token}
        FE->>FE: Store in localStorage
    end

    FE->>U: Show App
    FE->>API: GET /sessions (Bearer token)
    API-->>FE: Session data
```

### 15.4 Environment Variables (Auth)

```bash
# Add to .env
JWT_SECRET=<random-32-char-string>
PASSWORD_HASH=<bcrypt-hash-of-password>

# Generate hash: python -c "from passlib.hash import bcrypt; print(bcrypt.hash('your-password'))"
```

### 15.5 Protected Routes Configuration

```python
# app/main.py - Add middleware
from app.api.routes.auth import require_auth

# Apply to all routes except health and auth
app.include_router(auth_router)  # No auth required
app.include_router(health_router)  # No auth required

# Protected routes
app.include_router(sessions_router, dependencies=[Depends(require_auth)])
app.include_router(chat_router, dependencies=[Depends(require_auth)])
app.include_router(documents_router, dependencies=[Depends(require_auth)])
app.include_router(ledger_router, dependencies=[Depends(require_auth)])
app.include_router(reports_router, dependencies=[Depends(require_auth)])
```

---

## 16. Deployment & CI/CD

### 16.1 Deployment Architecture

```mermaid
flowchart TB
    subgraph GitHub["GitHub"]
        Repo["Repository"]
        Actions["GitHub Actions"]
    end

    subgraph Railway["Railway Platform"]
        WebService["Web Service<br/>(FastAPI + React)"]
        PG["PostgreSQL<br/>+ pgvector"]
    end

    subgraph External["External Services"]
        OpenAI["OpenAI API"]
    end

    Repo -->|"push to main"| Actions
    Actions -->|"Deploy"| WebService
    WebService --> PG
    WebService --> OpenAI
```

### 16.2 Railway Configuration

**Project Structure:**
- Single Railway project with two services:
  1. **Web Service** - Runs the combined FastAPI backend + React frontend
  2. **PostgreSQL** - Railway-managed Postgres with pgvector plugin

**railway.toml** (already exists):
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### 16.3 Build Configuration

The app builds as a single deployable unit:
1. Frontend builds to `frontend/dist/`
2. Backend serves frontend static files
3. API routes under `/api/v1/`

```python
# app/main.py - Add static file serving
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Serve React build
frontend_path = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
```

**nixpacks.toml** (updated):
```toml
[phases.setup]
nixPkgs = ["python313", "postgresql", "nodejs_20"]

[phases.install]
cmds = [
    "pip install -e .",
    "cd frontend && npm ci && npm run build"
]

[start]
cmd = "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
```

### 16.4 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'

      - name: Install dependencies
        run: pip install -e ".[dev]"

      - name: Run tests
        run: pytest --tb=short
        env:
          DATABASE_URL: sqlite+aiosqlite:///./test.db
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up --service web
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 16.5 Environment Variables (Railway)

Set these in Railway dashboard or via CLI:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Auto-set by Railway Postgres | `postgresql://...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `OPENAI_MODEL` | LLM model | `gpt-4o` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `JWT_SECRET` | Secret for JWT signing | `<random-32-chars>` |
| `PASSWORD_HASH` | Bcrypt hash of app password | `$2b$12$...` |
| `CORS_ORIGINS` | Allowed origins | `https://yourapp.railway.app` |
| `APP_ENV` | Environment | `production` |

### 16.6 Database Setup (Railway)

Railway Postgres needs pgvector enabled:

```sql
-- Run via Railway's psql or data tab
CREATE EXTENSION IF NOT EXISTS vector;
```

Or add to migration:
```python
# alembic/versions/001_initial.py
def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    # ... rest of migrations
```

### 16.7 Deployment Commands

```bash
# Initial setup
railway login
railway link  # Link to existing project or create new

# Add Postgres
railway add --plugin postgresql

# Set environment variables
railway variables set OPENAI_API_KEY=sk-...
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set PASSWORD_HASH=$(python -c "from passlib.hash import bcrypt; print(bcrypt.hash('your-password'))")

# Deploy
railway up

# View logs
railway logs

# Open shell
railway shell
```

### 16.8 CI/CD Flow

```mermaid
flowchart LR
    subgraph Development
        Local["Local Dev"]
        Push["git push"]
    end

    subgraph CI["GitHub Actions"]
        Test["Run Tests"]
        Build["Build Check"]
    end

    subgraph CD["Deployment"]
        Deploy["Railway Deploy"]
        Health["Health Check"]
    end

    Local --> Push
    Push --> Test
    Test -->|Pass| Build
    Build -->|Pass| Deploy
    Deploy --> Health

    Test -->|Fail| Notify["Notify Developer"]
    Health -->|Fail| Rollback["Auto Rollback"]
```

### 16.9 Production Checklist

- [ ] PostgreSQL provisioned with pgvector extension
- [ ] All environment variables set in Railway
- [ ] `JWT_SECRET` is unique and secure (32+ random chars)
- [ ] `PASSWORD_HASH` generated from strong password
- [ ] `CORS_ORIGINS` set to production domain only
- [ ] GitHub secrets configured (`RAILWAY_TOKEN`, `OPENAI_API_KEY`)
- [ ] Health check endpoint responding
- [ ] Database migrations applied
- [ ] Documents re-ingested in production (or migrated)

### 16.10 Cost Estimate (Railway)

| Resource | Tier | Est. Monthly |
|----------|------|--------------|
| Web Service | Hobby | $5 |
| PostgreSQL | Hobby (1GB) | $5 |
| **Total** | | **~$10/mo** |

*Note: OpenAI API costs are separate, typically $5-20/mo for moderate use.*

---

## 17. Witness Profiles

### 17.1 Overview

Witness Profiles enable context-aware questioning tailored to each individual's role, knowledge, and relationship to the case. The system adjusts agent behavior based on who is being prepared.

### 17.2 Profile Data Model

```mermaid
erDiagram
    WITNESS_PROFILES ||--o{ SESSIONS : "prepares for"
    WITNESS_PROFILES ||--o{ PROFILE_DOCUMENTS : "is familiar with"
    DOCUMENTS ||--o{ PROFILE_DOCUMENTS : "known by"

    WITNESS_PROFILES {
        uuid id PK
        string name
        string role
        string relationship_to_case
        text knowledge_areas
        text limitations
        text notes
        int agent_intensity
        timestamp created_at
        timestamp updated_at
    }

    PROFILE_DOCUMENTS {
        uuid profile_id FK
        uuid document_id FK
        string familiarity_level
    }
```

### 17.3 Database Schema

```sql
-- Witness profiles table
CREATE TABLE witness_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- 'plaintiff', 'defendant', 'witness', 'expert'
    relationship_to_case TEXT NOT NULL,  -- "Property owner", "Site manager", "Attorney"
    knowledge_areas TEXT[],  -- Array of topic tags
    limitations TEXT,  -- What they DON'T know
    notes TEXT,  -- Attorney notes about this witness
    agent_intensity INTEGER DEFAULT 5 CHECK (agent_intensity BETWEEN 1 AND 10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction table for documents the witness is familiar with
CREATE TABLE profile_documents (
    profile_id UUID REFERENCES witness_profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    familiarity_level VARCHAR(50) DEFAULT 'familiar',  -- 'authored', 'familiar', 'mentioned'
    PRIMARY KEY (profile_id, document_id)
);

-- Update sessions to reference profiles
ALTER TABLE sessions ADD COLUMN profile_id UUID REFERENCES witness_profiles(id);
```

### 17.4 Pydantic Schemas

```python
# schemas/profiles.py
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Literal

class ProfileCreate(BaseModel):
    name: str
    role: Literal['plaintiff', 'defendant', 'witness', 'expert']
    relationship_to_case: str
    knowledge_areas: list[str] = []
    limitations: str | None = None
    notes: str | None = None
    agent_intensity: int = Field(default=5, ge=1, le=10)
    familiar_document_ids: list[UUID] = []

class ProfileResponse(BaseModel):
    id: UUID
    name: str
    role: str
    relationship_to_case: str
    knowledge_areas: list[str]
    limitations: str | None
    notes: str | None
    agent_intensity: int
    familiar_documents: list[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}

class ProfileSummary(BaseModel):
    id: UUID
    name: str
    role: str
    relationship_to_case: str
```

### 17.5 API Endpoints

```yaml
# Profile Management
POST   /api/v1/profiles              # Create witness profile
GET    /api/v1/profiles              # List all profiles
GET    /api/v1/profiles/{id}         # Get profile details
PUT    /api/v1/profiles/{id}         # Update profile
DELETE /api/v1/profiles/{id}         # Delete profile

# Profile-Document Association
POST   /api/v1/profiles/{id}/documents      # Add familiar documents
DELETE /api/v1/profiles/{id}/documents/{doc_id}  # Remove familiar document

# Profile Sessions
GET    /api/v1/profiles/{id}/sessions       # Get all sessions for this witness
GET    /api/v1/profiles/{id}/facts          # Get all facts from this witness
```

### 17.6 Agent Prompt Injection

The witness profile context is injected into agent system prompts:

```python
def build_profile_context(profile: WitnessProfile) -> str:
    """Build context string for agent prompts."""
    return f"""
WITNESS PROFILE:
- Name: {profile.name}
- Role: {profile.role}
- Relationship to Case: {profile.relationship_to_case}
- Areas of Knowledge: {', '.join(profile.knowledge_areas)}
- Limitations: {profile.limitations or 'None specified'}
- Notes: {profile.notes or 'None'}

IMPORTANT: Tailor your questions to this witness's knowledge and role.
- Only ask about topics within their knowledge areas
- Do not ask about documents they are not familiar with
- Acknowledge their limitations when relevant
- Adjust questioning intensity to level {profile.agent_intensity}/10
"""
```

### 17.7 Profile-Aware Agent Behavior

```mermaid
flowchart TD
    subgraph Input
        WitnessResponse["Witness Response"]
        Profile["Witness Profile"]
    end

    subgraph Processing
        Arbiter["Arbiter Engine"]
        ProfileFilter["Profile Filter"]
        Agent["Active Agent"]
    end

    subgraph Output
        Question["Tailored Question"]
        Citations["Relevant Citations"]
    end

    WitnessResponse --> Arbiter
    Profile --> ProfileFilter
    Arbiter --> ProfileFilter
    ProfileFilter -->|"Filter by knowledge areas"| Agent
    ProfileFilter -->|"Filter by familiar docs"| Citations
    Agent --> Question
    Citations --> Question
```

### 17.8 Example Profiles

**Profile: Stuart (Dad)**
```json
{
  "name": "Stuart",
  "role": "plaintiff",
  "relationship_to_case": "Property owner, lead attorney, primary decision-maker",
  "knowledge_areas": [
    "contract negotiations",
    "legal filings",
    "contractor communications",
    "financial decisions",
    "depositions taken"
  ],
  "limitations": "Not present at property for day-to-day construction oversight",
  "notes": "Conducted all depositions of defendants. Authored most legal filings.",
  "agent_intensity": 7
}
```

**Profile: Mom**
```json
{
  "name": "Linda",
  "role": "plaintiff",
  "relationship_to_case": "Property co-owner, primary point of contact with contractor",
  "knowledge_areas": [
    "initial contractor selection",
    "kitchen design decisions",
    "communications with contractor",
    "damage discovery"
  ],
  "limitations": "Not involved in legal filings. Did not attend depositions.",
  "notes": "More emotionally impacted. May need gentler coaching approach.",
  "agent_intensity": 4
}
```

**Profile: Sister**
```json
{
  "name": "Sarah",
  "role": "witness",
  "relationship_to_case": "Property site manager during renovation",
  "knowledge_areas": [
    "day-to-day construction progress",
    "worker presence and scheduling",
    "visible damage and defects",
    "contractor on-site behavior"
  ],
  "limitations": "Not on contract. Not involved in financial or legal decisions.",
  "notes": "Key witness for timeline of events and physical observations.",
  "agent_intensity": 6
}
```

### 17.9 Cross-Witness Consistency

When multiple profiles exist, the system can detect inconsistencies:

```mermaid
flowchart LR
    subgraph Profiles
        Dad["Dad's Facts"]
        Mom["Mom's Facts"]
        Sister["Sister's Facts"]
    end

    subgraph Consistency["Consistency Engine"]
        Compare["Compare Facts"]
        Flag["Flag Inconsistencies"]
    end

    subgraph Output
        Report["Consistency Report"]
        Alerts["Real-time Alerts"]
    end

    Dad --> Compare
    Mom --> Compare
    Sister --> Compare
    Compare --> Flag
    Flag --> Report
    Flag --> Alerts
```

---

## 18. Batch Question Generator

### 18.1 Overview

Generate multiple deposition prep questions at once for offline practice or printed study materials. Questions are tailored to the selected witness profile and agent mode.

### 18.2 Request/Response Schema

```python
# schemas/batch.py
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Literal

class BatchQuestionRequest(BaseModel):
    profile_id: UUID
    agent_mode: Literal['plaintiff_coach', 'defense_cross']
    question_count: int = Field(default=10, ge=5, le=25)
    focus_areas: list[str] = []  # Optional topic focus
    difficulty: Literal['easy', 'medium', 'hard'] = 'medium'
    include_citations: bool = True

class GeneratedQuestion(BaseModel):
    question: str
    topic: str
    difficulty: str
    citations: list[Citation] = []
    coaching_note: str | None = None  # For plaintiff_coach mode
    trap_warning: str | None = None   # For defense_cross mode

class BatchQuestionResponse(BaseModel):
    profile_name: str
    agent_mode: str
    questions: list[GeneratedQuestion]
    generated_at: str
    print_url: str  # URL to print-friendly version
```

### 18.3 API Endpoints

```yaml
POST /api/v1/batch/questions           # Generate batch questions
GET  /api/v1/batch/questions/{id}      # Get previously generated batch
GET  /api/v1/batch/questions/{id}/print  # Get print-friendly HTML/PDF
```

### 18.4 Generation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Backend
    participant Profile as Profile Service
    participant RAG as RAG Pipeline
    participant LLM as OpenAI

    U->>API: POST /batch/questions {profile_id, count, mode}
    API->>Profile: Get witness profile
    Profile-->>API: Profile context

    API->>RAG: Get relevant documents for profile
    RAG-->>API: Document chunks

    API->>LLM: Generate questions with context
    Note over LLM: System prompt includes:<br/>- Profile context<br/>- Agent persona<br/>- Document excerpts<br/>- Difficulty level

    LLM-->>API: Generated questions

    API->>API: Attach citations to each question
    API->>API: Store batch for retrieval

    API-->>U: BatchQuestionResponse
```

### 18.5 LLM Prompt Template

```python
BATCH_QUESTION_PROMPT = """
You are generating deposition preparation questions for a witness.

WITNESS PROFILE:
{profile_context}

AGENT MODE: {agent_mode}
- plaintiff_coach: Supportive questions to help witness practice clear, accurate testimony
- defense_cross: Aggressive questions to stress-test the witness

DIFFICULTY: {difficulty}
- easy: Straightforward factual questions
- medium: Questions requiring recall and explanation
- hard: Complex questions, potential traps, timeline challenges

FOCUS AREAS: {focus_areas}

RELEVANT DOCUMENT EXCERPTS:
{document_excerpts}

Generate exactly {count} questions. For each question, provide:
1. The question text
2. Topic category
3. Difficulty rating
4. For coach mode: A coaching note on how to answer well
5. For cross mode: A warning about the trap being set

Return as JSON array.
"""
```

### 18.6 Print View Component

```mermaid
flowchart TD
    subgraph PrintLayout["Print-Friendly Layout"]
        Header["Header: Witness Name, Date, Mode"]
        Instructions["Instructions for Practice"]

        subgraph Questions["Questions Section"]
            Q1["Q1: Question text<br/>Topic: [tag]<br/>Difficulty: ⭐⭐⭐"]
            Q2["Q2: Question text<br/>Topic: [tag]<br/>Difficulty: ⭐⭐"]
            QN["..."]
        end

        subgraph Notes["Answer Notes (Optional)"]
            N1["Coaching tips / Trap warnings"]
        end

        Footer["Generated by DPS | Page X of Y"]
    end

    Header --> Instructions
    Instructions --> Questions
    Questions --> Notes
    Notes --> Footer
```

---

## 19. Source/Document Browser

### 19.1 Overview

A searchable, filterable interface to browse all ingested case documents, view their contents, and see how they're referenced across sessions and facts.

### 19.2 Document List View

```mermaid
flowchart TD
    subgraph Filters["Filter Bar"]
        Search["🔍 Search filename/content"]
        TypeFilter["Type: All | Deposition | Exhibit | Correspondence"]
        DateFilter["Date Range"]
        WitnessFilter["Referenced by Witness"]
    end

    subgraph DocumentList["Document List"]
        Doc1["📄 Contract_2024-03-15.pdf<br/>Type: Contract | 12 pages | 47 chunks<br/>Referenced in: 3 sessions, 8 facts"]
        Doc2["📄 Email_Contractor_2024-04.pdf<br/>Type: Correspondence | 3 pages | 12 chunks<br/>Referenced in: 2 sessions, 4 facts"]
        Doc3["📄 Deposition_Smith.pdf<br/>Type: Deposition | 89 pages | 234 chunks<br/>Referenced in: 5 sessions, 23 facts"]
    end

    Filters --> DocumentList
```

### 19.3 Document Detail View

```mermaid
flowchart TD
    subgraph DocHeader["Document Header"]
        Title["📄 Contract_2024-03-15.pdf"]
        Meta["Type: Contract | 12 pages | Ingested: Jan 15, 2026"]
        Actions["[View PDF] [Re-ingest] [Delete]"]
    end

    subgraph Tabs["Content Tabs"]
        ChunksTab["Chunks (47)"]
        RefsTab["References (11)"]
        FactsTab["Related Facts (8)"]
    end

    subgraph ChunkList["Chunks View"]
        Chunk1["Page 1, Chunk 1<br/>'This agreement entered into on March 15...'"]
        Chunk2["Page 1, Chunk 2<br/>'The contractor agrees to complete all work...'"]
    end

    subgraph RefsList["References View"]
        Ref1["Session: Dad Prep #3<br/>Message: 'The contract clearly states...'"]
        Ref2["Session: Mom Prep #1<br/>Message: 'According to the agreement...'"]
    end

    DocHeader --> Tabs
    Tabs --> ChunksTab
    Tabs --> RefsTab
    Tabs --> FactsTab
    ChunksTab --> ChunkList
    RefsTab --> RefsList
```

### 19.4 API Endpoints

```yaml
# Document Browsing
GET  /api/v1/documents                    # List with filters
GET  /api/v1/documents/{id}               # Document details
GET  /api/v1/documents/{id}/chunks        # Get all chunks
GET  /api/v1/documents/{id}/references    # Where document is cited
GET  /api/v1/documents/{id}/facts         # Facts derived from document

# Document Search
GET  /api/v1/documents/search?q=keyword   # Full-text search across chunks

# Document Stats
GET  /api/v1/documents/stats              # Aggregate statistics
```

### 19.5 Search Implementation

```python
# services/document_search.py
class DocumentSearchService:
    async def search(
        self,
        query: str,
        document_type: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        limit: int = 20
    ) -> list[SearchResult]:
        """
        Search documents using:
        1. Filename match (exact and fuzzy)
        2. Vector similarity on chunks
        3. Full-text search on content
        """
        results = []

        # Vector search for semantic matching
        vector_results = await self.retrieval.search(query, top_k=limit)

        # Aggregate by document
        doc_scores = defaultdict(float)
        for r in vector_results:
            doc_scores[r['document_id']] += r['score']

        # Apply filters and return
        return self._apply_filters(doc_scores, document_type, date_from, date_to)
```

### 19.6 Document Statistics Dashboard

```python
class DocumentStats(BaseModel):
    total_documents: int
    total_pages: int
    total_chunks: int
    documents_by_type: dict[str, int]
    most_referenced: list[DocumentSummary]
    recently_ingested: list[DocumentSummary]
    unread_documents: list[DocumentSummary]  # Never referenced in sessions
```

---

## 20. SaaS Roadmap

### 20.1 Feature Prioritization Matrix

```mermaid
quadrantChart
    title Feature Priority (Value vs Effort)
    x-axis Low Effort --> High Effort
    y-axis Low Value --> High Value
    quadrant-1 Quick Wins
    quadrant-2 Major Projects
    quadrant-3 Fill-ins
    quadrant-4 Time Sinks

    "Batch Questions": [0.3, 0.7]
    "Witness Profiles": [0.5, 0.85]
    "Print/Export": [0.25, 0.75]
    "Source Browser": [0.45, 0.55]
    "Agent Intensity": [0.2, 0.5]
    "Multi-Case": [0.7, 0.9]
    "Team Collab": [0.85, 0.8]
    "Transcript Import": [0.6, 0.75]
    "Analytics Dashboard": [0.65, 0.7]
    "User Management": [0.7, 0.6]
    "Billing/Stripe": [0.6, 0.5]
    "Voice I/O": [0.9, 0.6]
```

### 20.2 Phase 1: Core Enhancement (Current Sprint)

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| Witness Profiles | 🔲 Planned | 1 | Profile-aware questioning |
| Batch Question Generator | 🔲 Planned | 2 | Generate 5-25 questions at once |
| Print/Export | 🔲 Planned | 3 | PDF export for questions and reports |
| Source Browser | 🔲 Planned | 4 | Browse/search all documents |
| Logout Button | 🔲 Planned | 5 | Basic UX improvement |

### 20.3 Phase 2: Multi-Tenancy Foundation

| Feature | Description |
|---------|-------------|
| User Accounts | Individual attorney logins with email/password |
| Case Management | Organize documents and sessions by case |
| Team Invites | Invite co-counsel, paralegals to a case |
| Role Permissions | Admin, Attorney, Paralegal, Witness (limited) |

### 20.4 Phase 3: Premium Features

| Feature | Description |
|---------|-------------|
| Deposition Transcript Import | Ingest real transcripts for analysis |
| Cross-Examination Replay | Review actual deposition against prep |
| Contradiction Timeline | Visual timeline of testimony evolution |
| Analytics Dashboard | Prep effectiveness metrics |
| Custom Agent Personas | Create specialized questioning styles |

### 20.5 Phase 4: Scale & Integration

| Feature | Description |
|---------|-------------|
| Billing (Stripe) | Subscription tiers: Solo, Team, Firm |
| API Access | Let firms integrate with existing tools |
| Case Management Integrations | Clio, MyCase, PracticePanther |
| White-Label Option | For large firms |
| Mobile App | React Native companion |

### 20.6 Pricing Model (Proposed)

| Tier | Price | Features |
|------|-------|----------|
| **Solo** | $49/mo | 1 user, 3 active cases, 500 docs |
| **Team** | $149/mo | 5 users, 10 cases, 2000 docs |
| **Firm** | $399/mo | Unlimited users, cases, docs, priority support |
| **Enterprise** | Custom | White-label, API, integrations, SLA |

### 20.7 Competitive Landscape

```mermaid
flowchart LR
    subgraph Competitors
        Lexis["LexisNexis"]
        West["Westlaw"]
        CS["CaseText"]
        HL["Harvey AI"]
    end

    subgraph DPS["DPS Differentiators"]
        D1["Deposition-focused<br/>(not general legal research)"]
        D2["Adversarial practice<br/>(simulate opposing counsel)"]
        D3["Witness-specific prep<br/>(profiles & tailoring)"]
        D4["Fact consistency tracking<br/>(catch contradictions)"]
    end

    Competitors -.->|"General legal AI"| DPS
    DPS -->|"Specialized niche"| Market["Deposition Prep Market"]
```

### 20.8 Success Metrics (SaaS)

| Metric | Target | Measurement |
|--------|--------|-------------|
| MRR | $10K by Month 6 | Stripe dashboard |
| User retention | >80% monthly | Active sessions per user |
| NPS | >50 | Post-session surveys |
| Prep-to-deposition correlation | Track | User feedback on actual outcomes |
| Time saved vs traditional prep | >40% | User surveys |