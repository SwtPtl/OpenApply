import json
import re
import os
from fastapi import APIRouter
from pydantic import BaseModel
from llm.providers import get_provider

router = APIRouter()

class ScrapeRequest(BaseModel):
    raw_text: str
    url: str = ""

@router.post("/scrape")
async def scrape(req: ScrapeRequest):
    """Clean and structure raw job text into a structured job object."""
    llm = get_provider()
    system = (
        "You are a job description parser. Extract structured information from raw job posting text. "
        "Return ONLY valid JSON with keys: title, company, location, requirements (list of strings), description (cleaned summary). "
        "Be concise. No markdown fences."
    )
    user = f"URL: {req.url}\n\nRAW TEXT:\n{req.raw_text[:6000]}"
    
    try:
        raw = await llm.complete(system, user)
        # Strip markdown fences if present
        raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
        data = json.loads(raw)
        return data
    except Exception as e:
        # Fallback: return minimal structured data using the raw text
        return {
            "title": "",
            "company": "",
            "location": "",
            "requirements": [],
            "description": req.raw_text[:3000],
        }
