import json
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from llm.providers import get_provider
from llm.rag import load_rag_context

router = APIRouter()
PROFILE_FILE = Path(__file__).parent.parent / "data" / "profile.json"


def _load() -> dict:
    if PROFILE_FILE.exists():
        return json.loads(PROFILE_FILE.read_text())
    return {}


def _save(profile: dict):
    PROFILE_FILE.parent.mkdir(exist_ok=True)
    PROFILE_FILE.write_text(json.dumps(profile, indent=2))


class ProfileData(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    workAuthorization: Optional[str] = None
    requireSponsorship: Optional[bool] = None
    llmProvider: Optional[str] = None


@router.get("/profile")
def get_profile():
    return _load()


@router.put("/profile")
def save_profile(data: ProfileData):
    current = _load()
    current.update({k: v for k, v in data.model_dump().items() if v is not None})
    _save(current)
    return {"ok": True}


@router.post("/parse_profile")
def parse_profile():
    llm = get_provider()
    rag_context = load_rag_context()
    if not rag_context.strip():
        return {"error": "No RAG context found. Drop your resume in the companion/rag/ folder."}

    prompt = f"""
Extract the user's personal profile information from the following context strictly into JSON format.
If a field is not found, leave it as an empty string. Never invent information.

JSON Schema:
{{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "portfolio": "string"
}}

Context:
{rag_context}
"""
    try:
        content = llm.generate(prompt)
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != 0:
            parsed = json.loads(content[start:end])
            return parsed
        return {"error": "Failed to parse JSON from LLM"}
    except Exception as e:
        return {"error": str(e)}
