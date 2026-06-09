import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getGoals,
  getTasks,
  getHabits,
  getHabitLogs,
  getSummary,
  updateTask,
} from "../lib/api";
import { getMonday, ymd, weekDays, dayShort, isToday } from "../lib/dates";
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Target,
  Flame,
  Timer,
} from "lucide-react";

const StatCard = ({ label, value, sub, surface, tid }) => (
  <div
    data-testid={tid}
    className={`brut-card brut-card-hover p-5 ${surface}`}
  >
    <p className="label-tiny text-neutral-700">{label}</p>
    <p className="text-4xl font-black mt-2">{value}</p>
    {sub && <p className="text-sm text-neutral-700 mt-1">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const monday = getMonday();
  const week = weekDays(monday);

  const load = async () => {
    const [g, t, h, s] = await Promise.all([
      getGoals(ymd(monday)),
      getTasks(),
      getHabits(),
      getSummary(),
    ]);
    setGoals(g);
    setTasks(t);
    setHabits(h);
    setSummary(s);
    const start = ymd(week[0]);
    const end = ymd(week[6]);
    setLogs(await getHabitLogs(start, end));
  };

  useEffect(() => {
    load();
  }, []);

  const today = ymd(new Date());
  const todayTasks = tasks.filter((t) => !t.completed && (!t.due_date || t.due_date <= today));
  const doneToday = tasks.filter(
    (t) => t.completed && (t.completed_at || "").slice(0, 10) === today
  ).length;

  const habitDoneToday = logs.filter((l) => l.log_date === today).length;

  const toggleTask = async (t) => {
    const u = await updateTask(t.id, { completed: !t.completed });
    setTasks((arr) => arr.map((x) => (x.id === t.id ? u : x)));
  };

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="brut-card p-6 surface-peach flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="label-tiny text-neutral-700">This week</p>
          <h1 className="text-4xl sm:text-5xl font-black mt-2 leading-none">
            {monday.toLocaleDateString("en-US", { month: "long", day: "numeric" })} —{" "}
            {week[6].toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </h1>
          <p className="mt-3 text-neutral-800 max-w-xl">
            Set goals. Check tasks. Build streaks. Win the week.
          </p>
        </div>
        <Link
          to="/goals"
          data-testid="hero-set-goals"
          className="brut-btn brut-btn-dark"
        >
          Set weekly goals <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          tid="stat-goals"
          label="Active goals"
          value={goals.filter((g) => g.status === "active").length}
          sub={`${goals.filter((g) => g.status === "completed").length} completed`}
          surface=""
        />
        <StatCard
          tid="stat-tasks-today"
          label="Tasks today"
          value={todayTasks.length}
          sub={`${doneToday} done today`}
          surface="surface-mint"
        />
        <StatCard
          tid="stat-habits-today"
          label="Habits today"
          value={`${habitDoneToday}/${habits.length}`}
          sub="Keep streaks alive"
          surface="surface-lavender"
        />
        <StatCard
          tid="stat-focus"
          label="Focus this week"
          value={`${summary?.totals?.pomodoro_minutes_week ?? 0}m`}
          sub="Pomodoro minutes"
          surface="surface-sky"
        />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Today's tasks */}
        <div className="brut-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Target className="w-5 h-5" strokeWidth={2.5} /> Today's focus
            </h3>
            <Link to="/tasks" className="text-sm font-semibold underline">
              All tasks
            </Link>
          </div>
          {todayTasks.length === 0 && (
            <div className="surface-mint border-2 border-black rounded-md p-6 text-center">
              <p className="font-semibold">All clear for today.</p>
              <p className="text-sm text-neutral-700 mt-1">
                Add a task or revisit your goals.
              </p>
            </div>
          )}
          <ul className="space-y-2">
            {todayTasks.slice(0, 7).map((t) => (
              <li
                key={t.id}
                data-testid={`dashboard-task-${t.id}`}
                className="flex items-center gap-3 p-3 border-2 border-black rounded-md bg-white hover:surface-peach"
              >
                <button
                  data-testid={`toggle-task-${t.id}`}
                  onClick={() => toggleTask(t)}
                  className="shrink-0"
                  aria-label="Toggle task"
                >
                  {t.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <span className="flex-1 font-medium">{t.title}</span>
                <span
                  className={`text-xs font-bold px-2 py-1 border-2 border-black rounded-md ${
                    t.priority === "high"
                      ? "bg-[#FF5E5E] text-white"
                      : t.priority === "medium"
                      ? "surface-peach"
                      : "bg-white"
                  }`}
                >
                  {t.priority}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weekly goals */}
        <div className="brut-card p-5 surface-lavender">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5" strokeWidth={2.5} /> Weekly goals
          </h3>
          {goals.length === 0 && (
            <p className="text-sm">No goals yet. Set 1–3 to start the week strong.</p>
          )}
          <ul className="space-y-3">
            {goals.slice(0, 5).map((g) => {
              const pct = Math.min(
                100,
                Math.round((g.current_value / Math.max(1, g.target_value)) * 100)
              );
              return (
                <li
                  key={g.id}
                  data-testid={`dashboard-goal-${g.id}`}
                  className="bg-white border-2 border-black rounded-md p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{g.title}</p>
                    <span className="text-xs font-mono">{pct}%</span>
                  </div>
                  <div className="mt-2 h-3 border-2 border-black bg-white rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-[#10B981]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <Link
            to="/goals"
            data-testid="dashboard-add-goal"
            className="brut-btn brut-btn-dark mt-4 w-full"
          >
            Manage goals
          </Link>
        </div>
      </div>

      {/* Habits row */}
      <div className="brut-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Timer className="w-5 h-5" strokeWidth={2.5} /> Habit grid
          </h3>
          <Link to="/habits" className="text-sm font-semibold underline">
            Manage
          </Link>
        </div>
        {habits.length === 0 ? (
          <p className="text-sm text-neutral-700">Add habits to fill in the grid.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left pb-2 pr-3 label-tiny text-neutral-700">
                    Habit
                  </th>
                  {week.map((d) => (
                    <th
                      key={ymd(d)}
                      className={`p-1 label-tiny text-center ${
                        isToday(d) ? "text-[#FF5E5E]" : "text-neutral-700"
                      }`}
                    >
                      {dayShort(d)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => (
                  <tr key={h.id}>
                    <td className="py-1 pr-3 font-semibold">{h.title}</td>
                    {week.map((d) => {
                      const did = logs.some(
                        (l) => l.habit_id === h.id && l.log_date === ymd(d)
                      );
                      return (
                        <td key={ymd(d)} className="p-1 text-center">
                          <div
                            className={`w-7 h-7 mx-auto border-2 border-black rounded-md ${
                              did ? "bg-[#10B981]" : "bg-white"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
