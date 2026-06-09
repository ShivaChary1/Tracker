import React, { useEffect, useRef, useState } from "react";
import { logPomodoro, getPomodoros, getTasks } from "../lib/api";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  { label: "Focus", minutes: 25, color: "peach" },
  { label: "Short break", minutes: 5, color: "mint" },
  { label: "Long break", minutes: 15, color: "lavender" },
];

export default function Pomodoro() {
  const [mode, setMode] = useState(PRESETS[0]);
  const [remaining, setRemaining] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const startedRef = useRef(null);

  const load = async () => {
    setTasks(await getTasks({ completed: false }));
    setHistory(await getPomodoros());
  };
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          setRunning(false);
          finish();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [running]);

  const setPreset = (p) => {
    setMode(p);
    setRemaining(p.minutes * 60);
    setRunning(false);
  };

  const start = () => {
    if (!startedRef.current) startedRef.current = Date.now();
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setRemaining(mode.minutes * 60);
    startedRef.current = null;
  };

  const finish = async () => {
    if (mode.label !== "Focus") return;
    try {
      await logPomodoro({
        duration_minutes: mode.minutes,
        task_id: taskId || null,
        label: mode.label,
      });
      toast.success("Focus session logged!");
      load();
    } catch (e) {
      toast.error("Could not log session");
    }
    startedRef.current = null;
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = 1 - remaining / (mode.minutes * 60);

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
      <div className={`brut-card p-8 surface-${mode.color} text-center`}>
        <div className="flex justify-center gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              data-testid={`pomo-preset-${p.label.replace(" ", "-").toLowerCase()}`}
              onClick={() => setPreset(p)}
              className={`brut-btn ${mode.label === p.label ? "brut-btn-dark" : ""}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="my-10">
          <div
            data-testid="pomo-timer"
            className="text-[120px] sm:text-[160px] font-black leading-none mono tracking-tighter"
          >
            {mm}:{ss}
          </div>
          <div className="mx-auto mt-4 max-w-md h-3 border-2 border-black rounded-sm overflow-hidden bg-white">
            <div
              className="h-full bg-[#FF5E5E]"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {!running ? (
            <button
              data-testid="pomo-start"
              onClick={start}
              className="brut-btn brut-btn-primary !px-6 !py-3 text-lg"
            >
              <Play className="w-5 h-5" /> Start
            </button>
          ) : (
            <button
              data-testid="pomo-pause"
              onClick={pause}
              className="brut-btn brut-btn-dark !px-6 !py-3 text-lg"
            >
              <Pause className="w-5 h-5" /> Pause
            </button>
          )}
          <button
            data-testid="pomo-reset"
            onClick={reset}
            className="brut-btn !px-6 !py-3 text-lg"
          >
            <RotateCcw className="w-5 h-5" /> Reset
          </button>
        </div>

        <div className="mt-6 max-w-md mx-auto text-left">
          <label className="label-tiny text-neutral-700">Linked task (optional)</label>
          <select
            data-testid="pomo-task-select"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="brut-input mt-1"
          >
            <option value="">None</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="brut-card p-5">
        <h3 className="text-xl font-black flex items-center gap-2">
          <Coffee className="w-5 h-5" /> Recent sessions
        </h3>
        <ul className="mt-4 space-y-2 max-h-[60vh] overflow-auto">
          {history.length === 0 && (
            <li className="text-sm text-neutral-700">No sessions yet.</li>
          )}
          {history.map((p) => (
            <li
              key={p.id}
              className="border-2 border-black rounded-md p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-bold">{p.duration_minutes} min focus</p>
                <p className="text-xs text-neutral-700 font-mono">
                  {new Date(p.completed_at).toLocaleString()}
                </p>
              </div>
              <span className="label-tiny">{p.label || "Focus"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
