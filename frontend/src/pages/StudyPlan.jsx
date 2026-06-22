import React, { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  ChevronDown,
  CheckCircle2,
  Circle,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "tcs-ipa-study-plan-v1";

// TCS IPA exam prep — 23 Jun → 13 Jul 2026. Topics are kept exactly as written.
const PLAN = [
  {
    phase: "Phase 1 — Easy Wins & Basics",
    surface: "surface-mint",
    days: [
      {
        id: "23jun",
        dow: "Mon",
        date: "23 Jun",
        title: "KYT (Know Your TCS)",
        topics: [
          "TCS facts: founded 1968, HQ Mumbai, EPIC values, $100B cap in 2018",
          "Brands & programmes: TCS iON, Xplore, AIP, NINJA",
          "Major clients, ISO certifications, recent milestones",
          "Solve all 7 KYT questions from the guide",
          "Make KYT flashcards",
        ],
      },
      {
        id: "24jun",
        dow: "Tue",
        date: "24 Jun",
        title: "BizSkill (Business Ethics)",
        topics: [
          "Ethics, email etiquette, workplace behaviour",
          "POSH Act + Internal Complaints Committee (ICC)",
          "Situational rules: escalate internally, protect confidentiality, report phishing, own mistakes, lowest-level-first",
          "Solve all 7 BizSkill questions",
        ],
      },
      {
        id: "25jun",
        dow: "Wed",
        date: "25 Jun",
        title: "Unix / Linux",
        topics: [
          "ls / ls -a, cd, pwd, mkdir, rm",
          "chmod permissions (755 = rwx / r-x / r-x)",
          "grep, find, pipe |",
          "Redirection: > vs >> vs <, and rm -rf",
          "Solve all 7 Unix questions",
        ],
      },
      {
        id: "26jun",
        dow: "Thu",
        date: "26 Jun",
        title: "UI: HTML",
        topics: [
          "Semantic tags: <a>, <nav>, headers",
          'Forms, tables, input types (e.g. type="date")',
          "Inline styles",
          "Solve HTML questions (Q1, 4, 7, 8)",
        ],
      },
      {
        id: "27jun",
        dow: "Fri",
        date: "27 Jun",
        title: "UI: CSS",
        topics: [
          "Box model: Content → Padding → Border → Margin",
          "Selector specificity: #id > .class > tag",
          "Display values (inline-block, block, inline)",
          "Flexbox: justify-content vs align-items",
          "Solve CSS questions (Q2, 3, 5, 6)",
        ],
      },
      {
        id: "28jun",
        dow: "Sat",
        date: "28 Jun",
        title: "Week 1 Review",
        topics: [
          "Mini-test: KYT + BizSkill + Unix + UI",
          "Redo every wrong answer",
          "Update cheat sheet",
        ],
      },
    ],
  },
  {
    phase: "Phase 2 — Core Programming & SQL",
    surface: "surface-sky",
    days: [
      {
        id: "29jun",
        dow: "Sun",
        date: "29 Jun",
        title: "Python Concepts",
        topics: [
          "Data types: list, set, tuple, dict",
          "Operators (**), slicing",
          ".append() and list methods",
          "try / except exception handling",
        ],
      },
      {
        id: "30jun",
        dow: "Mon",
        date: "30 Jun",
        title: "Python MCQs",
        topics: [
          "Control flow, recursion",
          "Complexity basics",
          "Solve 30+ Python MCQs",
        ],
      },
      {
        id: "01jul",
        dow: "Tue",
        date: "1 Jul",
        title: "Java Concepts",
        topics: [
          "Access modifiers: private, public, protected, default",
          "Integer division behaviour",
          "final keyword",
          "Array declaration syntax",
        ],
      },
      {
        id: "02jul",
        dow: "Wed",
        date: "2 Jul",
        title: "Java + OOP",
        topics: [
          "Encapsulation, inheritance, polymorphism, abstraction",
          "Solve 30+ Java MCQs",
        ],
      },
      {
        id: "03jul",
        dow: "Thu",
        date: "3 Jul",
        title: "SQL Part 1",
        topics: [
          "SELECT, WHERE",
          "JOINs: INNER / LEFT / RIGHT",
          "DISTINCT",
          "Practice queries",
        ],
      },
      {
        id: "04jul",
        dow: "Fri",
        date: "4 Jul",
        title: "SQL Part 2",
        topics: [
          "GROUP BY, HAVING",
          "Aggregates: MAX, COUNT",
          "PRIMARY KEY, subqueries",
          "TRUNCATE vs DELETE vs DROP",
        ],
      },
      {
        id: "05jul",
        dow: "Sat",
        date: "5 Jul",
        title: "Week 2 Review",
        topics: [
          "Mixed MCQ test: Python + Java + SQL",
          "Fix weak spots",
          "Update cheat sheet",
        ],
      },
    ],
  },
  {
    phase: "Phase 3 — Coding Practice & Mocks",
    surface: "surface-lavender",
    days: [
      {
        id: "06jul",
        dow: "Sun",
        date: "6 Jul",
        title: "Coding: Strings",
        topics: [
          "Reverse a string (no built-in)",
          "Count vowels",
          "Palindrome check",
          "Character frequency",
        ],
      },
      {
        id: "07jul",
        dow: "Mon",
        date: "7 Jul",
        title: "Coding: Numbers",
        topics: [
          "Prime check (sqrt method)",
          "Fibonacci series",
          "Factorial",
          "Armstrong / sum of digits",
        ],
      },
      {
        id: "08jul",
        dow: "Tue",
        date: "8 Jul",
        title: "Coding: Arrays & Patterns",
        topics: [
          "Second largest element",
          "Sorting",
          "Linear & binary search",
          "Basic pattern printing",
        ],
      },
      {
        id: "09jul",
        dow: "Wed",
        date: "9 Jul",
        title: "Coding: Timed Simulation",
        topics: [
          "Solve 2 fresh problems in 70 min (exam conditions)",
          "Write full working programs",
          "Test edge cases",
          "Note bugs you hit",
        ],
      },
      {
        id: "10jul",
        dow: "Thu",
        date: "10 Jul",
        title: "Full Mock 1",
        topics: [
          "120-min timed mock, all sections",
          "Review every mistake",
          "Mark weak patterns",
        ],
      },
      {
        id: "11jul",
        dow: "Fri",
        date: "11 Jul",
        title: "Full Mock 2",
        topics: [
          "120-min timed mock, all sections",
          "Review every mistake",
          "Drill remaining weak areas",
        ],
      },
      {
        id: "12jul",
        dow: "Sat",
        date: "12 Jul",
        title: "Final Revision (light)",
        topics: [
          "Flashcards: KYT + BizSkill",
          "Unix command sheet",
          "SQL keyword sheet",
          "One easy coding warm-up",
          "Sleep early",
        ],
      },
    ],
  },
  {
    phase: "Exam",
    surface: "surface-peach",
    days: [
      {
        id: "13jul",
        dow: "Sun",
        date: "13 Jul",
        title: "EXAM DAY",
        exam: true,
        topics: [
          "Read both coding problems first",
          "Start with the easier problem",
          "Submit something for partial marks (scored per test case)",
          "Stay calm — it doesn't affect your offer letter now",
        ],
      },
    ],
  },
];

const ALL_DAYS = PLAN.flatMap((p) => p.days);
const TOTAL_TOPICS = ALL_DAYS.reduce((n, d) => n + d.topics.length, 0);

const keyFor = (dayId, i) => `${dayId}:${i}`;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function StudyPlan() {
  const [checked, setChecked] = useState(loadState);
  const [open, setOpen] = useState(() => {
    // Open the day matching today if it's in range, else the first unfinished day.
    return ALL_DAYS[0]?.id;
  });

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
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  );

  const pct = Math.round((totalDone / TOTAL_TOPICS) * 100);

  const reset = () => {
    if (!window.confirm("Reset all study-plan progress?")) return;
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
                TCS IPA — Study Plan
              </h3>
              <p className="text-sm text-neutral-700 mt-1">
                23 Jun → 13 Jul 2026 · 3 hrs/day · One attempt, no reattempt
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="brut-btn !py-1.5 text-sm"
            data-testid="study-reset"
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

      {/* Phases & days */}
      {PLAN.map((phase) => (
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
                data-testid={`study-day-${day.id}`}
                className={`brut-card brut-card-hover overflow-hidden ${
                  complete ? "surface-mint" : day.exam ? phase.surface : ""
                }`}
              >
                {/* Parent task header */}
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
                        {day.dow} {day.date}
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
                          No study
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

                {/* Sub-tasks / checkboxes */}
                {isOpen && (
                  <div className="border-t-2 border-black p-4 pt-3 bg-white/60 space-y-1.5">
                    {day.topics.map((topic, i) => {
                      const on = !!checked[keyFor(day.id, i)];
                      return (
                        <label
                          key={i}
                          data-testid={`study-topic-${day.id}-${i}`}
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
    </div>
  );
}
