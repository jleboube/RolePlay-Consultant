import logging

from app.orchestrator.personas import PersonaRegistry, Persona

logger = logging.getLogger(__name__)


def _load_augmentation(persona_name: str) -> str:
    """Load cached OneDrive content for persona augmentation."""
    try:
        from app.models.onedrive import OneDriveFolder

        folders = OneDriveFolder.query.filter(
            (OneDriveFolder.persona == persona_name) | (OneDriveFolder.persona.is_(None)),
            OneDriveFolder.sync_status == "synced",
            OneDriveFolder.cached_content.isnot(None),
        ).all()

        if not folders:
            return ""

        parts = []
        for folder in folders:
            if folder.cached_content:
                parts.append(folder.cached_content)

        if parts:
            return "\n\nAdditional context from organizational documents:\n" + "\n\n".join(parts)
    except Exception as e:
        logger.warning("Failed to load augmentation data: %s", str(e))

    return ""


class Orchestrator:
    """Central orchestrator that manages a conversation with a persona agent.

    Each instance represents one active conversation session. The orchestrator
    routes user messages to the appropriate persona via the OpenAI API.
    No direct agent-to-agent communication occurs.
    """

    def __init__(self, persona_name: str, openai_client, session_id: int):
        self.persona: Persona = PersonaRegistry.get(persona_name)
        self.client = openai_client
        self.session_id = session_id
        self.conversation_history: list[dict] = []

        augmentation = _load_augmentation(persona_name)
        self.system_prompt = self.persona.system_prompt + augmentation

    def process_message(self, user_message: str) -> str:
        """Send user message through the persona agent and return response."""
        self.conversation_history.append({"role": "user", "content": user_message})

        messages = [
            {"role": "system", "content": self.system_prompt},
            *self.conversation_history,
        ]

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.8,
                max_tokens=1024,
            )
            assistant_message = response.choices[0].message.content
        except Exception as e:
            logger.error(
                "OpenAI API error for session %d: %s", self.session_id, str(e)
            )
            raise RuntimeError(f"Failed to generate AI response: {str(e)}") from e

        self.conversation_history.append(
            {"role": "assistant", "content": assistant_message}
        )
        return assistant_message

    def load_history(self, messages: list[dict]):
        """Load existing conversation history for session resumption."""
        self.conversation_history = [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
