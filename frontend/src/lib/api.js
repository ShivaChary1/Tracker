import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const getGoals = (week_start) =>
  api.get("/goals", { params: week_start ? { week_start } : {} }).then((r) => r.data);
export const createGoal = (b) => api.post("/goals", b).then((r) => r.data);
export const updateGoal = (id, b) => api.patch(`/goals/${id}`, b).then((r) => r.data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`).then((r) => r.data);

export const getTasks = (params = {}) => api.get("/tasks", { params }).then((r) => r.data);
export const createTask = (b) => api.post("/tasks", b).then((r) => r.data);
export const updateTask = (id, b) => api.patch(`/tasks/${id}`, b).then((r) => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data);

export const getHabits = () => api.get("/habits").then((r) => r.data);
export const createHabit = (b) => api.post("/habits", b).then((r) => r.data);
export const deleteHabit = (id) => api.delete(`/habits/${id}`).then((r) => r.data);
export const getHabitLogs = (start, end) =>
  api.get("/habits/logs", { params: { start, end } }).then((r) => r.data);
export const toggleHabitLog = (habit_id, log_date) =>
  api.post("/habits/logs", { habit_id, log_date }).then((r) => r.data);

export const getNotes = () => api.get("/notes").then((r) => r.data);
export const createNote = (b) => api.post("/notes", b).then((r) => r.data);
export const updateNote = (id, b) => api.patch(`/notes/${id}`, b).then((r) => r.data);
export const deleteNote = (id) => api.delete(`/notes/${id}`).then((r) => r.data);

// Voice notes (audio stored in GridFS on the backend).
export const getVoiceNotes = (noteId) =>
  api.get(`/notes/${noteId}/voice`).then((r) => r.data);
export const uploadVoiceNote = (noteId, blob, durationSeconds = 0) => {
  const form = new FormData();
  const ext = (blob.type.split("/")[1] || "webm").split(";")[0];
  form.append("file", blob, `voice-${Date.now()}.${ext}`);
  form.append("duration_seconds", String(durationSeconds));
  return api
    .post(`/notes/${noteId}/voice`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
export const deleteVoiceNote = (voiceId) =>
  api.delete(`/voice/${voiceId}`).then((r) => r.data);
// Direct URL for an <audio> src; streams the GridFS blob.
export const voiceUrl = (fileId) => `${API}/voice/${fileId}`;

export const logPomodoro = (b) => api.post("/pomodoro", b).then((r) => r.data);
export const getPomodoros = () => api.get("/pomodoro").then((r) => r.data);

export const getSummary = () => api.get("/analytics/summary").then((r) => r.data);

export const breakdownGoal = (goal_title, description) =>
  api.post("/coach/breakdown", { goal_title, description }).then((r) => r.data);
