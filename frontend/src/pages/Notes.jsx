import React, { useEffect, useState } from "react";
import { getNotes, createNote, updateNote, deleteNote } from "../lib/api";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["white", "mint", "peach", "lavender", "sky"];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState({ title: "", content: "", color: "white" });

  const load = async () => setNotes(await getNotes());
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setActive(null);
    setDraft({ title: "", content: "", color: "white" });
  };

  const openNote = (n) => {
    setActive(n);
    setDraft({ title: n.title, content: n.content, color: n.color || "white" });
  };

  const save = async () => {
    if (!draft.title.trim()) {
      toast.error("Title required");
      return;
    }
    if (active) {
      const u = await updateNote(active.id, draft);
      setNotes((arr) => arr.map((x) => (x.id === active.id ? u : x)));
      setActive(u);
    } else {
      const n = await createNote({ ...draft, tags: [] });
      setNotes((arr) => [n, ...arr]);
      setActive(n);
    }
    toast.success("Saved");
  };

  const remove = async () => {
    if (!active) return;
    await deleteNote(active.id);
    setNotes((arr) => arr.filter((x) => x.id !== active.id));
    openNew();
  };

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
      <div className="brut-card p-4 max-h-[78vh] overflow-auto">
        <button
          data-testid="note-new-button"
          onClick={openNew}
          className="brut-btn brut-btn-primary w-full"
        >
          <Plus className="w-4 h-4" /> New note
        </button>
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                data-testid={`note-item-${n.id}`}
                onClick={() => openNote(n)}
                className={`w-full text-left p-3 border-2 border-black rounded-md surface-${
                  n.color || "white"
                } ${active?.id === n.id ? "hard-shadow" : ""}`}
              >
                <p className="font-bold truncate">{n.title}</p>
                <p className="text-xs text-neutral-700 mt-1 line-clamp-2">
                  {n.content || "—"}
                </p>
              </button>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="text-sm text-neutral-700">No notes yet.</li>
          )}
        </ul>
      </div>

      <div className={`brut-card p-5 surface-${draft.color}`}>
        <input
          data-testid="note-title-input"
          className="brut-input text-2xl font-black mb-3"
          placeholder="Note title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <textarea
          data-testid="note-content-input"
          className="brut-input min-h-[50vh] font-medium"
          placeholder="Capture your thoughts..."
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        />
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              data-testid={`note-color-${c}`}
              onClick={() => setDraft({ ...draft, color: c })}
              className={`w-7 h-7 border-2 border-black rounded-md surface-${c} ${
                draft.color === c ? "hard-shadow" : ""
              }`}
              aria-label={c}
            />
          ))}
          <button
            data-testid="note-save-button"
            onClick={save}
            className="brut-btn brut-btn-dark ml-auto"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          {active && (
            <button
              data-testid="note-delete-button"
              onClick={remove}
              className="brut-btn"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
