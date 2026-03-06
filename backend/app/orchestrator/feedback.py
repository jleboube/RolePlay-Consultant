import json
import logging

from app.orchestrator.personas import Persona

logger = logging.getLogger(__name__)


class FeedbackGenerator:
    """Generates end-of-session performance feedback by analyzing the conversation."""

    def __init__(self, openai_client):
        self.client = openai_client

    def generate(self, persona: Persona, messages: list[dict]) -> dict:
        """Analyze a conversation and produce structured feedback."""
        transcript = self._format_transcript(messages)

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"Analyze this role-play conversation between a software consultant "
                            f"and a simulated {persona.title}. Provide feedback in JSON format with:\n"
                            f"- \"score\": overall score from 1 to 10\n"
                            f"- \"strengths\": array of 2-3 specific things the consultant did well\n"
                            f"- \"improvements\": array of 2-3 areas for improvement\n"
                            f"- \"highlights\": array of 1-2 notable moments (quote + commentary)\n"
                            f"- \"summary\": one paragraph overall assessment\n"
                            f"Return only valid JSON."
                        ),
                    },
                    {"role": "user", "content": transcript},
                ],
                response_format={"type": "json_object"},
                temperature=0.5,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error("Failed to generate feedback: %s", str(e))
            return {
                "score": 0,
                "strengths": [],
                "improvements": [],
                "highlights": [],
                "summary": "Feedback generation failed. Please try again.",
            }

    def _format_transcript(self, messages: list[dict]) -> str:
        lines = []
        for msg in messages:
            role = "Consultant" if msg["role"] == "user" else "Executive"
            lines.append(f"{role}: {msg['content']}")
        return "\n\n".join(lines)
