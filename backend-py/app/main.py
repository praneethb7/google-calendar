from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, SessionLocal, Base
from app import models  # noqa: F401 – registers all models with Base
from app.seed import seed_default_user
from app.routers import calendars, events, env, profile

# ── Create tables ─────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Seed default user on startup ──────────────────────────────────────────────
with SessionLocal() as db:
    seed_default_user(db)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Google Calendar RL Environment",
    version="1.0.0",
    description="FastAPI + SQLite backend for a Google Calendar RL environment. No auth — single default user.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calendars.router)
app.include_router(events.router)
app.include_router(env.router)
app.include_router(profile.router)


@app.get("/health")
def health():
    return {"status": "ok"}
