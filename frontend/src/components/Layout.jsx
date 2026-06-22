import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  ListChecks,
  Flame,
  StickyNote,
  CalendarDays,
  Timer,
  BarChart3,
  Sparkles,
  Compass,
  GraduationCap,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, tid: "nav-dashboard" },
  { to: "/goals", label: "Goals", icon: Target, tid: "nav-goals" },
  { to: "/tasks", label: "Tasks", icon: ListChecks, tid: "nav-tasks" },
  { to: "/study-plan", label: "Study Plan", icon: GraduationCap, tid: "nav-study-plan" },
  { to: "/habits", label: "Habits", icon: Flame, tid: "nav-habits" },
  { to: "/notes", label: "Notes", icon: StickyNote, tid: "nav-notes" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, tid: "nav-calendar" },
  { to: "/pomodoro", label: "Focus", icon: Timer, tid: "nav-pomodoro" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, tid: "nav-analytics" },
  { to: "/coach", label: "AI Coach", icon: Sparkles, tid: "nav-coach" },
];

export default function Layout() {
  const loc = useLocation();
  const current = NAV.find((n) => n.to === loc.pathname) || NAV[0];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#FFFBF0" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex w-64 flex-col border-r-2 border-black bg-white sticky top-0 h-screen"
        data-testid="sidebar"
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b-2 border-black">
          <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#FF5E5E] hard-shadow">
            <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black leading-none">Compass</h1>
            <p className="text-xs text-neutral-600 mt-1 tracking-wider uppercase">
              Weekly OS
            </p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-auto">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.tid}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md border-2 font-semibold text-sm transition-all ${
                    isActive
                      ? "bg-black text-white border-black hard-shadow"
                      : "border-transparent hover:border-black hover:bg-[#FFF3E0]"
                  }`
                }
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t-2 border-black">
          <div className="surface-mint border-2 border-black rounded-md p-3">
            <p className="text-xs font-semibold uppercase tracking-wider">Tip</p>
            <p className="text-sm mt-1 leading-snug">
              Pick 3 goals weekly. Less is more.
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="border-b-2 border-black bg-white sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 sm:px-8 py-4">
            <div className="flex items-center gap-3">
              <current.icon className="w-5 h-5" strokeWidth={2.5} />
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {current.label}
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span className="label-tiny text-neutral-600">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden border-t-2 border-black overflow-x-auto flex gap-2 px-4 py-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`${n.tid}-mobile`}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-semibold border-2 border-black rounded-md whitespace-nowrap ${
                    isActive ? "bg-black text-white" : "bg-white"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        </header>
        <div className="p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
