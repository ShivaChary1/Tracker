from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from bson.errors import InvalidId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta, date

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# GridFS bucket for binary blobs (voice-note audio). Reuses the same DB so no
# extra service/credentials are needed; metadata lives in `voice_notes`.
# Constructed lazily on first use: building it at import time would bind the
# shared Motor client to the wrong event loop and break every endpoint.
_voice_bucket = None


def get_voice_bucket() -> AsyncIOMotorGridFSBucket:
    global _voice_bucket
    if _voice_bucket is None:
        _voice_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="voice_audio")
    return _voice_bucket

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

app = FastAPI(title="Compass Dashboard API")
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ----------------------- Models -----------------------
class GoalIn(BaseModel):
    title: str
    description: Optional[str] = ""
    week_start: str  # YYYY-MM-DD (Monday)
    target_value: int = 1
    current_value: int = 0
    category: Optional[str] = "general"
    status: Literal["active", "completed", "abandoned"] = "active"


class Goal(GoalIn):
    id: str
    created_at: str


class TaskIn(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: Optional[str] = None  # YYYY-MM-DD
    completed: bool = False
    goal_id: Optional[str] = None


class Task(TaskIn):
    id: str
    created_at: str
    completed_at: Optional[str] = None


class HabitIn(BaseModel):
    title: str
    color: str = "mint"  # mint | peach | lavender | blue
    target_per_week: int = 7
    icon: Optional[str] = "Sparkle"


class Habit(HabitIn):
    id: str
    created_at: str


class HabitLogIn(BaseModel):
    habit_id: str
    log_date: str  # YYYY-MM-DD


class NoteIn(BaseModel):
    title: str
    content: str = ""
    tags: List[str] = []
    color: str = "white"
    pinned: bool = False
    folder: str = ""


class Note(NoteIn):
    id: str
    created_at: str
    updated_at: str


class VoiceNote(BaseModel):
    id: str
    note_id: str
    file_id: str  # GridFS file _id as a string
    filename: str
    mime_type: str
    duration_seconds: float = 0.0
    size_bytes: int = 0
    created_at: str


class PomodoroIn(BaseModel):
    duration_minutes: int
    task_id: Optional[str] = None
    label: Optional[str] = ""


class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None


class BreakdownIn(BaseModel):
    goal_title: str
    description: Optional[str] = ""


# ----------------------- Goals -----------------------
@api_router.get("/goals", response_model=List[Goal])
async def list_goals(week_start: Optional[str] = None):
    q = {}
    if week_start:
        q["week_start"] = week_start
    docs = await db.goals.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.post("/goals", response_model=Goal)
async def create_goal(body: GoalIn):
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    await db.goals.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.patch("/goals/{goal_id}", response_model=Goal)
async def update_goal(goal_id: str, body: dict):
    body.pop("id", None)
    res = await db.goals.find_one_and_update(
        {"id": goal_id}, {"$set": body}, return_document=True, projection={"_id": 0}
    )
    if not res:
        raise HTTPException(404, "Goal not found")
    return res


@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    await db.goals.delete_one({"id": goal_id})
    return {"ok": True}


# ----------------------- Tasks -----------------------
@api_router.get("/tasks", response_model=List[Task])
async def list_tasks(completed: Optional[bool] = None, goal_id: Optional[str] = None):
    q = {}
    if completed is not None:
        q["completed"] = completed
    if goal_id:
        q["goal_id"] = goal_id
    docs = await db.tasks.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.post("/tasks", response_model=Task)
async def create_task(body: TaskIn):
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    doc["completed_at"] = None
    await db.tasks.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, body: dict):
    body.pop("id", None)
    if "completed" in body:
        body["completed_at"] = now_iso() if body["completed"] else None
    res = await db.tasks.find_one_and_update(
        {"id": task_id}, {"$set": body}, return_document=True, projection={"_id": 0}
    )
    if not res:
        raise HTTPException(404, "Task not found")
    return res


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    await db.tasks.delete_one({"id": task_id})
    return {"ok": True}


# ----------------------- Habits -----------------------
@api_router.get("/habits", response_model=List[Habit])
async def list_habits():
    docs = await db.habits.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return docs


@api_router.post("/habits", response_model=Habit)
async def create_habit(body: HabitIn):
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    await db.habits.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str):
    await db.habits.delete_one({"id": habit_id})
    await db.habit_logs.delete_many({"habit_id": habit_id})
    return {"ok": True}


@api_router.get("/habits/logs")
async def list_habit_logs(start: Optional[str] = None, end: Optional[str] = None):
    q = {}
    if start and end:
        q["log_date"] = {"$gte": start, "$lte": end}
    docs = await db.habit_logs.find(q, {"_id": 0}).to_list(5000)
    return docs


@api_router.post("/habits/logs")
async def toggle_habit_log(body: HabitLogIn):
    existing = await db.habit_logs.find_one(
        {"habit_id": body.habit_id, "log_date": body.log_date}
    )
    if existing:
        await db.habit_logs.delete_one({"_id": existing["_id"]})
        return {"logged": False}
    doc = {
        "id": new_id(),
        "habit_id": body.habit_id,
        "log_date": body.log_date,
        "created_at": now_iso(),
    }
    await db.habit_logs.insert_one(doc.copy())
    return {"logged": True}


