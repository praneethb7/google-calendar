# Google Calendar

A high-fidelity Google Calendar web app. Agents interact with a realistic calendar through API actions while the UI renders the environment state in real time.

**No authentication** — single default user.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Zustand, React DnD |
| Backend | FastAPI, SQLAlchemy, SQLite |
| RL Env | Gymnasium (Python), HTTP-based observation/action space |

## Features

### Calendar UI
- **Four views** — Day, Week, Month, Schedule
- **Event creation popover** with 6 tabs: Event, Task, Out of Office, Focus Time, Working Location, Appointment Schedule
- **Google-style time picker** — date pill, start/end time dropdowns with 15-min increments, duration labels
- **Recurrence** — Does not repeat, Daily, Weekly, Monthly, Annually, Every weekday
- **Drag & drop** — move events between time slots, auto-adjusts time and duration
- **Resize** — drag bottom edge to change event duration
- **Right-click context menu** — delete event, change color label (11 Google Calendar colors)
- **Placeholder blob** — preview event on grid before saving, updates live as you type
- **Single-click edit** — click any event to open popover with full edit controls
- **Dark mode** — full dark theme support via Appearance settings
- **Mini calendar** — sidebar date picker with month navigation
- **Search** — find events by title, description, or location


- **Gymnasium env** (`backend-py/gym_env.py`) — `GoogleCalendarEnv` with `reset()` and `step()`
- **Action space** — `create_event`, `update_event`, `delete_event`, `move_event`
- **Observation space** — JSON state containing all events, calendars, and user info
- **Reward** — +1 for successful actions, -1 for failures
- **API endpoints** — `/env/state`, `/env/reset`, `/env/step`

### Backend API
- `GET /api/events` — list events (with date range and calendar filters)
- `POST /api/events` — create event
- `PUT /api/events/:id` — update event
- `DELETE /api/events/:id` — delete event
- `GET /api/events/search?q=` — search events
- `GET /api/calendars` — list calendars
- `POST /api/calendars` — create calendar
- `GET /api/profile` — user profile
- `GET /api/preferences` — user preferences
- `GET /health` — health check
- Full Swagger docs at `/docs`

## Project Structure

```
google-calendar-replica/
├── backend-py/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # User, Calendar, Event, Reminder, UserPreferences
│   │   ├── schemas.py       # Pydantic models (request/response + RL schemas)
│   │   ├── seed.py          # Default user + calendar seeding
│   │   └── routers/
│   │       ├── events.py    # CRUD endpoints for events
│   │       ├── calendars.py # CRUD endpoints for calendars
│   │       ├── profile.py   # Profile and preferences
│   │       └── env.py       # RL environment endpoints (state/reset/step)
│   ├── gym_env.py           # Gymnasium environment wrapper
│   ├── test_rl_env.py       # RL environment test script
│   ├── requirements.txt
│   └── Dockerfile
├── frontend-next/
│   ├── app/                 # Next.js pages (/ redirects to /calendar)
│   ├── components/
│   │   ├── CalendarApp.jsx  # Main app shell
│   │   ├── CalendarHeader.jsx
│   │   ├── CalendarSidebar.jsx
│   │   ├── CalendarView.jsx
│   │   ├── EventPopover.jsx # Full popover with 6 tabs + time pickers
│   │   ├── EventModal.jsx   # Detailed event editor
│   │   ├── EventContextMenu.jsx # Right-click menu (delete + color labels)
│   │   ├── DraggableEvent.jsx
│   │   └── views/
│   │       ├── MonthView.jsx
│   │       ├── WeekView.jsx
│   │       ├── DayView.jsx
│   │       └── ScheduleView.jsx
│   ├── api/                 # Axios API client with snake_case conversion
│   ├── store/               # Zustand stores
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend-py
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The SQLite database and default user are created automatically on first start.

### Frontend

```bash
cd frontend-next
npm install
npm run dev
```

### Open

- **UI** — http://localhost:3000
- **API docs** — http://localhost:8000/docs

### Docker

```bash
docker-compose up --build
```

## RL Environment Usage

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
# Reset environment
curl -X POST http://localhost:8000/env/reset -H "Content-Type: application/json" -d '{"seed_events": []}'

# Take an action
curl -X POST http://localhost:8000/env/step -H "Content-Type: application/json" -d '{
  "action": "create_event",
  "payload": {"title": "Standup", "start_time": "2026-04-01T09:00:00", "end_time": "2026-04-01T09:30:00"}
}'

# Get current state
curl http://localhost:8000/env/state
```

### Test Script

```bash
cd backend-py
source .venv/bin/activate
python test_rl_env.py
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `c` | Create new event |
| `d` | Day view |
| `w` | Week view |
| `m` | Month view |
| `a` | Schedule view |
| `t` | Today |
| `j` / `n` | Next period |
| `k` / `p` | Previous period |
| `/` | Focus search |
| `Esc` | Close dialogs |

## Database

SQLite with these tables:
- `users` — single default user (id=1, "RL Agent")
- `calendars` — user calendars with colors
- `events` — calendar events with recurrence, reminders, colors
- `reminders` — per-event reminder settings
- `user_preferences` — time format, working hours, defaults

Schema is auto-created via SQLAlchemy on startup. Seeded with one user and one primary calendar.
