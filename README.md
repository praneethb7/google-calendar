# Google Calendar

A high-fidelity Google Calendar clone that doubles as a reinforcement-learning
environment. An agent drives a realistic calendar through HTTP actions while the
Next.js UI renders the same state in real time.

**No authentication** — the backend operates as a single seeded default user.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Zustand, React DnD |
| Backend | FastAPI, SQLAlchemy, SQLite |
| RL Env | Gymnasium (Python), HTTP observation/action space |
| Infra | Docker + docker-compose |

---

## Quick Start

Pick **one** of the two paths below. All commands are run from the **repository root**.

### Option A — Docker (one command)

```bash
docker compose up --build
```

- UI → http://localhost:3000
- API docs → http://localhost:8000/docs

Stop with `Ctrl-C`, or `docker compose down` to remove containers.

### Option B — Run locally

**Prerequisites:** Python 3.11+ and Node.js 18+.

**1. Backend** (terminal 1, from root):

```bash
python3 -m venv backend-py/.venv
backend-py/.venv/bin/pip install -r backend-py/requirements.txt
(cd backend-py && .venv/bin/uvicorn app.main:app --reload --port 8000)
```

**2. Frontend** (terminal 2, from root):

```bash
npm --prefix frontend-next install
npm --prefix frontend-next run dev
```

Then open:

- **UI** → http://localhost:3000
- **API docs (Swagger)** → http://localhost:8000/docs
- **Health check** → http://localhost:8000/health

The SQLite database, default user, and primary calendar are created
automatically on first backend start — no migration step.

---

## Features

### Calendar UI
- **Views** — Day, Week, Month, Year, Schedule (+ 4-day)
- **Event creation popover** with tabs: Event, Task, Out of Office, Focus Time, Working Location, Appointment Schedule
- **Google-style time picker** — date pill, start/end dropdowns at 15-min increments, duration labels
- **Recurrence** — Daily, Weekly, Monthly, Annually, Every weekday
- **Drag & drop** to move events; **resize** the bottom edge to change duration
- **Right-click context menu** — delete, change color (11 Google colors)
- **Search** — by title, description, or location
- **Holidays** — toggle holiday calendars for US/UK/India/Canada/Australia
- **Reminders / notifications** — upcoming-event reminder panel
- **Dark mode**, **mini calendar**, **keyboard shortcuts**

### Backend API
- `GET /api/events` — list events (date-range + calendar filters)
- `POST /api/events` — create event
- `PUT /api/events/{id}` — update event
- `DELETE /api/events/{id}` — delete event (`?delete_all=true` for a series)
- `GET /api/events/search?q=` — search events
- `GET/POST /api/calendars`, `GET/PUT/DELETE /api/calendars/{id}` — calendars
- `GET /api/profile` — user profile
- `GET/PUT /api/preferences` — user preferences
- `GET /api/holidays/countries` — supported countries
- `GET/POST /api/holidays/preferences` — holiday-calendar prefs
- `GET /api/holidays/occurrences?year=` — computed holiday dates
- `GET /api/notifications/pending` — upcoming event reminders
- `GET /health` — health check
- Full Swagger docs at `/docs`

### Client-side only (no backend)
A few convenience features persist in the browser via `localStorage` rather than
the API: **Tasks**, **Appointment booking pages**, and the **Trash / undo** bin.
**Insights** are computed in-browser from the event list. These are intentionally
not part of the RL environment's observation/action space.

---

## RL Environment

A Gymnasium env (`backend-py/gym_env.py`) wraps three HTTP endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /env/state` | Current observation — all events, calendars, and user info |
| `POST /env/reset` | Wipe events for the user; optionally seed new ones |
| `POST /env/step` | Execute one action; return new state |

- **Actions** — `create_event`, `update_event`, `delete_event`, `move_event`
- **Observation** — JSON-serialized environment state
- **Reward** — `+1` on a successful action, `-1` on failure (e.g. unknown action or missing event)

### Python (Gymnasium)

```python
from gym_env import GoogleCalendarEnv

env = GoogleCalendarEnv(base_url="http://localhost:8000")
obs, info = env.reset()

obs, reward, terminated, truncated, info = env.step({
    "action": "create_event",
    "payload": '{"title": "Meeting", "start_time": "2026-04-01T10:00:00", "end_time": "2026-04-01T11:00:00"}'
})
```

### Direct API

```bash
# Reset (optionally seed events)
curl -X POST http://localhost:8000/env/reset \
  -H "Content-Type: application/json" -d '{"seed_events": []}'

# Take an action
curl -X POST http://localhost:8000/env/step \
  -H "Content-Type: application/json" \
  -d '{"action":"create_event","payload":{"title":"Standup","start_time":"2026-04-01T09:00:00","end_time":"2026-04-01T09:30:00"}}'

# Observe current state
curl http://localhost:8000/env/state
```

### Test script

With the backend running, from root:

```bash
backend-py/.venv/bin/python backend-py/test_rl_env.py
```

---

## Project Structure

```
google-calendar/
├── backend-py/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router registration
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── models.py          # User, Calendar, Event, Reminder, prefs, holidays
│   │   ├── schemas.py         # Pydantic request/response + RL schemas
│   │   ├── seed.py            # Default user + calendar seeding
│   │   ├── holidays_data.py   # Computed public-holiday rulesets (no external service)
│   │   └── routers/
│   │       ├── events.py        # Event CRUD + search
│   │       ├── calendars.py     # Calendar CRUD
│   │       ├── profile.py       # Profile + preferences
│   │       ├── holidays.py      # Countries / preferences / occurrences
│   │       ├── notifications.py # Pending event reminders
│   │       └── env.py           # RL environment (state / reset / step)
│   ├── gym_env.py             # Gymnasium environment wrapper
│   ├── test_rl_env.py         # RL environment test script
│   ├── requirements.txt
│   └── Dockerfile
├── frontend-next/
│   ├── app/                   # Next.js routes (/ → /calendar)
│   ├── components/            # Calendar shell, views, popovers, modals
│   ├── api/                   # Axios client (camelCase ⇄ snake_case)
│   ├── store/                 # Zustand stores
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Keyboard Shortcuts

| Key | Action | Key | Action |
|-----|--------|-----|--------|
| `c` | Create event | `t` | Today |
| `d` | Day view | `j` / `n` | Next period |
| `w` | Week view | `k` / `p` | Previous period |
| `m` | Month view | `/` | Focus search |
| `a` | Schedule view | `Esc` | Close dialogs |

---

## Database

SQLite (`backend-py/calendar.db`, auto-created). Tables:

- `users` — single default user (id=1, "RL Agent")
- `calendars` — calendars with colors
- `events` — events with recurrence, reminders, colors
- `reminders` — per-event reminder settings
- `user_preferences` — time format, working hours, defaults
- `holiday_preferences` — enabled holiday calendars per country

Schema is created via SQLAlchemy on startup and seeded with one user and one
primary calendar.

---

## Configuration

| Variable | Where | Default | Purpose |
|----------|-------|---------|---------|
| `SQLITE_URL` | backend | `sqlite:///./calendar.db` | Database location |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:8000` | Backend base URL |

Under Docker these are set in `docker-compose.yml`; for local runs the defaults
work out of the box.
```
