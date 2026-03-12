from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from routers import scrape, tailor, track, profile

app = FastAPI(title="OpenApply Companion", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Extension uses chrome-extension:// origin
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scrape.router)
app.include_router(tailor.router)
app.include_router(track.router)
app.include_router(profile.router)

out_dir = Path(__file__).parent / "output"
out_dir.mkdir(exist_ok=True)
app.mount("/output", StaticFiles(directory=str(out_dir)), name="output")

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=7523, reload=True)
