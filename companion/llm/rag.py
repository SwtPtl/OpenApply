"""RAG loader — reads all markdown files from the rag/ directory."""
import os
from pathlib import Path

RAG_DIR = Path(__file__).parent.parent / "rag"


def load_rag_context() -> str:
    """Return concatenated content of all markdown files in rag/."""
    parts = []
    if not RAG_DIR.exists():
        return ""

    for md_file in sorted(RAG_DIR.rglob("*.md")):
        relative = md_file.relative_to(RAG_DIR)
        content = md_file.read_text(encoding="utf-8", errors="ignore").strip()
        if content:
            parts.append(f"=== {relative} ===\n{content}")

    return "\n\n".join(parts)
