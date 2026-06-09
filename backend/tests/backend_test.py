"""Backend API tests for Compass Dashboard"""
import os
import json
import time
import requests
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://weekly-dashboard-6.preview.emergentagent.com"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# --------------- Goals ---------------
class TestGoals:
    def test_crud(self, s):
        r = s.post(f"{API}/goals", json={"title": "TEST_Goal", "week_start": "2026-01-05", "target_value": 5, "category": "general"})
        assert r.status_code == 200, r.text
        g = r.json()
        assert g["title"] == "TEST_Goal" and "id" in g
        gid = g["id"]

        r = s.get(f"{API}/goals")
        assert r.status_code == 200
        assert any(x["id"] == gid for x in r.json())

        r = s.patch(f"{API}/goals/{gid}", json={"current_value": 2})
        assert r.status_code == 200 and r.json()["current_value"] == 2

        r = s.delete(f"{API}/goals/{gid}")
        assert r.status_code == 200


# --------------- Tasks ---------------
class TestTasks:
    def test_crud_and_complete_toggle(self, s):
        r = s.post(f"{API}/tasks", json={"title": "TEST_Task", "priority": "high", "due_date": "2026-01-08"})
        assert r.status_code == 200
        t = r.json()
        tid = t["id"]
        assert t["completed_at"] is None

        r = s.patch(f"{API}/tasks/{tid}", json={"completed": True})
        assert r.status_code == 200
        assert r.json()["completed_at"] is not None

        r = s.patch(f"{API}/tasks/{tid}", json={"completed": False})
        assert r.json()["completed_at"] is None

        r = s.get(f"{API}/tasks", params={"completed": False})
        assert r.status_code == 200

        assert s.delete(f"{API}/tasks/{tid}").status_code == 200


# --------------- Habits ---------------
class TestHabits:
    def test_habit_lifecycle(self, s):
        r = s.post(f"{API}/habits", json={"title": "TEST_Habit", "color": "mint", "target_per_week": 5})
        assert r.status_code == 200
        hid = r.json()["id"]

        # Toggle log on
        r = s.post(f"{API}/habits/logs", json={"habit_id": hid, "log_date": "2026-01-07"})
        assert r.status_code == 200 and r.json()["logged"] is True

        # Toggle off
        r = s.post(f"{API}/habits/logs", json={"habit_id": hid, "log_date": "2026-01-07"})
        assert r.json()["logged"] is False

        # Log again then list
        s.post(f"{API}/habits/logs", json={"habit_id": hid, "log_date": "2026-01-07"})
        r = s.get(f"{API}/habits/logs", params={"start": "2026-01-01", "end": "2026-01-31"})
        assert r.status_code == 200
        assert any(l["habit_id"] == hid for l in r.json())

        # Delete habit -> cleans logs
        assert s.delete(f"{API}/habits/{hid}").status_code == 200


# --------------- Notes ---------------
class TestNotes:
    def test_notes_crud(self, s):
        r = s.post(f"{API}/notes", json={"title": "TEST_Note", "content": "hello", "color": "peach"})
        assert r.status_code == 200
        nid = r.json()["id"]

        r = s.patch(f"{API}/notes/{nid}", json={"content": "updated"})
        assert r.status_code == 200 and r.json()["content"] == "updated"

        r = s.get(f"{API}/notes")
        assert any(n["id"] == nid for n in r.json())

        assert s.delete(f"{API}/notes/{nid}").status_code == 200


# --------------- Pomodoro ---------------
class TestPomodoro:
    def test_log_and_list(self, s):
        r = s.post(f"{API}/pomodoro", json={"duration_minutes": 25, "label": "TEST_focus"})
        assert r.status_code == 200
        pid = r.json()["id"]
        r = s.get(f"{API}/pomodoro")
        assert r.status_code == 200
        assert any(p["id"] == pid for p in r.json())


# --------------- Analytics ---------------
class TestAnalytics:
    def test_summary(self, s):
        r = s.get(f"{API}/analytics/summary")
        assert r.status_code == 200
        data = r.json()
        for k in ("totals", "tasks_by_day", "habits_by_day", "pomodoro_by_day", "streaks"):
            assert k in data
        assert len(data["tasks_by_day"]) == 7
        assert len(data["habits_by_day"]) == 7
        assert len(data["pomodoro_by_day"]) == 7


# --------------- AI Coach ---------------
class TestCoach:
    def test_chat_stream(self, s):
        r = s.post(f"{API}/coach/chat", json={"message": "Say hi in 3 words."}, stream=True, timeout=60)
        assert r.status_code == 200
        got_session = False
        got_delta = False
        got_done = False
        session_id = None
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            payload = json.loads(line[5:].strip())
            if "session_id" in payload and not got_delta:
                got_session = True
                session_id = payload["session_id"]
            if "delta" in payload:
                got_delta = True
            if payload.get("done"):
                got_done = True
                break
            if "error" in payload:
                pytest.fail(f"Stream error: {payload['error']}")
        assert got_session and got_delta and got_done
        # History
        time.sleep(0.5)
        r = s.get(f"{API}/coach/history", params={"session_id": session_id})
        assert r.status_code == 200
        assert len(r.json()) >= 2

    def test_breakdown(self, s):
        r = s.post(f"{API}/coach/breakdown", json={"goal_title": "Learn FastAPI basics", "description": "Beginner level"}, timeout=60)
        assert r.status_code == 200
        data = r.json()
        assert "tasks" in data
        assert isinstance(data["tasks"], list)
        assert len(data["tasks"]) >= 1
        assert "title" in data["tasks"][0]
