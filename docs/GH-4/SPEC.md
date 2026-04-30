# GH-4 — Swap ingestion pipeline: R&M transcripts (.txt) instead of PDFs

**Issue:** #4
**Beads:** Councel_of_Ricks-nrv
**Phase:** spec

---

## Background

The original `IngestionService` was built to ingest legal case PDFs using PyMuPDF (`fitz`). The corpus is now 85 Rick and Morty episode transcripts scraped as `.txt` files into `./transcripts/`. The PDF extraction layer (`fitz.open()`, `_extract_pages()`) must be replaced with a plain-text reader. Everything downstream — `SentenceSplitter`, `OpenAIEmbedding`, pgvector storage — stays identical.

---

## What This Builds

Replace `_ingest_pdf()` and `_extract_pages()` in `IngestionService` with `_ingest_txt()` and `_read_txt()` so `.txt` transcript files load into pgvector through the existing chunk/embedding pipeline.

---

## Technical Approach

### 1. `app/services/ingestion.py`

- `ingest_directory()`: change `path.rglob("*.pdf")` → `path.rglob("*.txt")`; update log message
- Remove `_ingest_pdf()` and `_extract_pages()` entirely
- Add `_ingest_txt(txt_path: Path) -> tuple[str, int]`:
  - Read file with `txt_path.read_text(encoding="utf-8")`
  - Call `_sanitize_text()` (reuse as-is — null byte stripping still valid for .txt)
  - Split into chunks via existing `SentenceSplitter` — no change needed
  - Create `Document` record: `filename=txt_path.name`, `file_path=str(txt_path)`, `document_type="episode"`, `total_pages=None` (no page concept), `deponent_name=None`
  - Create `Chunk` records: `page_number=1` (sentinel — no real pages), `chunk_index=idx`, `content=chunk_text`
  - Embed via existing `_get_embedding()` — no change
- Remove `_infer_document_type()` — episodes always return `"episode"`; delete method
- Remove `import fitz` line
- Update type annotation on `ingest_directory` log: `"Found {n} transcript files"`

### 2. `app/config.py`

- Change `documents_path: str = ""` default to `documents_path: str = "./transcripts"`

### 3. `pyproject.toml` + `requirements.txt`

- Remove `PyMuPDF` (provides `fitz`) from both files — no longer needed

### 4. `scripts/ingest.py`

- No logic change; inherits `documents_path` default from config — verify it still runs cleanly

### 5. `app/api/routes/documents.py`

- No change — `IngestRequest.directory_path` is already optional; route docstring references "PDF documents" — update to "transcript files"

---

## Files to Change

| File | Change |
|---|---|
| `app/services/ingestion.py` | Replace PDF extraction with .txt reader; remove fitz import and `_infer_document_type` |
| `app/config.py` | Default `documents_path` → `"./transcripts"` |
| `pyproject.toml` | Remove PyMuPDF dependency |
| `requirements.txt` | Remove PyMuPDF |
| `app/api/routes/documents.py` | Update docstring only |

---

## Acceptance Criteria

- [ ] Running `python scripts/ingest.py` against `./transcripts/` ingests all 85 `.txt` files without error
- [ ] `chunks` table is populated with embeddings (verify via `SELECT COUNT(*) FROM chunks`)
- [ ] `documents` table shows `document_type = 'episode'` for all rows
- [ ] No `fitz` / PyMuPDF import anywhere in the codebase
- [ ] A RAG search query (e.g. "pickle rick garage") returns a ranked result with correct episode filename and chunk content

---

## Model Router

Files to change: 5 (across 3 modules: services, config, deps).
Includes a service rewrite but no architecture or shared-contract change.

**Decision:** Sonnet / General Engineer

---

## Sources

- `app/services/ingestion.py:1-170` (branch: main, commit: 0f52a4c) — full ingestion service; confirmed `_ingest_pdf`, `_extract_pages`, `_infer_document_type`, `fitz.open()`, `SentenceSplitter(chunk_size=512, chunk_overlap=50)`, `OpenAIEmbedding`
- `app/db/models.py:23-38` (branch: main, commit: 0f52a4c) — `Document` model; confirmed `total_pages`, `deponent_name`, `document_type` fields exist and are nullable
- `app/db/models.py:41-57` (branch: main, commit: 0f52a4c) — `Chunk` model; confirmed `page_number` is non-nullable int (will use sentinel value 1)
- `app/schemas/documents.py:27-35` (branch: main, commit: 0f52a4c) — `IngestRequest`, `IngestResponse` schemas; no change needed
- `app/api/routes/documents.py:20-37` (branch: main, commit: 0f52a4c) — `POST /ingest` route; confirmed docstring-only change required
- `app/config.py:38-40` (branch: main, commit: 0f52a4c) — `documents_path: str = ""`; confirmed default needs update
- `scripts/ingest.py:1-40` (branch: main, commit: 0f52a4c) — CLI entry point; confirmed no logic change needed
