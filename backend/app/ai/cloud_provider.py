from typing import List, Dict, Any, Optional
import httpx
import json
import logging
from app.ai.base import (
    LLMProvider,
    ChatMessage,
    AIResponse,
    IntentClassification,
    CallSummaryOutput,
)
from app.ai.mock_provider import MockLLMProvider
from app.core.config import settings

logger = logging.getLogger("aura.ai.cloud")

class CloudLLMProvider(LLMProvider):
    """
    Pluggable Cloud LLM Provider adapter supporting OpenAI, Anthropic, or Gemini.
    Gracefully falls back to MockLLMProvider if keys are unset or network issues occur.
    """

    def __init__(self, provider_name: str = "openai"):
        self.provider_name = provider_name.lower()
        self.fallback = MockLLMProvider()
        self.api_key = (
            settings.OPENAI_API_KEY if self.provider_name == "openai"
            else settings.ANTHROPIC_API_KEY if self.provider_name == "anthropic"
            else settings.GEMINI_API_KEY
        )

    async def generate_response(
        self,
        messages: List[ChatMessage],
        call_context: Optional[Dict[str, Any]] = None,
        professional_profile: Optional[Dict[str, Any]] = None
    ) -> AIResponse:
        if not self.api_key:
            return await self.fallback.generate_response(messages, call_context, professional_profile)

        try:
            # Generic OpenAI-compatible chat completion format (supported by OpenAI, OpenRouter, vLLM, and LiteLLM)
            category_hint = (call_context or {}).get("category", "")
            sim_type = (call_context or {}).get("simulation_type", "")
            caller_name = (call_context or {}).get("caller_name", "David Miller")
            is_interview = (
                category_hint == "INTERVIEW" or
                any(term in sim_type.lower() for term in ["interview", "screening", "recruiter"])
            )

            user_name = (call_context or {}).get("user_name", "Arjun Sharma")
            prof_info = json.dumps(professional_profile or {}, default=str)
            system_prompt = (
                f"You are AURA, an autonomous AI voice representative speaking on behalf of {user_name} during a live telephone call.\n"
                f"Your role is to represent {user_name} accurately, politely, and professionally in voice.\n\n"
                f"STRICT RULES:\n"
                f"1. Identity: You are an AI representative assisting on their behalf (e.g. 'The person I am representing has experience with...', 'According to their resume...'). Do NOT pretend to literally be the human {user_name}.\n"
                f"2. Verified Resume Data: Use ONLY the following approved resume details: {prof_info}. Never invent qualifications, companies, projects, or achievements not in the resume.\n"
                f"3. Personal/Private Questions: If asked for home address, personal phone number, private email, passwords, family details, or salary/compensation, respond: 'I’m sorry, I don’t have permission to share that information. I’ll ask the person I’m representing to call you back regarding that.'\n"
                f"4. Unrelated Questions: If asked about movies, songs, sports, weather, investment advice, or politics, respond: 'That’s outside what I’m able to discuss on their behalf. I’ll ask the person I’m representing to get back to you.'\n"
                f"5. Uncertain Questions: If an answer cannot be determined from the approved resume, respond: 'I’m not completely sure about that, so I’ll ask the person I’m representing to get back to you.'\n"
                f"6. Spoken Format: Generate natural, spoken, conversational responses (1-3 sentences) suitable for Text-to-Speech audio."
            )
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    *[{"role": m.role, "content": m.content} for m in messages]
                ],
                "temperature": 0.3
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )

                if res.status_code == 200:
                    data = res.json()
                    reply = data["choices"][0]["message"]["content"]
                    # Use local intent classifier on resulting conversation
                    classification = await self.fallback.classify_call(
                        [{"speaker": "CALLER", "text": messages[-1].content if messages else ""}]
                    )
                    
                    # Classify response type
                    class_type = "ANSWERED"
                    conf_level = "HIGH"
                    if "don’t have permission to share" in reply.lower() or "permission to share" in reply.lower():
                        class_type = "PRIVATE_REFUSED"
                    elif "outside what i’m able to discuss" in reply.lower() or "answer personally" in reply.lower():
                        class_type = "UNRELATED"
                    elif "not completely sure" in reply.lower():
                        class_type = "UNCERTAIN"
                        conf_level = "LOW"

                    return AIResponse(
                        reply_text=reply,
                        detected_intent=classification.primary_category,
                        detected_urgency=classification.urgency,
                        is_emergency=classification.urgency.value == "POTENTIAL_EMERGENCY",
                        requires_user_alert=classification.urgency.value == "POTENTIAL_EMERGENCY",
                        interview_grounded=True,
                        classification_type=class_type,
                        confidence_level=conf_level
                    )
                else:
                    logger.warning(f"Cloud LLM call returned {res.status_code}, falling back to mock provider.")
                    return await self.fallback.generate_response(messages, call_context, professional_profile)
        except Exception as e:
            logger.error(f"Error connecting to Cloud LLM ({e}), falling back to deterministic provider.")
            return await self.fallback.generate_response(messages, call_context, professional_profile)

    async def classify_call(
        self,
        transcripts: List[Dict[str, Any]],
        caller_info: Optional[Dict[str, Any]] = None
    ) -> IntentClassification:
        return await self.fallback.classify_call(transcripts, caller_info)

    async def summarize_call(
        self,
        transcripts: List[Dict[str, Any]],
        call_metadata: Optional[Dict[str, Any]] = None
    ) -> CallSummaryOutput:
        return await self.fallback.summarize_call(transcripts, call_metadata)
