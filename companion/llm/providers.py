from abc import ABC, abstractmethod
import os
import httpx
from dotenv import load_dotenv

load_dotenv()


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system: str, user: str) -> str: ...


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str = None):
        from google import genai
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key: raise ValueError("Gemini API Key is missing")
        self.client = genai.Client(api_key=self.api_key)
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    async def complete(self, system: str, user: str) -> str:
        from google.genai import types
        response = self.client.models.generate_content(
            model=self.model,
            config=types.GenerateContentConfig(system_instruction=system),
            contents=user,
        )
        return response.text


class DeepSeekProvider(LLMProvider):
    """Uses the OpenAI-compatible DeepSeek API."""
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        if not self.api_key: raise ValueError("DeepSeek API Key is missing")
        self.model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        self.base_url = "https://api.deepseek.com/v1"

    async def complete(self, system: str, user: str) -> str:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
                timeout=60,
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]


class ClaudeProvider(LLMProvider):
    def __init__(self, api_key: str = None):
        import anthropic
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key: raise ValueError("Anthropic API Key is missing")
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        self.model = os.getenv("CLAUDE_MODEL", "claude-3-5-haiku-latest")

    async def complete(self, system: str, user: str) -> str:
        msg = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return msg.content[0].text


class LocalLLMProvider(LLMProvider):
    """Placeholder for Ollama or any OpenAI-compatible local server."""
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "llama3")

    async def complete(self, system: str, user: str) -> str:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "stream": False,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
                timeout=120,
            )
            r.raise_for_status()
            return r.json()["message"]["content"]


def get_provider(api_key: str = None, provider_name: str = None) -> LLMProvider:
    p = (provider_name or os.getenv("LLM_PROVIDER", "gemini")).lower()
    if p == "gemini":
        return GeminiProvider(api_key=api_key)
    if p == "deepseek":
        return DeepSeekProvider(api_key=api_key)
    if p == "claude":
        return ClaudeProvider(api_key=api_key)
    if p == "local":
        return LocalLLMProvider()
    raise ValueError(f"Unknown LLM_PROVIDER: {p}")
