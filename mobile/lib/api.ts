import axios from 'axios';

const BASE_URL = 'https://tracker-odkl.onrender.com/api';

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Tasks
export const getTasks = (params?: Record<string, string>) => api.get('/tasks', { params });
export const createTask = (data: TaskCreate) => api.post('/tasks', data);
export const updateTask = (id: string | number, data: Partial<TaskCreate & { completed: boolean }>) =>
  api.patch(`/tasks/${id}`, data);
export const deleteTask = (id: string | number) => api.delete(`/tasks/${id}`);

// Goals
export const getGoals = (weekStart: string) => api.get('/goals', { params: { week_start: weekStart } });
export const createGoal = (data: GoalCreate) => api.post('/goals', data);
export const updateGoal = (id: string | number, data: Partial<GoalCreate> & { status?: 'active' | 'completed' }) =>
  api.patch(`/goals/${id}`, data);
export const deleteGoal = (id: string | number) => api.delete(`/goals/${id}`);

// Habits
export const getHabits = () => api.get('/habits');
export const createHabit = (data: HabitCreate) => api.post('/habits', data);
export const deleteHabit = (id: string | number) => api.delete(`/habits/${id}`);
export const getHabitLogs = (start: string, end: string) =>
  api.get('/habits/logs', { params: { start, end } });
export const toggleHabitLog = (habitId: string | number, logDate: string) =>
  api.post('/habits/logs', { habit_id: habitId, log_date: logDate });

// Notes
export const getNotes = () => api.get('/notes');
export const createNote = (data: NoteCreate) => api.post('/notes', data);
export const updateNote = (id: string | number, data: Partial<NoteCreate>) => api.patch(`/notes/${id}`, data);
export const deleteNote = (id: string | number) => api.delete(`/notes/${id}`);

// Pomodoro
export const getPomodoro = () => api.get('/pomodoro');
export const logPomodoro = (data: { duration_minutes: number; label: string }) => api.post('/pomodoro', data);

// Analytics
export const getAnalytics = () => api.get('/analytics/summary');

// Coach
export const coachBreakdown = (goalTitle: string, description?: string) =>
  api.post('/coach/breakdown', { goal_title: goalTitle, description });

// Types
export interface Task {
  id: string | number;
  title: string;
  completed: boolean;
  completed_at?: string;
  due_date?: string;
  goal_id?: string | number;
  priority: 'low' | 'medium' | 'high';
}

export interface TaskCreate {
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  goal_id?: string | number;
}

export interface Goal {
  id: string | number;
  title: string;
  description?: string;
  week_start: string;
  target_value: number;
  current_value: number;
  status: 'active' | 'completed';
}

export interface GoalCreate {
  title: string;
  description?: string;
  week_start: string;
  target_value: number;
}

export interface Habit {
  id: string | number;
  title: string;
  color: 'mint' | 'peach' | 'lavender' | 'sky';
  target_per_week: number;
}

export interface HabitCreate {
  title: string;
  color: 'mint' | 'peach' | 'lavender' | 'sky';
  target_per_week: number;
}

export interface HabitLog {
  habit_id: string | number;
  log_date: string;
}

export interface Note {
  id: string | number;
  title: string;
  content: string;
  color: 'white' | 'mint' | 'peach' | 'lavender' | 'sky';
  tags?: string[];
}

export interface NoteCreate {
  title: string;
  content: string;
  color: 'white' | 'mint' | 'peach' | 'lavender' | 'sky';
  tags?: string[];
}

export interface AnalyticsSummary {
  totals: {
    goals_done: number;
    goals_total: number;
    tasks_done: number;
    tasks_total: number;
    habits_total: number;
    pomodoro_minutes_week: number;
  };
  tasks_by_day: Array<{ date: string; count: number }>;
  habits_by_day: Array<{ date: string; count: number }>;
  pomodoro_by_day: Array<{ date: string; minutes: number }>;
  streaks: Array<{ habit_id: number; title: string; streak: number }>;
}