# ----------------------- Notes -----------------------
@api_router.get("/notes", response_model=List[Note])
async def list_notes():
    docs = (
        await db.notes.find({}, {"_id": 0})
        .sort([("pinned", -1), ("updated_at", -1)])
        .to_list(500)
    )
    return docs


@api_router.post("/notes", response_model=Note)
async def create_note(body: NoteIn):
    doc = body.model_dump()
    doc["id"] = new_id()
    ts = now_iso()
    doc["created_at"] = ts
    doc["updated_at"] = ts
    await db.notes.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.patch("/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, body: dict):
    body.pop("id", None)
    body["updated_at"] = now_iso()
    res = await db.notes.find_one_and_update(
        {"id": note_id}, {"$set": body}, return_document=True, projection={"_id": 0}
    )
    if not res:
        raise HTTPException(404, "Note not found")
    return res


@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    await db.notes.delete_one({"id": note_id})
    # Clean up any attached voice notes (GridFS blobs + metadata).
    voices = await db.voice_notes.find({"note_id": note_id}, {"_id": 0}).to_list(500)
    for v in voices:
        await _delete_voice_blob(v["file_id"])
    await db.voice_notes.delete_many({"note_id": note_id})
    return {"ok": True}


# ----------------------- Voice Notes -----------------------
# Audio is stored in GridFS (collection `voice_audio.*`); a lightweight metadata
# record per recording lives in `voice_notes` and links back to a note.
ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/mp4",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/aac",
}
MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB per recording


async def _delete_voice_blob(file_id: str):
    try:
        await get_voice_bucket().delete(ObjectId(file_id))
    except Exception:
        # File may already be gone; metadata cleanup still proceeds.
        pass


@api_router.get("/notes/{note_id}/voice", response_model=List[VoiceNote])
async def list_voice_notes(note_id: str):
    docs = (
        await db.voice_notes.find({"note_id": note_id}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(500)
    )
    return docs


@api_router.post("/notes/{note_id}/voice", response_model=VoiceNote)
async def upload_voice_note(
    note_id: str,
    file: UploadFile = File(...),
    duration_seconds: float = Form(0.0),
):
    note = await db.notes.find_one({"id": note_id}, {"_id": 0, "id": 1})
    if not note:
        raise HTTPException(404, "Note not found")

    mime_type = (file.content_type or "application/octet-stream").split(";")[0].strip()
    if mime_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(400, f"Unsupported audio type: {mime_type}")

    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty upload")
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "Recording too large (max 25 MB)")

    filename = file.filename or f"voice-{new_id()}.webm"
    grid_id = await get_voice_bucket().upload_from_stream(
        filename, data, metadata={"note_id": note_id, "content_type": mime_type}
    )

    doc = {
        "id": new_id(),
        "note_id": note_id,
        "file_id": str(grid_id),
        "filename": filename,
        "mime_type": mime_type,
        "duration_seconds": float(duration_seconds or 0.0),
        "size_bytes": len(data),
        "created_at": now_iso(),
    }
    await db.voice_notes.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.get("/voice/{file_id}")
async def stream_voice_note(file_id: str):
    try:
        oid = ObjectId(file_id)
    except (InvalidId, TypeError):
        raise HTTPException(400, "Invalid file id")
    try:
        stream = await get_voice_bucket().open_download_stream(oid)
    except Exception:
        raise HTTPException(404, "Audio not found")
    data = await stream.read()
    content_type = (stream.metadata or {}).get("content_type", "audio/webm")
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "private, max-age=31536000"},
    )


@api_router.delete("/voice/{voice_id}")
async def delete_voice_note(voice_id: str):
    v = await db.voice_notes.find_one({"id": voice_id}, {"_id": 0})
    if not v:
        raise HTTPException(404, "Voice note not found")
    await _delete_voice_blob(v["file_id"])
    await db.voice_notes.delete_one({"id": voice_id})
    return {"ok": True}


# ----------------------- Pomodoro -----------------------
@api_router.post("/pomodoro")
async def log_pomodoro(body: PomodoroIn):
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["completed_at"] = now_iso()
    await db.pomodoro.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.get("/pomodoro")
async def list_pomodoro():
    docs = (
        await db.pomodoro.find({}, {"_id": 0}).sort("completed_at", -1).to_list(500)
    )
    return docs


