from abc import ABC, abstractmethod
import os
import httpx
from dotenv import load_dotenv

load_dotenv()


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system: str, user: str) -> str: ...


class GeminiProvider(LLMProvider):
    def __init__(self):
        from google import genai
        self.client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
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
    def __init__(self):
        self.api_key = os.environ["DEEPSEEK_API_KEY"]
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
    def __init__(self):
        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
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


def get_provider() -> LLMProvider:
    p = os.getenv("LLM_PROVIDER", "gemini").lower()
    if p == "gemini":
        return GeminiProvider()
    if p == "deepseek":
        return DeepSeekProvider()
    if p == "claude":
        return ClaudeProvider()
    if p == "local":
        return LocalLLMProvider()
    raise ValueError(f"Unknown LLM_PROVIDER: {p}")
