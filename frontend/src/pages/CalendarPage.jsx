import React, { useEffect, useMemo, useState } from "react";
import { getTasks, getGoals } from "../lib/api";
import { ymd, getMonday } from "../lib/dates";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    (async () => {
      setTasks(await getTasks());
      setGoals(await getGoals(ymd(getMonday())));
    })();
  }, []);

  const monthStart = useMemo(
    () => new Date(cursor.getFullYear(), cursor.getMonth(), 1),
    [cursor]
  );
  const monthEnd = useMemo(
    () => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
    [cursor]
  );
  const startDay = (monthStart.getDay() + 6) % 7; // Monday=0
  const totalCells = Math.ceil((startDay + monthEnd.getDate()) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDay + 1;
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), dayNum);
    cells.push(d);
  }

  const today = ymd(new Date());

  const tasksByDate = useMemo(() => {
    const m = {};
    for (const t of tasks) {
      if (!t.due_date) continue;
      m[t.due_date] = m[t.due_date] || [];
      m[t.due_date].push(t);
    }
    return m;
  }, [tasks]);

  const shift = (n) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + n);
    setCursor(d);
  };

  return (
    <div className="space-y-4">
      <div className="brut-card p-4 flex items-center justify-between">
        <button
          data-testid="cal-prev"
          className="brut-btn !px-3"
          onClick={() => shift(-1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-2xl font-black">
          {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <button
          data-testid="cal-next"
          className="brut-btn !px-3"
          onClick={() => shift(1)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="brut-card p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
            <div key={d} className="label-tiny text-center text-neutral-700">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const dStr = ymd(d);
            const items = tasksByDate[dStr] || [];
            const isT = dStr === today;
            return (
              <div
                key={i}
                data-testid={`cal-cell-${dStr}`}
                className={`min-h-[96px] border-2 border-black rounded-md p-2 ${
                  isT ? "surface-peach" : inMonth ? "bg-white" : "bg-neutral-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      !inMonth ? "text-neutral-400" : ""
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[10px] font-bold border-2 border-black rounded px-1 bg-black text-white">
                      {items.length}
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className={`text-[11px] truncate border-2 border-black rounded px-1 py-0.5 ${
                        t.priority === "high"
                          ? "bg-[#FF5E5E] text-white"
                          : t.priority === "medium"
                          ? "surface-mint"
                          : "bg-white"
                      } ${t.completed ? "line-through opacity-60" : ""}`}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
