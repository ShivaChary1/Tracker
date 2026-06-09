import React, { useRef, useState } from "react";
import { API } from "../lib/api";
import { Send, Sparkles, User } from "lucide-react";

const STARTERS = [
  "Help me plan a productive week.",
  "I'm feeling stuck. Give me a motivational nudge.",
  "Break my goals into a daily schedule.",
  "Review my week and suggest improvements.",
];

export default function Coach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);

  const scroll = () => {
    setTimeout(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 30);
  };

  const send = async (text) => {
    const msg = text ?? input;
    if (!msg.trim() || streaming) return;
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    scroll();

    try {
      const res = await fetch(`${API}/coach/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, session_id: sessionRef.current }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          try {
            const obj = JSON.parse(json);
            if (obj.session_id) sessionRef.current = obj.session_id;
            if (obj.delta) {
              setMessages((m) => {
                const arr = [...m];
                arr[arr.length - 1] = {
                  role: "assistant",
                  content: arr[arr.length - 1].content + obj.delta,
                };
                return arr;
              });
              scroll();
            }
            if (obj.error) {
              setMessages((m) => {
                const arr = [...m];
                arr[arr.length - 1] = {
                  role: "assistant",
                  content: "⚠️ " + obj.error,
                };
                return arr;
              });
            }
          } catch (_) {
            /* ignore parse errors */
          }
        }
      }
    } catch (e) {
      setMessages((m) => [
        ...m.slice(0, -1),
        { role: "assistant", content: "Coach is unavailable. Try again." },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="brut-card p-0 flex flex-col h-[78vh]">
        <div className="px-5 py-4 border-b-2 border-black flex items-center gap-2 surface-peach">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-xl font-black">Compass Coach</h3>
          <span className="ml-auto label-tiny text-neutral-700">Claude Sonnet 4.5</span>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto p-5 space-y-4"
          data-testid="coach-messages"
        >
          {messages.length === 0 && (
            <div className="surface-lavender border-2 border-black rounded-md p-5">
              <p className="font-bold">Hey, I'm Compass.</p>
              <p className="text-sm mt-1">
                Ask me to plan your week, untangle a goal, or pep you up.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role !== "user" && (
                <div className="w-9 h-9 border-2 border-black rounded-md flex items-center justify-center bg-[#FF5E5E] text-white shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] border-2 border-black rounded-md p-3 whitespace-pre-wrap leading-relaxed ${
                  m.role === "user" ? "surface-mint" : "bg-white"
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              </div>
              {m.role === "user" && (
                <div className="w-9 h-9 border-2 border-black rounded-md flex items-center justify-center bg-black text-white shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t-2 border-black p-3 flex gap-2 bg-white"
        >
          <input
            data-testid="coach-input"
            className="brut-input"
            placeholder="Ask Compass anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
          />
          <button
            data-testid="coach-send"
            className="brut-btn brut-btn-primary"
            disabled={streaming}
          >
            <Send className="w-4 h-4" />
            {streaming ? "..." : "Send"}
          </button>
        </form>
      </div>

      <div className="brut-card p-5 surface-mint h-fit">
        <h4 className="font-black text-lg">Starters</h4>
        <div className="mt-3 space-y-2">
          {STARTERS.map((s, i) => (
            <button
              key={i}
              data-testid={`coach-starter-${i}`}
              onClick={() => send(s)}
              disabled={streaming}
              className="w-full text-left text-sm border-2 border-black rounded-md p-3 bg-white hover:surface-peach"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
