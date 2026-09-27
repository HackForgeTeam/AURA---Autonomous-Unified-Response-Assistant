from app.ai.base import LLMProvider
from app.ai.mock_provider import MockLLMProvider
from app.ai.cloud_provider import CloudLLMProvider
from app.core.config import settings

def get_ai_provider(provider_type: str = None) -> LLMProvider:
    """Returns configured LLM provider instance."""
    selected = provider_type or settings.AI_PROVIDER
    if selected.lower() in ["openai", "anthropic", "gemini"]:
        return CloudLLMProvider(provider_name=selected)
    return MockLLMProvider()
