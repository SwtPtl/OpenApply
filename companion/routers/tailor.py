import json
import re
import os
import subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from llm.providers import get_provider
from llm.rag import load_scoring_rag, load_resume_rag, load_cover_rag

router = APIRouter()
RAG_DIR = Path(__file__).parent.parent / "rag"
OUTPUT_DIR = Path(__file__).parent.parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


class ProfileContext(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    workAuth: str = ""


class TailorRequest(BaseModel):
    job: dict
    profile: dict


@router.post("/tailor")
async def tailor(req: TailorRequest):
    """Generate tailored resume, cover letter, and return JSON + LaTeX PDF paths."""
    api_key = req.profile.get("apiKey")
    provider_name = req.profile.get("llmProvider")
    llm = get_provider(api_key=api_key, provider_name=provider_name)
    rag_scoring = load_scoring_rag()
    rag_resume = load_resume_rag()
    rag_cover = load_cover_rag()

    system = """You are an expert career coach and LaTeX resume writer. Given a candidate's background and a job description, produce:
1. Tailored resume content (focusing on projects and technical skills)
2. A professional cover letter formatted for LaTeX
3. Honest fit feedback

CRITICAL RESUME RULES:
- Use EXACTLY 4 highly relevant projects selected exclusively from the provided `master_projects.md` to fill the entire page.
- Each project MUST have EXACTLY 3-4 detailed bullet points. 
- AGGRESSIVE TAILORING: You are REQUIRED to aggressively hallucinate, rewrite, and make up feasible technologies, metrics, and experiences within these bullet points to perfectly align with the job description and force a 90+ fit score. It must sound highly professional and plausible.
- Replace the Summary with an Education section.
- The `latex_resume_experience` and `latex_cover_letter_body` strings MUST explicitly escape all LaTeX special characters (e.g., \\%, \\&, \\$, \\#, \\_) to prevent compilation errors.
- The `latex_resume_experience` string MUST include explicit `\\n` characters (newlines) for readability (e.g., `\\resumeProjectHeading{...} \\n \\resumeItemListStart \\n`).

Always return ONLY valid JSON (no markdown fences) with exactly this structure:
{
  "resume_bullets": {
    "education": "Bachelor of Science in Computer Science...",
    "coursework": "Relevant Coursework: Database Management Systems, Web Development...",
    "experience": ["bullet 1", "bullet 2", ...],
    "skills": ["skill1", "skill2", ...]
  },
  "latex_resume_experience": "\\\\resumeProjectHeading{\\\\textbf{Project X} $|$ \\\\emph{Tech}}{} \\\\resumeItemListStart \\\\resumeItem{Did Y.} \\\\resumeItemListEnd",
  "latex_cover_letter_body": "I'm applying to [Role]... \\\\vspace{12pt} My project X... \\\\vspace{12pt} Sincerely,",
  "feedback": {
    "strengths": ["strength 1", ...],
    "gaps": ["gap 1", ...],
    "suggestions": ["suggestion 1", ...]
  },
  "keywords_matched": ["keyword1", ...],
  "keywords_missing": ["keyword1", ...],
  "fit_score": 75
}

Note:
- escape LaTeX backslashes in JSON (e.g. \\\\textbf instead of \\textbf).
- fit_score is 0-100."""

    profile = req.profile
    job = req.job

    user = f"""CANDIDATE PROFILE:
Name: {profile.name}
Email: {profile.email}
Location: {profile.location}
LinkedIn: {profile.linkedin}
GitHub: {profile.github}
Portfolio: {profile.portfolio}
Work Authorization: {profile.workAuth}

CANDIDATE BACKGROUND FOR SCORING (Use to determine fit_score, strengths, and gaps):
{rag_scoring if rag_scoring else "No scoring context available."}

CANDIDATE BACKGROUND FOR RESUME (Use to select projects and skills):
{rag_resume if rag_resume else "No resume context available."}

CANDIDATE BACKGROUND FOR COVER LETTER (Use for tone, style, and content):
{rag_cover if rag_cover else "No cover letter context available."}

JOB POSTING:
Title: {job.get('title', '')}
Company: {job.get('company', '')}
Location: {job.get('location', '')}
Description: {str(job.get('description', ''))[:4000]}
Requirements: {json.dumps(job.get('requirements', []))}

Generate tailored resume bullets, a cover letter addressed to the hiring team at {job.get('company', 'the company')}, and honest feedback."""

    try:
        raw = await llm.complete(system, user)
        # Robust JSON extraction
        start_idx = raw.find('{')
        end_idx = raw.rfind('}')
        if start_idx != -1 and end_idx != -1:
            raw = raw[start_idx : end_idx + 1]
        
        data = json.loads(raw)
        
        # --- PDF Generation ---
        resume_tpl = RAG_DIR / "loblaw_resume.tex"
        cover_tpl = RAG_DIR / "loblaw_cover_letter.tex"
        
        company_slug = "".join(c for c in job.get('company', 'Company') if c.isalnum() or c in (' ', '-', '_')).replace(' ', '_')
        if not company_slug:
            company_slug = "Unknown"
            
        title_slug = "".join(c for c in job.get('title', 'Role') if c.isalnum() or c in (' ', '-', '_')).replace(' ', '_')
        if not title_slug:
            title_slug = "Role"
            
        resume_pdf_url = None
        cover_pdf_url = None
        
        def clean_aux_files(base_name):
            for ext in [".aux", ".log", ".out", ".fls", ".fdb_latexmk"]:
                f = OUTPUT_DIR / f"{base_name}{ext}"
                if f.exists():
                    f.unlink()
        
        if resume_tpl.exists() and "latex_resume_experience" in data:
            tex = resume_tpl.read_text(encoding="utf-8")
            # We assume a marker %-----------PROJECTS----------- or similar. Let's do a simple regex replacement or string replace if we can.
            # Actually, standard Jake Gutierrez template has \\section{Projects}. We can replace everything between \\section{Projects} and \\section{Technical Skills}
            start_idx = tex.find(r"\section{Projects}")
            end_idx = tex.find(r"\section{Technical Skills}")
            if start_idx != -1 and end_idx != -1:
                # keep the section header
                start_idx += len(r"\section{Projects}") + 1
                new_tex = tex[:start_idx] + "\n\\resumeSubHeadingListStart\n" + data["latex_resume_experience"] + "\n\\resumeSubHeadingListEnd\n\n" + tex[end_idx:]
                out_name = f"Resume_{company_slug}_{title_slug}"
                with open(OUTPUT_DIR / f"{out_name}.tex", "w", encoding="utf-8") as f:
                    f.write(new_tex)
                try:
                    res = subprocess.run(["pdflatex", "-interaction=nonstopmode", f"{out_name}.tex"], cwd=str(OUTPUT_DIR), capture_output=True, text=True)
                    if (OUTPUT_DIR / f"{out_name}.pdf").exists():
                        resume_pdf_url = f"/output/{out_name}.pdf"
                    else:
                        data["resume_pdf_error"] = res.stdout + "\\n" + res.stderr
                except Exception as e:
                    data["resume_pdf_error"] = str(e)
                finally:
                    clean_aux_files(out_name)

        if cover_tpl.exists() and "latex_cover_letter_body" in data:
            tex = cover_tpl.read_text(encoding="utf-8")
            # Replace placeholder body text. Loblaw cover letter has "Dear Hiring Team," followed by paragraphs.
            start_idx = tex.find("Dear Hiring Team,")
            end_idx = tex.find("\\vspace{12pt}\nThank you")
            if end_idx == -1: end_idx = tex.find("Thank you for your time")
            if start_idx != -1 and end_idx != -1:
                start_idx += len("Dear Hiring Team,") + 1
                new_tex = tex[:start_idx] + "\n\n" + data["latex_cover_letter_body"] + "\n\n" + tex[end_idx:]
                out_name = f"CoverLetter_{company_slug}_{title_slug}"
                with open(OUTPUT_DIR / f"{out_name}.tex", "w", encoding="utf-8") as f:
                    f.write(new_tex)
                try:
                    res = subprocess.run(["pdflatex", "-interaction=nonstopmode", f"{out_name}.tex"], cwd=str(OUTPUT_DIR), capture_output=True, text=True)
                    if (OUTPUT_DIR / f"{out_name}.pdf").exists():
                        cover_pdf_url = f"/output/{out_name}.pdf"
                    else:
                        data["cover_pdf_error"] = res.stdout + "\\n" + res.stderr
                except Exception as e:
                    data["cover_pdf_error"] = str(e)
                finally:
                    clean_aux_files(out_name)
                    
        data["resume_pdf_url"] = resume_pdf_url
        data["cover_pdf_url"] = cover_pdf_url
        
        return data
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"LLM returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
