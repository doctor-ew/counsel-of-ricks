# GH-2 — Switch LLM from OpenAI to Claude (claude-sonnet-4-6)

**Issue:** #2
**Beads:** Councel_of_Ricks-rh5
**Phase:** spec

---

## Background

Every LLM call in the agent layer currently goes through `AsyncOpenAI`. The demo story is Claude Code building a Claude-powered app — running on OpenAI breaks that narrative. The embedding layer (`OpenAIEmbedding` in `IngestionService` and `RetrievalService`) stays on OpenAI because Claude has no embedding API; pgvector's 1536-dimension vectors are OpenAI-specific and changing the embedding model would require re-ingesting the entire corpus.

---

## What This Builds

Swap every `AsyncOpenAI` LLM call in the agent and service layer to `anthropic.AsyncAnthropic`, targeting `claude-sonnet-4-6`. The `OpenAIEmbedding` instances in `ingestion.py` and `retrieval.py` are explicitly out of scope — they stay.

---

## Technical Approach

### 1. `app/config.py`

Add Anthropic config alongside existing OpenAI embedding config:

```python
# Anthropic (LLM calls)
anthropic_api_key: str
anthropic_model: str = "claude-sonnet-4-6"

# OpenAI (embeddings only — Claude has no embedding API)
openai_api_key: str = ""       # still needed by retrieval + ingestion
openai_embedding_model: str = "text-embedding-3-small"
```

Remove `openai_model: str = "gpt-4o"` — no longer used by any LLM call.

### 2. `app/agents/base.py`

- Replace `from openai import AsyncOpenAI` → `import anthropic`
- Replace `self.client = AsyncOpenAI(api_key=settings.openai_api_key)` → `self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)`
- Replace `self.model = settings.openai_model` → `self.model = settings.anthropic_model`
- In `generate_response()`, replace `self.client.chat.completions.create()` with Anthropic `messages.create()`:
  - Extract `system=` from `messages` list (Anthropic takes system as top-level param, not a role in messages)
  - Map `"witness"` role → `"user"`, agent role → `"assistant"` (already done)
  - Replace `response.choices[0].message.content or ""` → `response.content[0].text`
  - Add `max_tokens=1024` (required by Anthropic SDK — was optional in OpenAI)

### 3. `app/agents/arbiter.py`

- Replace `from openai import AsyncOpenAI` → `import anthropic`
- Replace `self.client = AsyncOpenAI(api_key=settings.openai_api_key)` → `self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)`
- Replace `self.model = settings.openai_model` → `self.model = settings.anthropic_model`
- Update all `client.chat.completions.create()` calls to `client.messages.create()` with same system/messages restructure as base agent
- Update response parsing to `response.content[0].text`

### 4. `app/services/questions.py`

- Replace `from openai import AsyncOpenAI` → `import anthropic`
- Replace `self.client = AsyncOpenAI(api_key=settings.openai_api_key)` → `self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)`
- Update `client.chat.completions.create()` call at line 68-69 → `client.messages.create()`
- Update response parsing

### 5. `app/services/clerk.py`

- Replace `from openai import AsyncOpenAI` → `import anthropic`
- Replace `self.client = AsyncOpenAI(...)` and `self.model` at lines 47-48
- Update both `client.chat.completions.create()` calls (lines 121, 171) → `client.messages.create()`
- Update response parsing on both calls

### 6. `pyproject.toml` + `requirements.txt`

- Add `anthropic>=0.40.0` (AsyncAnthropic available since 0.20+)
- Keep `openai` dependency (still required for `OpenAIEmbedding` in retrieval + ingestion)

### 7. `.env.example`

- Add `ANTHROPIC_API_KEY=your-key-here`
- Rename `OPENAI_API_KEY` comment to clarify it's embeddings-only

---

## Anthropic SDK Shape Reference

```python
# OpenAI (old)
response = await self.client.chat.completions.create(
    model=self.model,
    messages=[{"role": "system", "content": sys_prompt}, ...user_msgs],
    temperature=0.7,
    max_tokens=1000,
)
text = response.choices[0].message.content or ""

# Anthropic (new)
response = await self.client.messages.create(
    model=self.model,
    system=sys_prompt,               # system is top-level, not in messages list
    messages=[...user_msgs],         # no system role in messages
    temperature=1.0,                 # Anthropic default; 0.7 also valid
    max_tokens=1024,                 # required
)
text = response.content[0].text
```

---

## Files to Change

| File | Change |
|---|---|
| `app/config.py` | Add `anthropic_api_key`, `anthropic_model`; remove `openai_model` |
| `app/agents/base.py` | Swap client + API call shape |
| `app/agents/arbiter.py` | Swap client + API call shape |
| `app/services/questions.py` | Swap client + API call shape |
| `app/services/clerk.py` | Swap client + API call shape (2 call sites) |
| `pyproject.toml` | Add `anthropic` package |
| `requirements.txt` | Add `anthropic` package |
| `.env.example` | Add `ANTHROPIC_API_KEY` |

---

## Explicitly Out of Scope

- `app/services/ingestion.py` — `OpenAIEmbedding` stays
- `app/services/retrieval.py` — `OpenAIEmbedding` stays
- No re-ingestion of transcripts required

---

## Acceptance Criteria

- [ ] All agent responses stream from `claude-sonnet-4-6` (verify via Anthropic dashboard or response metadata)
- [ ] No `AsyncOpenAI` import remains in `agents/` or `services/questions.py` or `services/clerk.py`
- [ ] Embeddings still work — RAG search returns results (confirms `OpenAIEmbedding` untouched)
- [ ] A full session (Coach → witness response → Arbiter analysis → Defense question) completes without error
- [ ] `ANTHROPIC_API_KEY` in `.env` is the only key needed to run a session

---

## Model Router

Files to change: 8 (across 5 modules). Touches agent base class + 3 services — a shared-contract change (API call shape affects every agent subclass).

**Decision:** Opus / Enterprise Architect

---

## Sources

- `app/agents/base.py:1-80` (branch: main, commit: 0f52a4c) — confirmed `AsyncOpenAI`, `self.client`, `self.model`, `chat.completions.create()`, `response.choices[0].message.content`, system prompt in messages list
- `app/agents/arbiter.py:1-60` (branch: main, commit: 0f52a4c) — confirmed `AsyncOpenAI`, `self.client = AsyncOpenAI(api_key=settings.openai_api_key)`, `self.model = settings.openai_model`
- `app/services/questions.py:7,25,68-69` (branch: main, commit: 0f52a4c) — confirmed `AsyncOpenAI`, `client.chat.completions.create()` at line 68
- `app/services/clerk.py:6,47-48,121-122,171-172` (branch: main, commit: 0f52a4c) — confirmed two `chat.completions.create()` call sites
- `app/services/retrieval.py:8` (branch: main, commit: 0f52a4c) — confirmed `OpenAIEmbedding` import; explicitly out of scope
- `app/services/ingestion.py:10` (branch: main, commit: 0f52a4c) — confirmed `OpenAIEmbedding` import; explicitly out of scope
- `app/config.py:33-37` (branch: main, commit: 0f52a4c) — confirmed `openai_api_key`, `openai_model = "gpt-4o"`, `openai_embedding_model = "text-embedding-3-small"`
