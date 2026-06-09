import React, { useEffect, useState } from "react";
import { getTasks, createTask, updateTask, deleteTask, getGoals } from "../lib/api";
import { ymd, getMonday } from "../lib/dates";
import { Plus, Trash2, CheckCircle2, Circle, Filter } from "lucide-react";
import { toast } from "sonner";

const PRIORITIES = ["low", "medium", "high"];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState(ymd(new Date()));
  const [goalId, setGoalId] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setTasks(await getTasks());
    setGoals(await getGoals(ymd(getMonday())));
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const t = await createTask({
      title,
      priority,
      due_date: due || null,
      goal_id: goalId || null,
    });
    setTasks((arr) => [t, ...arr]);
    setTitle("");
    toast.success("Task added");
  };

  const toggle = async (t) => {
    const u = await updateTask(t.id, { completed: !t.completed });
    setTasks((arr) => arr.map((x) => (x.id === t.id ? u : x)));
  };

  const remove = async (t) => {
    await deleteTask(t.id);
    setTasks((arr) => arr.filter((x) => x.id !== t.id));
  };

  const filtered = tasks.filter((t) => {
    if (filter === "open") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="brut-card p-5 surface-peach">
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3">
          <input
            data-testid="task-title-input"
            className="brut-input"
            placeholder="What needs doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            data-testid="task-priority-select"
            className="brut-input"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            data-testid="task-due-input"
            type="date"
            className="brut-input"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <select
            data-testid="task-goal-select"
            className="brut-input"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
          >
            <option value="">No goal</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <button data-testid="task-add-button" className="brut-btn brut-btn-dark">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4" />
        {["all", "open", "done"].map((f) => (
          <button
            key={f}
            data-testid={`filter-${f}`}
            onClick={() => setFilter(f)}
            className={`brut-btn !py-1 ${filter === f ? "brut-btn-dark" : ""}`}
          >
            {f}
          </button>
        ))}
        <span className="text-sm text-neutral-700 ml-auto">
          {tasks.filter((t) => t.completed).length}/{tasks.length} completed
        </span>
      </div>

      <ul className="space-y-2">
        {filtered.map((t) => (
          <li
            key={t.id}
            data-testid={`task-${t.id}`}
            className={`brut-card p-4 flex items-center gap-3 ${
              t.completed ? "surface-mint" : ""
            }`}
          >
            <button
              data-testid={`task-toggle-${t.id}`}
              onClick={() => toggle(t)}
              aria-label="Toggle"
            >
              {t.completed ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1">
              <p
                className={`font-semibold ${t.completed ? "line-through opacity-70" : ""}`}
              >
                {t.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {t.due_date && (
                  <span className="text-xs font-mono">{t.due_date}</span>
                )}
                {t.goal_id && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    {goals.find((g) => g.id === t.goal_id)?.title || "goal"}
                  </span>
                )}
              </div>
            </div>
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
            <button
              data-testid={`task-delete-${t.id}`}
              onClick={() => remove(t)}
              className="border-2 border-black rounded-md p-1 hover:bg-[#FF5E5E] hover:text-white"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="brut-card p-8 text-center surface-lavender">
            <p className="font-semibold">Nothing here.</p>
          </li>
        )}
      </ul>
    </div>
  );
}
