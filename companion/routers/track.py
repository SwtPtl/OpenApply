import json
import uuid
from datetime import date
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
DATA_FILE = Path(__file__).parent.parent / "data" / "applications.json"


def _load() -> list:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text())
    return []


def _save(apps: list):
    DATA_FILE.parent.mkdir(exist_ok=True)
    DATA_FILE.write_text(json.dumps(apps, indent=2))


class TrackRequest(BaseModel):
    company: str
    title: str
    url: str
    status: str = "Applied"
    fit_score: Optional[float] = None


@router.post("/track")
def track(req: TrackRequest):
    apps = _load()
    app = {
        "id": str(uuid.uuid4()),
        "company": req.company,
        "title": req.title,
        "url": req.url,
        "date": date.today().isoformat(),
        "status": req.status,
        "fitScore": req.fit_score,
    }
    apps.insert(0, app)
    _save(apps)
    return {"ok": True, "id": app["id"]}


@router.get("/track")
def get_applications():
    return _load()


@router.patch("/track/{app_id}")
def update_status(app_id: str, status: str):
    apps = _load()
    for a in apps:
        if a["id"] == app_id:
            a["status"] = status
            break
    _save(apps)
    return {"ok": True}
