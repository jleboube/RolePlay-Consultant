import pytest
from unittest.mock import MagicMock

from app.orchestrator.orchestrator import Orchestrator
from app.orchestrator.personas import PersonaRegistry
from app.orchestrator.feedback import FeedbackGenerator


class MockCompletion:
    def __init__(self, content):
        self.choices = [MagicMock(message=MagicMock(content=content))]


class MockOpenAIClient:
    def __init__(self, response_text="Mock AI response"):
        self.response_text = response_text
        self.chat = self
        self.completions = self

    def create(self, **kwargs):
        return MockCompletion(self.response_text)


def test_persona_registry_get():
    persona = PersonaRegistry.get("cto")
    assert persona.name == "cto"
    assert persona.title == "Chief Technology Officer"


def test_persona_registry_unknown():
    with pytest.raises(ValueError, match="Unknown persona"):
        PersonaRegistry.get("nonexistent")


def test_persona_registry_list_all():
    personas = PersonaRegistry.list_all()
    assert len(personas) >= 2
    names = [p.name for p in personas]
    assert "cto" in names
    assert "sr_vp_software" in names


def test_orchestrator_process_message():
    client = MockOpenAIClient("I am the CTO. Tell me about your architecture.")
    orchestrator = Orchestrator("cto", client, session_id=1)

    response = orchestrator.process_message("Hello, I'd like to discuss our proposal.")
    assert response == "I am the CTO. Tell me about your architecture."
    assert len(orchestrator.conversation_history) == 2
    assert orchestrator.conversation_history[0]["role"] == "user"
    assert orchestrator.conversation_history[1]["role"] == "assistant"


def test_orchestrator_load_history():
    client = MockOpenAIClient("Follow-up response")
    orchestrator = Orchestrator("cto", client, session_id=1)

    orchestrator.load_history([
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello"},
    ])

    assert len(orchestrator.conversation_history) == 2
    response = orchestrator.process_message("Tell me more")
    assert response == "Follow-up response"
    assert len(orchestrator.conversation_history) == 4


def test_orchestrator_api_error():
    client = MagicMock()
    client.chat.completions.create.side_effect = Exception("API rate limit")

    orchestrator = Orchestrator("cto", client, session_id=1)

    with pytest.raises(RuntimeError, match="Failed to generate AI response"):
        orchestrator.process_message("Hello")


def test_feedback_generator():
    mock_feedback = '{"score": 7, "strengths": ["Good technical knowledge"], "improvements": ["Be more concise"], "highlights": [], "summary": "Good session."}'
    client = MockOpenAIClient(mock_feedback)
    generator = FeedbackGenerator(client)

    persona = PersonaRegistry.get("cto")
    messages = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Welcome"},
    ]

    feedback = generator.generate(persona, messages)
    assert feedback["score"] == 7
    assert len(feedback["strengths"]) > 0


def test_feedback_generator_handles_error():
    client = MagicMock()
    client.chat.completions.create.side_effect = Exception("API error")

    generator = FeedbackGenerator(client)
    persona = PersonaRegistry.get("cto")

    feedback = generator.generate(persona, [{"role": "user", "content": "Hi"}])
    assert feedback["score"] == 0
    assert "failed" in feedback["summary"].lower()
