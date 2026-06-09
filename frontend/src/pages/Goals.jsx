import React, { useEffect, useState } from "react";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  breakdownGoal,
  createTask,
} from "../lib/api";
import { getMonday, ymd } from "../lib/dates";
import { Plus, Trash2, Sparkles, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Goals() {
  const [monday, setMonday] = useState(getMonday());
  const [goals, setGoals] = useState([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [target, setTarget] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const load = async () => setGoals(await getGoals(ymd(monday)));

  useEffect(() => {
    load();
  }, [monday]);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createGoal({
      title,
      description: desc,
      week_start: ymd(monday),
      target_value: Number(target),
      current_value: 0,
    });
    setTitle("");
    setDesc("");
    setTarget(1);
    setAdding(false);
    load();
    toast.success("Goal added");
  };

  const inc = async (g, delta) => {
    const v = Math.max(0, Math.min(g.target_value, g.current_value + delta));
    const status = v >= g.target_value ? "completed" : "active";
    const u = await updateGoal(g.id, { current_value: v, status });
    setGoals((arr) => arr.map((x) => (x.id === g.id ? u : x)));
  };

  const remove = async (g) => {
    await deleteGoal(g.id);
    setGoals((arr) => arr.filter((x) => x.id !== g.id));
  };

  const aiBreakdown = async (g) => {
    setBusyId(g.id);
    try {
      const res = await breakdownGoal(g.title, g.description || "");
      const items = res.tasks || [];
      for (const it of items) {
        await createTask({
          title: it.title,
          priority: (it.priority || "medium").toLowerCase(),
          goal_id: g.id,
          due_date: ymd(monday),
        });
      }
      toast.success(`Created ${items.length} tasks from AI breakdown`);
    } catch (e) {
      toast.error("AI breakdown failed");
    } finally {
      setBusyId(null);
    }
  };

  const shiftWeek = (d) => {
    const m = new Date(monday);
    m.setDate(m.getDate() + d * 7);
    setMonday(getMonday(m));
  };

  return (
    <div className="space-y-5">
      <div className="brut-card p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            data-testid="prev-week"
            className="brut-btn !px-2 !py-2"
            onClick={() => shiftWeek(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3">
            <p className="label-tiny text-neutral-700">Week of</p>
            <p className="font-black text-lg">
              {monday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button
            data-testid="next-week"
            className="brut-btn !px-2 !py-2"
            onClick={() => shiftWeek(1)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          data-testid="add-goal-btn"
          className="brut-btn brut-btn-primary"
          onClick={() => setAdding((v) => !v)}
        >
          <Plus className="w-4 h-4" /> New goal
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} className="brut-card p-5 surface-peach space-y-3">
          <input
            data-testid="goal-title-input"
            className="brut-input"
            placeholder="Goal title (e.g. Run 20km)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            data-testid="goal-desc-input"
            className="brut-input"
            placeholder="Description (optional)"
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <label className="label-tiny text-neutral-700">Target</label>
            <input
              data-testid="goal-target-input"
              type="number"
              min="1"
              className="brut-input w-24"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <button data-testid="goal-submit-button" className="brut-btn brut-btn-dark ml-auto">
              <Check className="w-4 h-4" /> Save goal
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const pct = Math.min(
            100,
            Math.round((g.current_value / Math.max(1, g.target_value)) * 100)
          );
          const done = g.status === "completed";
          return (
            <div
              key={g.id}
              data-testid={`goal-card-${g.id}`}
              className={`brut-card p-5 ${done ? "surface-mint" : "bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xl font-black">{g.title}</h4>
                  {g.description && (
                    <p className="text-sm text-neutral-700 mt-1">{g.description}</p>
                  )}
                </div>
                <button
                  data-testid={`delete-goal-${g.id}`}
                  onClick={() => remove(g)}
                  className="border-2 border-black rounded-md p-1 hover:bg-[#FF5E5E] hover:text-white"
                  aria-label="Delete goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  data-testid={`goal-dec-${g.id}`}
                  className="brut-btn !px-3 !py-1"
                  onClick={() => inc(g, -1)}
                >
                  −
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm">
                      {g.current_value}/{g.target_value}
                    </span>
                    <span className="font-mono text-sm">{pct}%</span>
                  </div>
                  <div className="h-3 border-2 border-black bg-white rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-[#10B981]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <button
                  data-testid={`goal-inc-${g.id}`}
                  className="brut-btn !px-3 !py-1"
                  onClick={() => inc(g, +1)}
                >
                  +
                </button>
              </div>
              <button
                data-testid={`goal-ai-${g.id}`}
                onClick={() => aiBreakdown(g)}
                disabled={busyId === g.id}
                className="brut-btn brut-btn-primary mt-4 w-full"
              >
                <Sparkles className="w-4 h-4" />
                {busyId === g.id ? "Thinking..." : "AI: break into tasks"}
              </button>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="brut-card p-8 col-span-full text-center surface-lavender">
            <p className="font-bold">No goals for this week.</p>
            <p className="text-sm text-neutral-700 mt-1">
              Add 1–3 goals that genuinely matter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
