"""Exercise actual SDK HTTP calls against a local synthetic Messages API.

Requires a running Postman simulation; see docs/anthropic-compatibility.md.
Database and retrieval boundaries use synthetic data. No provider keys are used.
"""

import ast
import inspect
import os
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import anthropic
import httpx
import pytest

os.environ.setdefault("ANTHROPIC_API_KEY", "synthetic-test-key")
os.environ.setdefault("OPENAI_API_KEY", "synthetic-test-key")

from app.agents.arbiter import ArbiterEngine
from app.agents.defense_cross import DefenseCrossAgent
from app.schemas.questions import QuestionGenerateRequest
from app.services.clerk import ClerkService
from app.services.questions import QuestionGenerator


def test_message_keywords_match_installed_sdk():
    """Catch signature drift in CI even when the HTTP simulation is not running."""
    signature = inspect.signature(anthropic.resources.messages.AsyncMessages.create)
    calls = []
    root = Path(__file__).resolve().parents[1] / "app"
    for path in root.rglob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            if (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == "create"
                and isinstance(node.func.value, ast.Attribute)
                and node.func.value.attr == "messages"
            ):
                keywords = {keyword.arg: None for keyword in node.keywords}
                try:
                    signature.bind(None, **keywords)
                except TypeError as error:
                    pytest.fail(f"{path.name}:{node.lineno}: {error}")
                calls.append(node)
    assert calls, "No Messages API call sites were checked"


@pytest.fixture
def simulation(monkeypatch):
    url = os.environ.get("ANTHROPIC_SIMULATION_URL")
    if not url:
        pytest.skip("Set ANTHROPIC_SIMULATION_URL to run the real SDK HTTP regression")
    monkeypatch.setenv("ANTHROPIC_BASE_URL", url + "/")
    return url


def retrieval():
    return SimpleNamespace(
        search=AsyncMock(return_value=[]),
        search_with_citations=AsyncMock(return_value=("Synthetic portal evidence", [])),
    )


@pytest.mark.asyncio
async def test_all_message_call_sites_preserve_sampling_over_http(simulation):
    db = MagicMock()
    evidence = retrieval()
    arbiter = ArbiterEngine(db, evidence)
    agent = DefenseCrossAgent(db, evidence)
    questions = QuestionGenerator(db)
    questions.retrieval = evidence
    questions._get_session = AsyncMock(
        return_value=SimpleNamespace(witness_name="Synthetic witness", agent_mode="defense_cross")
    )
    questions._get_conversation_context = AsyncMock(return_value=[])
    questions._get_facts = AsyncMock(return_value=[])
    clerk = ClerkService(db)
    clerk.retrieval = evidence
    db.execute = AsyncMock()
    fact = SimpleNamespace(
        id=uuid4(), confidence="certain", fact_text="Rick opened a portal.", citations=[]
    )
    db.execute.return_value.scalars = MagicMock()
    db.execute.return_value.scalars.return_value.all.return_value = [fact]

    async with httpx.AsyncClient() as http:
        before = len((await http.get(simulation + "/requests")).json())
    try:
        facts, inappropriate = await arbiter._extract_facts("Rick opened a portal.", [])
        assert facts[0]["fact"] == "Rick opened a portal."
        assert inappropriate is False
        assert await arbiter._check_contradictions(facts, facts) == []
        reply = await agent.generate_response(
            uuid4(), [{"role": "witness", "content": "Rick opened a portal."}], [], []
        )
        assert reply.message == "What did you observe next?"
        generated = await questions.generate_questions(uuid4(), QuestionGenerateRequest(count=1))
        assert generated[0].question == "Where was the portal?"
        answer = await clerk.ask("Who opened the portal?")
        assert answer.answer == "What did you observe next?"
        assert answer.facts_referenced == 1
        async with httpx.AsyncClient() as http:
            calls = (await http.get(simulation + "/requests")).json()[before:]
        assert [call.get("temperature") for call in calls] == [0, 0, 0.7, 0.7, None, 0.3]
    finally:
        for service in [arbiter, agent, questions, clerk]:
            await service.client.close()


@pytest.mark.asyncio
async def test_empty_agent_content_returns_fallback(simulation):
    agent = DefenseCrossAgent(MagicMock(), retrieval())
    try:
        reply = await agent.generate_response(
            uuid4(), [{"role": "witness", "content": "EMPTY_RESPONSE"}], [], []
        )
        assert "could you rephrase" in reply.message
    finally:
        await agent.client.close()
