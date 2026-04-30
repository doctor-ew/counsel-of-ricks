# Deposition Prep Simulator (DPS)

AI-powered deposition preparation system featuring adversarial and coaching agents with document-grounded responses and contradiction tracking.

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 18+
- Docker (for PostgreSQL + pgvector)
- OpenAI API key

### 1. Start the Database

```bash
cd docker
docker-compose up -d
```

This starts PostgreSQL 16 with pgvector extension on port 5432.

### 2. Setup Backend

```bash
# From project root
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Install dependencies (using uv, which is already set up)
uv sync

# Or with pip
pip install -e ".[dev]"
```

### 3. Ingest Documents

```bash
# Activate virtual environment
source .venv/bin/activate

# Start the API to ingest documents
uvicorn app.main:app --reload --port 8000

# In another terminal, trigger ingestion via API
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{}'
```

This will ingest all 799 PDFs from the configured DOCUMENTS_PATH.

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### 5. Use the App

1. Open http://localhost:5173
2. Enter witness name (e.g., "Dad" or "Mom")
3. Choose mode:
   - **Plaintiff Coach**: Friendly prep to build your narrative
   - **Defense Cross**: Aggressive stress-testing
4. Start answering questions
5. Watch the Fact Ledger sidebar track your claims and flag issues

## Project Structure

```
CourtPrep/
├── app/                    # FastAPI backend
│   ├── agents/             # AI agents (Coach, Defense, Arbiter)
│   ├── api/routes/         # API endpoints
│   ├── db/                 # Database models
│   ├── schemas/            # Pydantic schemas
│   └── services/           # Business logic
├── frontend/               # React + TypeScript + Tailwind
│   └── src/
│       ├── components/     # React components
│       ├── hooks/          # React Query hooks
│       └── pages/          # Page components
├── docker/                 # Docker Compose config
├── SPEC.md                 # Technical specification
└── depo_prep_prd.md        # Product requirements
```

## Key Features

- **Three AI Agents**:
  - Plaintiff Coach: Builds narrative, teaches safe testimony practices
  - Defense Cross-Examiner: Aggressive stress-testing, exploits weaknesses
  - Arbiter: Tracks facts, detects contradictions, finds documentary support

- **RAG-Grounded Responses**: All agent questions cite actual case documents

- **Fact Ledger**: Real-time tracking of:
  - Established facts with confidence levels
  - Documentary support (or lack thereof)
  - Contradictions between statements

- **Session Reports**: End-of-session summaries with weak spots and attack vectors

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ingest` | POST | Ingest PDFs from documents directory |
| `/api/v1/sessions` | POST | Create new prep session |
| `/api/v1/chat` | POST | Send message, get agent response |
| `/api/v1/sessions/{id}/ledger` | GET | Get fact ledger |
| `/api/v1/sessions/{id}/end` | POST | End session, get report |

## Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://depo:localdev@localhost:5432/deposition_prep
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o
DOCUMENTS_PATH=/path/to/case/documents
```

## Development

```bash
# Run backend with auto-reload
uvicorn app.main:app --reload --port 8000

# Run frontend dev server
cd frontend && npm run dev

# Run backend tests
pytest

# Lint
ruff check app/
```

## Architecture

See [SPEC.md](./SPEC.md) for full technical specification including:
- System diagrams (Mermaid)
- Database schema
- Agent prompts
- API design
- Frontend component hierarchy
