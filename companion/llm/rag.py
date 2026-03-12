"""RAG loader — reads all markdown files from the rag/ directory."""
import os
from pathlib import Path

RAG_DIR = Path(__file__).parent.parent / "rag"


def _read_file(filename: str) -> str:
    path = RAG_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8", errors="ignore").strip()
    return ""

def load_scoring_rag() -> str:
    return _read_file("scoring_rag_gemini.md")

def load_resume_rag() -> str:
    # Use transformed tailoring RAG, skills, and master projects for the resume
    parts = []
    for f in ["tailoring_rag_transformed.md", "master_projects.md", "skills.md"]:
        content = _read_file(f)
        if content:
            parts.append(f"=== {f} ===\n{content}")
    return "\n\n".join(parts)

def load_cover_rag() -> str:
    return _read_file("rag_cover_letter.md")
