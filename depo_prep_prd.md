# 📄 Product Requirements Document (PRD)

## Product Name
**Deposition Prep Simulator (DPS)**  
_internal codename: Moot Court in a Box_

---

## Problem Statement

A plaintiff (an attorney himself) and a lay co-plaintiff need to prepare for depositions and trial testimony related to a home renovation dispute. They possess a large corpus of case documents (primarily depositions and exhibits in PDF format) but need a structured, adversarial, and document-grounded way to practice answering questions, identify weaknesses, and improve consistency.

Traditional preparation methods (manual review, mock questioning) are time-intensive and lack persistent memory, contradiction tracking, and document-level citation support.

---

## Goal

Build a **local-first, document-grounded AI system** that simulates realistic deposition preparation using multiple AI agents:

1. A **Plaintiff Coach** who helps the witness tell a clear, truthful, and consistent story
2. A **Defense Cross-Examiner** who aggressively stress-tests testimony
3. A neutral **Arbiter / Referee** who:
   - Tracks factual assertions
   - Detects contradictions
   - Enforces evidentiary grounding
   - Produces actionable feedback after each session

The system must always remain anchored to the source documents and encourage safe, accurate testimony.

---

## Non-Goals

- Providing legal advice or litigation strategy
- Replacing real attorneys
- Generating fabricated evidence or citations
- Producing courtroom filings or pleadings

---

## Target Users

- **Primary**: Plaintiff and co-plaintiff preparing for deposition or trial
- **Secondary**: Supporting counsel assisting with preparation

---

## Key Use Cases

1. Practice questioning from both friendly and hostile perspectives
2. Identify weak spots in testimony (vagueness, inconsistency, unsupported claims)
3. Improve recall by grounding answers in documents
4. Train safe responses (“I don’t recall”, “I’d need to review the document”)
5. Generate a session summary highlighting risks and follow-ups

---

## Functional Requirements

### 1. Document Ingestion & Indexing

- Recursively ingest a directory of PDF files
- Optional OCR support for scanned documents
- Extract and store:
  - Document name
  - Page number
  - Text content
- Chunk documents in **legal-friendly units**:
  - Prefer page-bounded or Q/A-style chunks
- Embed and store chunks in **Postgres + pgvector**
- Preserve metadata for citation

**Acceptance Criteria**
- System can answer questions with document name + page + excerpt
- No hallucinated citations

---

### 2. Retrieval-Augmented Generation (RAG)

- All agent responses must use retrieved document context
- If no supporting evidence exists, the system must explicitly say so
- Retrieval must support:
  - Global search
  - Document-filtered search (e.g., by deposition or exhibit)

**Acceptance Criteria**
- Responses always reference retrieved context or explicitly decline

---

### 3. Agent Roles

#### A. Plaintiff Coach Agent

- Friendly, structured questioning
- Builds a chronological narrative
- Helps clarify facts without exaggeration
- Encourages precision and honesty
- Periodically summarizes the “story so far”

#### B. Defense Cross-Examiner Agent

- Adversarial and skeptical
- Pushes for yes/no answers where appropriate
- Exploits vagueness and inconsistency
- Challenges causation, damages, and credibility
- Presses contradictions flagged by the Arbiter

#### C. Arbiter / Referee Agent

- Neutral oversight role
- Maintains a **Fact Ledger**:
  - Atomic factual claims
  - Certainty level
  - Source (witness vs document)
  - Citations when available
- Detects contradictions between:
  - Witness statements
  - Prior ledger entries
  - Document evidence
- Flags risk areas in real time
- Produces session summaries and reports

**Acceptance Criteria**
- Contradictions are explicitly flagged
- Unsupported claims are labeled
- Session ends with a structured feedback report

---

### 4. Interview Session Flow

1. User selects agent mode:
   - Plaintiff Coach
   - Defense Cross
2. Agent asks one question at a time
3. User responds via text input
4. Arbiter processes response:
   - Updates Fact Ledger
   - Flags risks or contradictions
   - Suggests follow-ups
5. Loop continues
6. Session ends with a **Weak Spots Report**

---

### 5. Fact Ledger

- Persisted per session
- Stores:
  - Fact text
  - Confidence level (certain / uncertain / estimate / don’t recall)
  - Supporting citations (if any)
  - Contradiction flags
- Used by all agents as shared memory

**Acceptance Criteria**
- Ledger entries persist across session turns
- Contradictions reference exact prior facts

---

### 6. Session Output

At end of session, generate:
- Key facts established
- Ambiguities and risks
- Likely defense attack vectors
- Missing documents to locate
- Suggested practice questions

Exportable formats:
- Markdown
- Plain text (initial version)

---

## Non-Functional Requirements

### Accuracy & Safety
- Never fabricate citations
- Never encourage dishonesty
- Encourage uncertainty where appropriate

### Performance
- Local-first execution
- Acceptable latency for interactive use (<3s per turn preferred)

### Privacy
- Runs fully locally by default
- No document content stored externally unless explicitly configured

---

## Technical Stack (Initial)

- **Language**: Python
- **API**: FastAPI
- **RAG Framework**: LlamaIndex
- **Vector Store**: Postgres + pgvector
- **LLM**: Configurable (OpenAI / Bedrock / local later)
- **Storage**:
  - Document text + embeddings
  - Fact Ledger (Postgres tables)

---

## Open Questions / Future Enhancements

- UI (CLI vs Web UI)
- Voice input/output
- Timeline visualization
- Multi-session memory
- Export to attorney-friendly formats
- Role-specific difficulty tuning
- Jury-style “credibility scoring”

---

## Success Criteria

The product is successful if:
- Users feel meaningfully better prepared for questioning
- Inconsistencies are discovered **before** deposition
- Testimony becomes more precise, confident, and document-anchored
- The Defense agent makes users uncomfortable (but grateful)

---