# ----------------------- Analytics -----------------------
@api_router.get("/analytics/summary")
async def analytics_summary():
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=6)

    tasks_total = await db.tasks.count_documents({})
    tasks_done = await db.tasks.count_documents({"completed": True})
    goals_total = await db.goals.count_documents({})
    goals_done = await db.goals.count_documents({"status": "completed"})
    habits_total = await db.habits.count_documents({})

    # Tasks per day (last 7)
    tasks_by_day = []
    for i in range(7):
        d = week_ago + timedelta(days=i)
        d_str = d.isoformat()
        count = await db.tasks.count_documents(
            {
                "completed": True,
                "completed_at": {"$gte": d_str, "$lt": (d + timedelta(days=1)).isoformat()},
            }
        )
        tasks_by_day.append({"date": d_str, "count": count})

    # Habit completions per day (last 7)
    habit_logs = await db.habit_logs.find(
        {"log_date": {"$gte": week_ago.isoformat(), "$lte": today.isoformat()}},
        {"_id": 0},
    ).to_list(2000)

    habit_by_day = {}
    for i in range(7):
        d = (week_ago + timedelta(days=i)).isoformat()
        habit_by_day[d] = 0
    for log in habit_logs:
        if log["log_date"] in habit_by_day:
            habit_by_day[log["log_date"]] += 1
    habit_by_day_list = [{"date": k, "count": v} for k, v in habit_by_day.items()]

    # Pomodoro minutes last 7 days
    pomo_min = 0
    pomos = await db.pomodoro.find({}, {"_id": 0}).to_list(1000)
    pomo_by_day = {}
    for i in range(7):
        d = (week_ago + timedelta(days=i)).isoformat()
        pomo_by_day[d] = 0
    for p in pomos:
        ts = p.get("completed_at", "")
        if not ts:
            continue
        d_str = ts[:10]
        if d_str in pomo_by_day:
            pomo_by_day[d_str] += p.get("duration_minutes", 0)
            pomo_min += p.get("duration_minutes", 0)
    pomo_by_day_list = [{"date": k, "minutes": v} for k, v in pomo_by_day.items()]

    # Habit streaks
    habits = await db.habits.find({}, {"_id": 0}).to_list(500)
    streaks = []
    for h in habits:
        logs = await db.habit_logs.find(
            {"habit_id": h["id"]}, {"_id": 0, "log_date": 1}
        ).to_list(1000)
        log_set = {l["log_date"] for l in logs}
        streak = 0
        cur = today
        while cur.isoformat() in log_set:
            streak += 1
            cur = cur - timedelta(days=1)
        streaks.append({"habit_id": h["id"], "title": h["title"], "streak": streak})

    return {
        "totals": {
            "tasks_total": tasks_total,
            "tasks_done": tasks_done,
            "goals_total": goals_total,
            "goals_done": goals_done,
            "habits_total": habits_total,
            "pomodoro_minutes_week": pomo_min,
        },
        "tasks_by_day": tasks_by_day,
        "habits_by_day": habit_by_day_list,
        "pomodoro_by_day": pomo_by_day_list,
        "streaks": streaks,
    }


# ----------------------- AI Coach -----------------------
@api_router.post("/coach/chat")
async def coach_chat(body: ChatIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "Missing EMERGENT_LLM_KEY")

    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

    session_id = body.session_id or new_id()

    # Load history for context
    history_docs = (
        await db.coach_messages.find({"session_id": session_id}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(200)
    )

    system_msg = (
        "You are Compass, a warm, sharp productivity coach. The user is tracking weekly goals, "
        "daily tasks, habits, and notes. Keep replies short, practical, and motivating. "
        "Use bullet points when helpful. Ask one clarifying question at a time when needed."
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    # Save user message
    await db.coach_messages.insert_one(
        {
            "id": new_id(),
            "session_id": session_id,
            "role": "user",
            "content": body.message,
            "created_at": now_iso(),
        }
    )

    async def event_gen():
        full = ""
        # send session id first
        yield f"data: {{\"session_id\": \"{session_id}\"}}\n\n"
        try:
            async for ev in chat.stream_message(UserMessage(text=body.message)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    safe = ev.content.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")
                    yield f"data: {{\"delta\": \"{safe}\"}}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            err = str(e).replace("\"", "'")
            yield f"data: {{\"error\": \"{err}\"}}\n\n"
        finally:
            await db.coach_messages.insert_one(
                {
                    "id": new_id(),
                    "session_id": session_id,
                    "role": "assistant",
                    "content": full,
                    "created_at": now_iso(),
                }
            )
            yield "data: {\"done\": true}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/coach/history")
async def coach_history(session_id: str):
    docs = (
        await db.coach_messages.find({"session_id": session_id}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(500)
    )
    return docs


@api_router.post("/coach/breakdown")
async def coach_breakdown(body: BreakdownIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "Missing EMERGENT_LLM_KEY")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    prompt = (
        f"Break down this weekly goal into 4-7 concrete daily tasks. "
        f"Return ONLY a JSON array of objects with keys 'title' and 'priority' (low/medium/high). "
        f"No prose, no markdown fences.\n\nGoal: {body.goal_title}\nDescription: {body.description}"
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"breakdown-{new_id()}",
        system_message="You are a precise planner. Output strictly valid JSON.",
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    resp = await chat.send_message(UserMessage(text=prompt))
    text = resp if isinstance(resp, str) else str(resp)
    # strip code fences if any
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()
    import json
    try:
        tasks = json.loads(cleaned)
        if not isinstance(tasks, list):
            tasks = []
    except Exception:
        tasks = []
    return {"tasks": tasks, "raw": text}


# ----------------------- Mount -----------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
