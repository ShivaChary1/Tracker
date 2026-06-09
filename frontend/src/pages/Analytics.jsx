import React, { useEffect, useState } from "react";
import { getSummary } from "../lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { Flame, Target, ListChecks, Timer } from "lucide-react";

const Stat = ({ icon: Icon, label, value, surface, tid }) => (
  <div data-testid={tid} className={`brut-card p-5 ${surface}`}>
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" strokeWidth={2.5} />
      <span className="label-tiny">{label}</span>
    </div>
    <p className="text-4xl font-black mt-2">{value}</p>
  </div>
);

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getSummary().then(setData);
  }, []);
  if (!data) return <p>Loading...</p>;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short" });

  const tasksData = data.tasks_by_day.map((d) => ({ day: fmtDate(d.date), count: d.count }));
  const habitData = data.habits_by_day.map((d) => ({ day: fmtDate(d.date), count: d.count }));
  const focusData = data.pomodoro_by_day.map((d) => ({
    day: fmtDate(d.date),
    minutes: d.minutes,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={Target}
          label="Goals completed"
          value={`${data.totals.goals_done}/${data.totals.goals_total}`}
          surface="surface-lavender"
          tid="analytics-goals"
        />
        <Stat
          icon={ListChecks}
          label="Tasks done"
          value={`${data.totals.tasks_done}/${data.totals.tasks_total}`}
          surface="surface-mint"
          tid="analytics-tasks"
        />
        <Stat
          icon={Flame}
          label="Habits tracked"
          value={data.totals.habits_total}
          surface="surface-peach"
          tid="analytics-habits"
        />
        <Stat
          icon={Timer}
          label="Focus min (7d)"
          value={data.totals.pomodoro_minutes_week}
          surface="surface-sky"
          tid="analytics-focus"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="brut-card p-5">
          <h3 className="text-xl font-black mb-3">Tasks completed (7d)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksData}>
                <CartesianGrid stroke="#0a0a0a22" />
                <XAxis dataKey="day" stroke="#0a0a0a" />
                <YAxis stroke="#0a0a0a" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: "2px solid #000", borderRadius: 6 }}
                />
                <Bar dataKey="count" fill="#10B981" stroke="#000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brut-card p-5 surface-mint">
          <h3 className="text-xl font-black mb-3">Habit logs (7d)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitData}>
                <CartesianGrid stroke="#0a0a0a22" />
                <XAxis dataKey="day" stroke="#0a0a0a" />
                <YAxis stroke="#0a0a0a" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: "2px solid #000", borderRadius: 6 }}
                />
                <Bar dataKey="count" fill="#FF5E5E" stroke="#000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="brut-card p-5 lg:col-span-2 surface-peach">
          <h3 className="text-xl font-black mb-3">Focus minutes (7d)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={focusData}>
                <CartesianGrid stroke="#0a0a0a22" />
                <XAxis dataKey="day" stroke="#0a0a0a" />
                <YAxis stroke="#0a0a0a" />
                <Tooltip
                  contentStyle={{ border: "2px solid #000", borderRadius: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#3B82F6"
                  strokeWidth={4}
                  dot={{ r: 5, stroke: "#000", strokeWidth: 2, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="brut-card p-5">
        <h3 className="text-xl font-black mb-3">Habit streaks</h3>
        {data.streaks.length === 0 ? (
          <p className="text-sm text-neutral-700">No habits yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.streaks.map((s) => (
              <div
                key={s.habit_id}
                className="border-2 border-black rounded-md p-3 flex items-center justify-between bg-white"
              >
                <span className="font-bold">{s.title}</span>
                <span className="inline-flex items-center gap-1 font-mono font-black">
                  <Flame className="w-4 h-4 text-[#FF5E5E]" /> {s.streak}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
