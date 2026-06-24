import React, { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  ChevronDown,
  CheckCircle2,
  Circle,
  RotateCcw,
  Trophy,
  CalendarDays,
  Library,
  Target,
  Code2,
  PlaySquare,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "tcs-ipa-prep-guide-v1";

/* ----------------------------- SCHEDULE DATA ----------------------------- */
// 19 days, 4 hrs/day. Topics kept exactly as written.
const PLAN = [
  {
    phase: "Phase 1 — Coding Foundation (Days 1–7)",
    surface: "surface-mint",
    days: [
      {
        id: "d1",
        dow: "Day 1",
        date: "24 Jun",
        title: "OOP basics + Strings + KYT",
        topics: [
          "Java/Python OOP basics — classes, objects, inheritance, encapsulation (2 hrs)",
          "String problems, 15-mark type — uppercase/lowercase count, palindrome, anagram (1.5 hrs)",
          "KYT — TCS facts: founded 1968, EPIC values, founder, revenue, subsidiaries (30 min)",
        ],
      },
      {
        id: "d2",
        dow: "Day 2",
        date: "25 Jun",
        title: "Arrays + OOP practice + KYT",
        topics: [
          "Array & sorting problems — bubble, selection, binary search, 2D arrays (2 hrs)",
          "OOP coding practice — PYQ 35-mark type: class + method + static logic (1.5 hrs)",
          "KYT — TCS milestones: major clients, ISO certs, Xplore, recent news (30 min)",
        ],
      },
      {
        id: "d3",
        dow: "Day 3",
        date: "26 Jun",
        title: "Collections + SQL basics + BizSkill",
        topics: [
          "Map, collections & recursion — HashMap, ArrayList, factorial, Fibonacci patterns (2 hrs)",
          "SQL basics — SELECT, WHERE, GROUP BY, HAVING, ORDER BY (1.5 hrs)",
          "BizSkill intro — email etiquette, POSH Act, professional ethics scenarios (30 min)",
        ],
      },
      {
        id: "d4",
        dow: "Day 4",
        date: "27 Jun",
        title: "15-mark PYQs + SQL JOINs + BizSkill",
        topics: [
          "PYQ coding — 15-mark problems: 20 past questions on patterns, strings, basic math (2 hrs)",
          "SQL JOINs — INNER, LEFT, RIGHT JOIN + subqueries (1.5 hrs)",
          "BizSkill — situational judgement: client meetings, conflict resolution, teamwork MCQs (30 min)",
        ],
      },
      {
        id: "d5",
        dow: "Day 5",
        date: "28 Jun",
        title: "35-mark PYQs + SQL aggregates/PL-SQL",
        topics: [
          "PYQ coding — 35-mark OOP problems: 20 past questions in plain text editor (2.5 hrs)",
          "SQL — aggregate functions + PL-SQL: COUNT, SUM, AVG, stored procedures, triggers basics (1.5 hrs)",
        ],
      },
      {
        id: "d6",
        dow: "Day 6",
        date: "29 Jun",
        title: "HTML + CSS + coding revision",
        topics: [
          "HTML — semantic tags, forms, tables, inline vs block elements (2 hrs)",
          "CSS — box model, selectors, flex/grid basics, specificity (1.5 hrs)",
          "Coding revision — 10 quick PYQ problems in Notepad (30 min)",
        ],
      },
      {
        id: "d7",
        dow: "Day 7",
        date: "30 Jun",
        title: "Review Day — coding mock + gaps",
        topics: [
          "Full mock — coding only: 2 problems in 70 min, plain Notepad simulation (1.5 hrs)",
          "Gaps fix + SQL PYQs — fix weak spots from mock, SQL MCQ PYQs from GitHub (2 hrs)",
          "KYT + BizSkill MCQ revision — go through PYQ PDF from GitHub MCQ repo (30 min)",
        ],
      },
    ],
  },
  {
    phase: "Phase 2 — MCQ Mastery (Days 8–14)",
    surface: "surface-sky",
    days: [
      {
        id: "d8",
        dow: "Day 8",
        date: "1 Jul",
        title: "Unix + 35-mark OOP PYQs",
        topics: [
          "Unix/Linux commands — ls, cd, mkdir, rm, grep, chmod, chown, find, pipe, redirect (1.5 hrs)",
          "35-mark OOP PYQs — getters/setters, static methods, case-insensitive search patterns (2 hrs)",
          "Unix — shell scripting basics: permissions, variables, loops in bash (30 min)",
        ],
      },
      {
        id: "d9",
        dow: "Day 9",
        date: "2 Jul",
        title: "Java/Python MCQs + JS + PL-SQL",
        topics: [
          "Java/Python MCQs — OOP output questions, exception handling, complexity MCQs (2 hrs)",
          "JavaScript basics — DOM, events, variables, functions, arrays (1.5 hrs)",
          "PL-SQL deep dive — syntax, cursors, trigger logic, commonly tested MCQs (30 min)",
        ],
      },
      {
        id: "d10",
        dow: "Day 10",
        date: "3 Jul",
        title: "MCQ mock + review + coding",
        topics: [
          "Full mock — MCQ section only: 50 MCQs in 50 min from PYQ bank (1.5 hrs)",
          "Score & review — identify which of 6 MCQ sections lost most marks (1 hr)",
          "Coding practice — 3 fresh PYQ problems in plain text editor (1.5 hrs)",
        ],
      },
      {
        id: "d11",
        dow: "Day 11",
        date: "4 Jul",
        title: "Unix MCQs + SQL MCQs + patterns",
        topics: [
          "Unix MCQ PYQs — the fixed pool of ~30 commands tested repeatedly, memorize all (1 hr)",
          "SQL MCQ PYQs + JOIN queries — Love Babbar SQL playlist + PYQs from GitHub (1.5 hrs)",
          "Coding — pattern printing, selection/insertion sort: 10 problems (1.5 hrs)",
        ],
      },
      {
        id: "d12",
        dow: "Day 12",
        date: "5 Jul",
        title: "UI MCQs + BizSkill + exceptions",
        topics: [
          "UI MCQ PYQs — semantic tags, flex vs grid, box model, selectors MCQs (1.5 hrs)",
          "BizSkill — email format, POSH, conflict, client response: full PYQ sets (1 hr)",
          "Coding — exception handling problems: try-catch, custom exceptions, input validation (1.5 hrs)",
        ],
      },
      {
        id: "d13",
        dow: "Day 13",
        date: "6 Jul",
        title: "Full mock + deep review",
        topics: [
          "Full mock — complete 120 min: coding first (70 min) then MCQs (50 min), track score section-wise (2 hrs)",
          "Deep review + gap fix — fix every wrong answer, re-read those topics (2 hrs)",
        ],
      },
      {
        id: "d14",
        dow: "Day 14",
        date: "7 Jul",
        title: "Review Day — all-section sweep",
        topics: [
          "All-section revision — quick sweep: KYT facts sheet, Unix 30 commands, SQL JOIN types, BizSkill scenarios (2 hrs)",
          "Coding — 5 medium OOP problems in Notepad, no autocomplete (2 hrs)",
        ],
      },
    ],
  },
  {
    phase: "Phase 3 — Final Sprint (Days 15–19)",
    surface: "surface-lavender",
    days: [
      {
        id: "d15",
        dow: "Day 15",
        date: "8 Jul",
        title: "Mock #3 + TCS Xplore hands-on",
        topics: [
          "Full mock #3 — 120 min, new PYQ set, target 85+ in this mock (2 hrs)",
          "TCS Xplore hands-on — Java Assessment in real exam interface (2 hrs)",
        ],
      },
      {
        id: "d16",
        dow: "Day 16",
        date: "9 Jul",
        title: "Hardest PYQs + SQL final + KYT",
        topics: [
          "Coding — hardest PYQs: 35-mark OOP with generics, collections, inheritance chains (2 hrs)",
          "SQL + PL-SQL final revision — full question bank sweep, note all patterns (1.5 hrs)",
          "KYT final read — TCS Xplore \"Know Your Organisation\" module (30 min)",
        ],
      },
      {
        id: "d17",
        dow: "Day 17",
        date: "10 Jul",
        title: "Mock #4 + weak-spot fix",
        topics: [
          "Full mock #4 — timed, full exam, Notepad for coding (2 hrs)",
          "Fix remaining weak spots — only sections where you're below 70% accuracy (2 hrs)",
        ],
      },
      {
        id: "d18",
        dow: "Day 18",
        date: "11 Jul",
        title: "Unix + KYT/BizSkill + confidence run",
        topics: [
          "Unix commands — 1-hour power read of all 30 commands cheat sheet (1 hr)",
          "KYT + BizSkill final MCQs — 25 PYQ MCQs from each section (1 hr)",
          "3 coding problems — pick ones you've solved before, confidence run (1.5 hrs)",
          "Logistics — check iON center location, carry documents, sleep early (30 min)",
        ],
      },
      {
        id: "d19",
        dow: "Day 19",
        date: "12 Jul",
        title: "Day Before Exam — light revision",
        topics: [
          "Unix cheat sheet — read once, do not overload (1 hr)",
          "KYT key facts — TCS year 1968, EPIC, founder F.C. Kohli, milestones (30 min)",
          "Complete rest — no new topics, eat well, sleep 8 hours",
        ],
      },
    ],
  },
  {
    phase: "Exam",
    surface: "surface-peach",
    days: [
      {
        id: "d20",
        dow: "Day 20",
        date: "13 Jul",
        title: "EXAM DAY",
        exam: true,
        topics: [
          "Open with coding section (70 min) — solve both problems first, 50 marks locked",
          "MCQ section (50 min) — track approximate score as you go, need 35+ to hit 85",
        ],
      },
    ],
  },
];

const ALL_DAYS = PLAN.flatMap((p) => p.days);
const TOTAL_TOPICS = ALL_DAYS.reduce((n, d) => n + d.topics.length, 0);
const keyFor = (dayId, i) => `${dayId}:${i}`;

/* ----------------------------- RESOURCES DATA ----------------------------- */
const GITHUB_REPOS = [
  ["Arijit-SE/Java-Solutions-TCS-IPA-Questions", "35-mark + 15-mark coding PYQs with full solutions"],
  ["VishalSingh-07/TCS-IPA-Exam-MCQ", "Large MCQ bank covering all 7 sections"],
  ["VishalSingh-07/Important-Java-Program--IPA-15Marks", "Focused 15-mark coding problems"],
  ["VishalSingh-07/Important-Java-Program--IPA-35Marks", "Focused 35-mark OOP coding problems"],
  ["gdvtramarao/TCS-IPA-ITIS-Preparation-Material", "Full PDF collection: topic-wise notes + PYQs"],
  ["DishangMehta11/TCS-iPA", "MCQ PYQ PDF with answers"],
];

const XPLORE = [
  ["Java Learning Path 1", "LinkedIn courses embedded, maps directly to IPA coding"],
  ["Xplore Hands-On", "Real exam-like interface for coding practice — most important for exam feel"],
  ["Know Your Organisation", "30 minutes here = all 5 KYT marks secured"],
  ["Common Community", "Real PYQs shared by fellow joiners"],
  ["Java Assessment", "Full assessment in the actual exam environment"],
];

const YT = [
  ["TCS IPA 15 marks Java playlist", "String, array, map, basic math problems", "https://www.youtube.com/results?search_query=TCS+IPA+15+marks+Java+playlist"],
  ["TCS IPA 35 marks Java playlist", "OOP, arrays, sorting problems", "https://www.youtube.com/results?search_query=TCS+IPA+35+marks+Java+playlist"],
  ["TCS IPA MCQ playlist 2025", "All 7 MCQ sections covered", "https://www.youtube.com/results?search_query=TCS+IPA+MCQ+playlist+2025"],
  ["Love Babbar SQL playlist", "Best resource for SQL joins + aggregate functions", "https://www.youtube.com/results?search_query=Love+Babbar+SQL+playlist"],
  ["W3Schools HTML & CSS", "Quickest reference for the UI section", "https://www.w3schools.com/"],
];

const ARTICLES = [
  ["GeeksforGeeks — How to score 80+ in TCS IPA", "Firsthand account from 82/100 scorer with exact strategy", "https://www.google.com/search?q=How+to+score+80%2B+in+TCS+IPA+geeksforgeeks"],
  ["GUVI blog — Top TCS IPA questions and tips", "Section-wise PYQs with answers highlighted", "https://www.google.com/search?q=GUVI+Top+TCS+IPA+questions+and+tips"],
  ["LeetCode discuss — Complete resources to get 80+ in IPA", "87-mark scorer's full resource list", "https://www.google.com/search?q=Complete+resources+to+get+80%2B+in+IPA+exam+TCS+Xplore+leetcode+discuss"],
  ["Medium — My TCS IPA Exam 2025 Experience (Sravani)", "Exact 15-mark + 35-mark questions from Aug 2025 exam", "https://www.google.com/search?q=My+TCS+IPA+Exam+2025+Experience+Sravani+medium"],
  ["kumarweb28.wixsite.com/kumarweb", "MCQ + coding PYQ solutions with explanations", "https://kumarweb28.wixsite.com/kumarweb"],
];

/* ----------------------------- STRATEGY DATA ----------------------------- */
const RULES = [
  ["Rule 1 — Go to Coding First", "The moment the exam starts, skip MCQs and open coding. Solve both problems. All 4 test cases correct on both = 50 marks locked before you touch a single MCQ. You then only need 35 of 50 MCQs to hit 85."],
  ["Rule 2 — Practice in Notepad from Day 1", "The IPA coding interface is a basic text box — no IntelliJ, VS Code, autocomplete or error highlighting. Write all practice code in Notepad/MS Word with no plugins so exam day feels normal."],
  ["Rule 3 — PYQs are the Actual Exam", "Real TCS IPA questions repeat. 40–50 PYQ coding problems + 100+ MCQ PYQs is what gets people to 85+. Don't spend time on random LeetCode hard problems or new theory."],
  ["Rule 4 — Unix Is the Fastest 5 Marks", "The Unix section draws from a fixed pool of ~30 commands. One focused hour the night before going through the cheat sheet is the single highest-ROI activity in your prep."],
  ["Rule 5 — KYT = 30 Minutes for 5 Free Marks", "Open TCS Xplore → \"Know Your Organisation\", read once. TCS founded 1968, F.C. Kohli first CEO, EPIC = Excellence, Pioneering, Integrity, Customer Centricity."],
  ["Rule 6 — BizSkill Has One Logic", "Every scenario answer is the most professional, ethical, client-first option. Acknowledge and follow up rather than bluff; escalate appropriately rather than ignore."],
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const TABS = [
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "resources", label: "Resources", icon: Library },
  { id: "strategy", label: "Strategy", icon: Target },
];

export default function PrepGuide() {
  const [tab, setTab] = useState("schedule");
  const [checked, setChecked] = useState(loadState);
  const [open, setOpen] = useState(() => ALL_DAYS[0]?.id);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggleTopic = (dayId, i) => {
    const k = keyFor(dayId, i);
    setChecked((c) => ({ ...c, [k]: !c[k] }));
  };

  const dayDone = (day) =>
    day.topics.filter((_, i) => checked[keyFor(day.id, i)]).length;

  const totalDone = useMemo(
    () => ALL_DAYS.reduce((n, d) => n + dayDone(d), 0),
    [checked]
  );

  const pct = Math.round((totalDone / TOTAL_TOPICS) * 100);

  const reset = () => {
    if (!window.confirm("Reset all prep-guide progress?")) return;
    setChecked({});
    toast.success("Progress reset");
  };

  const markDay = (day, value) => {
    setChecked((c) => {
      const next = { ...c };
      day.topics.forEach((_, i) => {
        next[keyFor(day.id, i)] = value;
      });
      return next;
    });
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header / overall progress */}
      <div className="brut-card p-5 surface-peach">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 border-2 border-black rounded-md flex items-center justify-center bg-[#FF5E5E] hard-shadow">
              <GraduationCap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-black leading-none">
                TCS IPA — Prep Guide
              </h3>
              <p className="text-sm text-neutral-700 mt-1">
                19 days · 4 hrs/day · Target 85+ · One attempt, no reattempt
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="brut-btn !py-1.5 text-sm"
            data-testid="prep-reset"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm font-semibold mb-1">
            <span>Overall progress</span>
            <span className="mono">
              {totalDone}/{TOTAL_TOPICS} · {pct}%
            </span>
          </div>
          <div className="w-full h-4 border-2 border-black rounded-md bg-white overflow-hidden">
            <div
              className="h-full bg-black transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`prep-tab-${t.id}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 border-black font-semibold text-sm transition-all ${
                active ? "bg-black text-white hard-shadow" : "bg-white hover:bg-[#FFF3E0]"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* SCHEDULE TAB */}
      {tab === "schedule" &&
        PLAN.map((phase) => (
          <section key={phase.phase} className="space-y-3">
            <h4 className="label-tiny text-neutral-700 px-1">{phase.phase}</h4>

            {phase.days.map((day) => {
              const done = dayDone(day);
              const total = day.topics.length;
              const complete = done === total;
              const isOpen = open === day.id;
              return (
                <div
                  key={day.id}
                  data-testid={`prep-day-${day.id}`}
                  className={`brut-card brut-card-hover overflow-hidden ${
                    complete ? "surface-mint" : day.exam ? phase.surface : ""
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : day.id)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    {day.exam ? (
                      <Trophy className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                    ) : complete ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="mono text-xs font-semibold px-1.5 py-0.5 border-2 border-black rounded bg-white">
                          {day.dow} · {day.date}
                        </span>
                        <span
                          className={`font-bold ${
                            complete ? "line-through opacity-70" : ""
                          }`}
                        >
                          {day.title}
                        </span>
                        {day.exam && (
                          <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 border-2 border-black rounded bg-[#FF5E5E] text-white">
                            Exam
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="mono text-xs font-semibold shrink-0">
                      {done}/{total}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t-2 border-black p-4 pt-3 bg-white/60 space-y-1.5">
                      {day.topics.map((topic, i) => {
                        const on = !!checked[keyFor(day.id, i)];
                        return (
                          <label
                            key={i}
                            data-testid={`prep-topic-${day.id}-${i}`}
                            className="flex items-start gap-3 cursor-pointer group py-1"
                          >
                            <button
                              type="button"
                              onClick={() => toggleTopic(day.id, i)}
                              aria-label="Toggle topic"
                              className="mt-0.5 shrink-0"
                            >
                              {on ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                              )}
                            </button>
                            <span
                              onClick={() => toggleTopic(day.id, i)}
                              className={`text-sm leading-snug ${
                                on ? "line-through opacity-60" : ""
                              }`}
                            >
                              {topic}
                            </span>
                          </label>
                        );
                      })}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => markDay(day, true)}
                          className="brut-btn !py-1 text-xs"
                        >
                          Tick all
                        </button>
                        <button
                          onClick={() => markDay(day, false)}
                          className="brut-btn !py-1 text-xs"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))}

      {/* RESOURCES TAB */}
      {tab === "resources" && (
        <div className="space-y-5">
          <ResourceGroup icon={Code2} title="GitHub Repos (bookmark all)">
            {GITHUB_REPOS.map(([repo, desc]) => (
              <LinkRow
                key={repo}
                href={`https://github.com/${repo}`}
                title={repo}
                desc={desc}
                mono
              />
            ))}
          </ResourceGroup>

          <ResourceGroup icon={GraduationCap} title="Official TCS Platform (TCS Xplore)">
            {XPLORE.map(([name, desc]) => (
              <PlainRow key={name} title={name} desc={desc} />
            ))}
          </ResourceGroup>

          <ResourceGroup icon={PlaySquare} title="YouTube & Reference Sites">
            {YT.map(([name, desc, href]) => (
              <LinkRow key={name} href={href} title={name} desc={desc} />
            ))}
          </ResourceGroup>

          <ResourceGroup icon={FileText} title="Articles & Written Guides">
            {ARTICLES.map(([name, desc, href]) => (
              <LinkRow key={name} href={href} title={name} desc={desc} />
            ))}
          </ResourceGroup>
        </div>
      )}

      {/* STRATEGY TAB */}
      {tab === "strategy" && (
        <div className="space-y-5">
          <div className="brut-card p-5 surface-sky">
            <h4 className="font-black text-lg mb-2">The Core Formula</h4>
            <p className="text-sm leading-relaxed">
              100 marks: 50 Coding (70 min) + 50 MCQs (50 min). Switch between
              sections freely anytime. To score 85 you need{" "}
              <b>50 from coding + 35 from MCQs</b> — only 70% MCQ accuracy once
              coding is done. Very achievable.
            </p>
          </div>

          <div className="space-y-3">
            {RULES.map(([title, body]) => (
              <div key={title} className="brut-card p-4">
                <h5 className="font-bold mb-1">{title}</h5>
                <p className="text-sm leading-relaxed text-neutral-800">{body}</p>
              </div>
            ))}
          </div>

          <div className="brut-card p-5 surface-lavender">
            <h4 className="font-black text-lg mb-2">MCQ Priority</h4>
            <ul className="text-sm leading-relaxed space-y-1.5 list-disc pl-5">
              <li>
                <b>Highest:</b> Java/Python MCQs (15) + SQL/PL-SQL (10) — most
                prep, most marks.
              </li>
              <li>
                <b>Medium:</b> UI HTML/CSS (10) — learnable quickly, consistent
                patterns.
              </li>
              <li>
                <b>Easy marks:</b> KYT (5), Unix (5), BizSkill (5) — fixed,
                repeating patterns.
              </li>
            </ul>
          </div>

          <div className="brut-card p-5 surface-peach">
            <h4 className="font-black text-lg mb-2">On Exam Day</h4>
            <p className="text-sm leading-relaxed">
              Go to coding immediately. Solve the 15-mark problem first (simpler),
              then the 35-mark OOP problem. Switch to MCQs once both are done.
              Mentally track your running score to stay calm. Skip uncertain
              questions and return later. <b>No negative marking — attempt
              everything.</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- small helpers ----------------------------- */
function ResourceGroup({ icon: Icon, title, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon className="w-4 h-4" strokeWidth={2.5} />
        <h4 className="label-tiny text-neutral-700">{title}</h4>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function LinkRow({ href, title, desc, mono }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="brut-card brut-card-hover p-3 flex items-start gap-3 group"
    >
      <ExternalLink className="w-4 h-4 mt-0.5 shrink-0 opacity-60 group-hover:opacity-100" />
      <div className="min-w-0">
        <div className={`font-bold text-sm break-words ${mono ? "mono" : ""}`}>
          {title}
        </div>
        <div className="text-xs text-neutral-700 mt-0.5">{desc}</div>
      </div>
    </a>
  );
}

function PlainRow({ title, desc }) {
  return (
    <div className="brut-card p-3">
      <div className="font-bold text-sm">{title}</div>
      <div className="text-xs text-neutral-700 mt-0.5">{desc}</div>
    </div>
  );
}
