import React, { useEffect, useState } from "react";
import {
  getHabits,
  createHabit,
  deleteHabit,
  getHabitLogs,
  toggleHabitLog,
} from "../lib/api";
import { getMonday, weekDays, ymd, dayShort, isToday } from "../lib/dates";
import { Plus, Trash2, Flame } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["mint", "peach", "lavender", "sky"];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("mint");
  const monday = getMonday();
  const week = weekDays(monday);

  const load = async () => {
    const h = await getHabits();
    setHabits(h);
    setLogs(await getHabitLogs(ymd(week[0]), ymd(week[6])));
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const h = await createHabit({ title, color, target_per_week: 7 });
    setHabits((arr) => [...arr, h]);
    setTitle("");
    toast.success("Habit added");
  };

  const toggle = async (habit, date) => {
    const d = ymd(date);
    const res = await toggleHabitLog(habit.id, d);
    if (res.logged) {
      setLogs((arr) => [...arr, { habit_id: habit.id, log_date: d }]);
    } else {
      setLogs((arr) => arr.filter((l) => !(l.habit_id === habit.id && l.log_date === d)));
    }
  };

  const remove = async (h) => {
    await deleteHabit(h.id);
    setHabits((arr) => arr.filter((x) => x.id !== h.id));
    setLogs((arr) => arr.filter((l) => l.habit_id !== h.id));
  };

  const streak = (habit) => {
    let s = 0;
    let cur = new Date();
    cur.setHours(0, 0, 0, 0);
    while (true) {
      const d = ymd(cur);
      if (logs.some((l) => l.habit_id === habit.id && l.log_date === d)) {
        s++;
        cur.setDate(cur.getDate() - 1);
      } else break;
    }
    return s;
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="brut-card p-5 surface-mint">
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
          <input
            data-testid="habit-title-input"
            className="brut-input"
            placeholder="New habit (e.g. Read 20 min)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            data-testid="habit-color-select"
            className="brut-input"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button data-testid="habit-add-button" className="brut-btn brut-btn-dark">
            <Plus className="w-4 h-4" /> Add habit
          </button>
        </div>
      </form>

      <div className="brut-card p-5 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left pb-3 pr-4 label-tiny text-neutral-700">Habit</th>
              {week.map((d) => (
                <th
                  key={ymd(d)}
                  className={`p-1 text-center label-tiny ${
                    isToday(d) ? "text-[#FF5E5E]" : "text-neutral-700"
                  }`}
                >
                  <div>{dayShort(d)}</div>
                  <div className="font-mono text-xs mt-1">{d.getDate()}</div>
                </th>
              ))}
              <th className="text-center label-tiny text-neutral-700 pl-3">Streak</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id} className="border-t-2 border-black">
                <td className={`py-3 pr-4 font-bold surface-${h.color}`}>
                  <span className="px-2">{h.title}</span>
                </td>
                {week.map((d) => {
                  const done = logs.some(
                    (l) => l.habit_id === h.id && l.log_date === ymd(d)
                  );
                  return (
                    <td key={ymd(d)} className="p-1 text-center">
                      <button
                        data-testid={`habit-cell-${h.id}-${ymd(d)}`}
                        onClick={() => toggle(h, d)}
                        className={`w-8 h-8 mx-auto border-2 border-black rounded-md transition-transform active:scale-95 ${
                          done ? "bg-[#10B981]" : "bg-white hover:surface-peach"
                        }`}
                        aria-label="Toggle"
                      />
                    </td>
                  );
                })}
                <td className="text-center pl-3">
                  <span className="inline-flex items-center gap-1 font-mono font-bold">
                    <Flame className="w-4 h-4 text-[#FF5E5E]" />
                    {streak(h)}
                  </span>
                </td>
                <td>
                  <button
                    data-testid={`habit-delete-${h.id}`}
                    onClick={() => remove(h)}
                    className="border-2 border-black rounded-md p-1 hover:bg-[#FF5E5E] hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {habits.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center">
                  <p className="font-semibold">No habits yet.</p>
                  <p className="text-sm text-neutral-700">
                    Add one to start tracking streaks.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
