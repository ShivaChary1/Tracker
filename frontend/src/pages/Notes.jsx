import React, { useEffect, useMemo, useRef, useState } from "react";
import { getNotes, createNote, updateNote, deleteNote } from "../lib/api";
import {
  Plus,
  Trash2,
  Pin,
  PinOff,
  Search,
  Folder,
  FolderPlus,
  Check,
  Loader2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { RichEditor } from "../lib/RichEditor";
import VoiceNotes from "../components/VoiceNotes";

const COLORS = ["white", "mint", "peach", "lavender", "sky"];
const ALL = "__all__";
const UNFILED = "__unfiled__";

/* ----------------------- helpers ----------------------- */
// Note content is stored as HTML (rich text); strip tags for search & previews.
function htmlToText(html) {
  if (!html) return "";
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

/* ----------------------- search ----------------------- */
// Subsequence test: are all chars of `q` present in `text` in order?
function isSubsequence(q, text) {
  let i = 0;
  for (let j = 0; j < text.length && i < q.length; j++) {
    if (text[j] === q[i]) i++;
  }
  return i === q.length;
}

// Score a note against a query. Returns 0 when it should be excluded.
// Every query term must match somewhere (AND), title matches weigh more than
// content, exact substrings beat fuzzy subsequence matches.
function scoreNote(note, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const terms = q.split(/\s+/);
  const title = (note.title || "").toLowerCase();
  const content = htmlToText(note.content).toLowerCase();
  const folder = (note.folder || "").toLowerCase();
  let score = 0;
  for (const t of terms) {
    let termScore = 0;
    if (title.includes(t)) termScore += title.startsWith(t) ? 12 : 8;
    if (content.includes(t)) termScore += 4;
    if (folder.includes(t)) termScore += 3;
    if (termScore === 0) {
      // fuzzy fallback so typos / partials still surface results
      if (isSubsequence(t, title)) termScore += 2;
      else if (isSubsequence(t, content)) termScore += 1;
    }
    if (termScore === 0) return 0; // term matched nothing -> exclude note
    score += termScore;
  }
  return score;
}

// Wrap the first case-insensitive substring hit of query in a <mark>.
function Highlight({ text, query }) {
  const q = query.trim();
  if (!q || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-300 px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    color: "white",
    pinned: false,
    folder: "",
  });
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState(ALL);
  // Folders the user has created. Persisted so empty folders (with no notes
  // yet) still appear in the rail across reloads.
  const [customFolders, setCustomFolders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("note-folders") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("note-folders", JSON.stringify(customFolders));
  }, [customFolders]);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [editing, setEditing] = useState(false); // false = browse list, true = editor open

  const contentRef = useRef(null); // contentEditable div, for execCommand formatting
  const saveTimer = useRef(null);
  const skipSave = useRef(false); // prevents autosave firing right after loading a note
  const activeRef = useRef(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const load = async () => setNotes(await getNotes());
  useEffect(() => {
    load();
  }, []);

  const loadDraft = (n) => {
    skipSave.current = true;
    if (n) {
      setActive(n);
      setDraft({
        title: n.title,
        content: n.content,
        color: n.color || "white",
        pinned: !!n.pinned,
        folder: n.folder || "",
      });
    } else {
      setActive(null);
      setDraft({
        title: "",
        content: "",
        color: "white",
        pinned: false,
        // new notes default into the folder you're currently viewing
        folder:
          folderFilter === ALL || folderFilter === UNFILED ? "" : folderFilter,
      });
    }
    setSaveState("idle");
  };

  const openNew = () => {
    loadDraft(null);
    setEditing(true);
  };
  const openNote = (n) => {
    loadDraft(n);
    setEditing(true);
  };
  const closeEditor = () => {
    setEditing(false);
    setActive(null);
  };

  // ----------------------- autosave -----------------------
  const persist = async (d) => {
    if (!d.title.trim() && !d.content.trim()) return; // nothing worth saving yet
    const payload = { ...d, title: d.title.trim() || "Untitled" };
    setSaveState("saving");
    try {
      const cur = activeRef.current;
      if (cur) {
        const u = await updateNote(cur.id, payload);
        setActive(u);
        setNotes((arr) => arr.map((x) => (x.id === u.id ? u : x)));
      } else {
        const n = await createNote({ ...payload, tags: [] });
        setActive(n);
        setNotes((arr) => [n, ...arr]);
      }
      setSaveState("saved");
    } catch {
      setSaveState("idle");
      toast.error("Couldn't save note");
    }
  };

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (!draft.title.trim() && !draft.content.trim()) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(draft), 800);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [draft]);

  // immediate-save helpers for actions that shouldn't wait for the debounce
  const patchActive = async (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    if (active) {
      const u = await updateNote(active.id, patch);
      setActive(u);
      setNotes((arr) => arr.map((x) => (x.id === u.id ? u : x)));
    }
  };

  // ----------------------- text formatting (WYSIWYG) -----------------------
  // Run a rich-text command on the live selection inside the contentEditable
  // editor, then sync the resulting HTML back into the draft (autosave path).
  const exec = (command, value) => {
    const el = contentRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, value);
    setDraft((d) => ({ ...d, content: el.innerHTML }));
  };

  const format = (kind) => {
    switch (kind) {
      case "bold":
        return exec("bold");
      case "italic":
        return exec("italic");
      case "strike":
        return exec("strikeThrough");
      case "h1":
        return exec("formatBlock", "<h1>");
      case "h2":
        return exec("formatBlock", "<h2>");
      case "quote":
        return exec("formatBlock", "<blockquote>");
      case "ul":
        return exec("insertUnorderedList");
      case "ol":
        return exec("insertOrderedList");
      case "code": {
        const sel = window.getSelection()?.toString();
        return exec("insertHTML", `<code>${sel || "code"}</code>`);
      }
      case "link": {
        const url = window.prompt("Link URL", "https://");
        if (url) exec("createLink", url);
        return;
      }
      default:
        return;
    }
  };

  const TOOLBAR = [
    { kind: "bold", icon: Bold, label: "Bold" },
    { kind: "italic", icon: Italic, label: "Italic" },
    { kind: "strike", icon: Strikethrough, label: "Strikethrough" },
    { kind: "code", icon: Code, label: "Code" },
    { kind: "h1", icon: Heading1, label: "Heading 1" },
    { kind: "h2", icon: Heading2, label: "Heading 2" },
    { kind: "quote", icon: Quote, label: "Quote" },
    { kind: "ul", icon: List, label: "Bullet list" },
    { kind: "ol", icon: ListOrdered, label: "Numbered list" },
    { kind: "link", icon: LinkIcon, label: "Link" },
  ];

  const togglePin = async (n, e) => {
    e?.stopPropagation();
    const u = await updateNote(n.id, { pinned: !n.pinned });
    setNotes((arr) => arr.map((x) => (x.id === u.id ? u : x)));
    if (active?.id === u.id) {
      setActive(u);
      setDraft((d) => ({ ...d, pinned: u.pinned }));
    }
  };

  const remove = async () => {
    if (!active) return;
    await deleteNote(active.id);
    setNotes((arr) => arr.filter((x) => x.id !== active.id));
    closeEditor();
    toast.success("Note deleted");
  };

  // ----------------------- folders -----------------------
  // Merge user-created folders with any folders referenced by existing notes.
  const folders = useMemo(() => {
    const s = new Set(customFolders);
    notes.forEach((n) => n.folder && s.add(n.folder));
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [notes, customFolders]);

  const newFolder = () => {
    const name = window.prompt("New folder name")?.trim();
    if (!name) return;
    setCustomFolders((f) => (f.includes(name) ? f : [...f, name]));
    setFolderFilter(name); // switch to it so the next new note lands here
  };

  // ----------------------- filtered + ranked list -----------------------
  const visible = useMemo(() => {
    let list = notes;
    if (folderFilter === UNFILED) list = list.filter((n) => !n.folder);
    else if (folderFilter !== ALL)
      list = list.filter((n) => n.folder === folderFilter);

    if (query.trim()) {
      list = list
        .map((n) => ({ n, s: scoreNote(n, query) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.n);
    }
    return list;
  }, [notes, folderFilter, query]);

  // ----------------------- editor view -----------------------
  if (editing) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <button
            data-testid="note-back-button"
            onClick={closeEditor}
            className="brut-btn"
          >
            <ArrowLeft className="w-4 h-4" /> Back to notes
          </button>
          <span
            data-testid="note-save-state"
            className="text-xs font-bold flex items-center gap-1 text-neutral-600"
          >
            {saveState === "saving" && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check className="w-3.5 h-3.5" /> Saved
              </>
            )}
          </span>
          {active && (
            <button
              data-testid="note-delete-button"
              onClick={remove}
              className="brut-btn ml-auto"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>

        <div className={`brut-card p-5 surface-${draft.color}`}>
          <div className="flex items-center gap-2 mb-3">
            <input
              data-testid="note-title-input"
              className="brut-input text-2xl font-black flex-1"
              placeholder="Note title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <button
              data-testid="note-pin-toggle"
              onClick={() => patchActive({ pinned: !draft.pinned })}
              className={`brut-btn ${draft.pinned ? "brut-btn-dark" : ""}`}
              title={draft.pinned ? "Unpin" : "Pin"}
            >
              {draft.pinned ? (
                <Pin className="w-4 h-4 fill-current" />
              ) : (
                <PinOff className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Folder className="w-4 h-4 shrink-0" />
            <input
              data-testid="note-folder-input"
              className="brut-input"
              placeholder="Folder (optional)"
              list="folder-options"
              value={draft.folder}
              onChange={(e) => setDraft({ ...draft, folder: e.target.value })}
            />
            <datalist id="folder-options">
              {folders.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </div>

          {/* formatting toolbar */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {TOOLBAR.map((t) => (
              <button
                key={t.kind}
                type="button"
                data-testid={`note-format-${t.kind}`}
                onMouseDown={(e) => e.preventDefault()} // keep editor selection
                onClick={() => format(t.kind)}
                className="p-1.5 border-2 border-black rounded-md hover:hard-shadow"
                title={t.label}
                aria-label={t.label}
              >
                <t.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <RichEditor
            ref={contentRef}
            noteKey={active?.id || "new"}
            html={draft.content}
            onChange={(value) => setDraft((d) => ({ ...d, content: value }))}
            placeholder="Capture your thoughts… (formatting renders live, auto-saves)"
            data-testid="note-content-input"
            className="brut-input min-h-[50vh] font-medium overflow-auto"
          />

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                data-testid={`note-color-${c}`}
                onClick={() => patchActive({ color: c })}
                className={`w-7 h-7 border-2 border-black rounded-md surface-${c} ${
                  draft.color === c ? "hard-shadow" : ""
                }`}
                aria-label={c}
              />
            ))}
          </div>

          <VoiceNotes noteId={active?.id || null} />
        </div>
      </div>
    );
  }

  // ----------------------- browse view -----------------------
  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-4">
      {/* folders rail */}
      <div className="brut-card p-3 lg:max-h-[78vh] overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="font-black text-sm">Folders</span>
          <button
            data-testid="folder-new-button"
            onClick={newFolder}
            className="p-1 border-2 border-black rounded-md hover:hard-shadow"
            title="New folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
        <ul className="space-y-1">
          {[
            { key: ALL, label: "All notes" },
            { key: UNFILED, label: "Unfiled" },
            ...folders.map((f) => ({ key: f, label: f })),
          ].map((f) => (
            <li key={f.key}>
              <button
                data-testid={`folder-${f.key}`}
                onClick={() => setFolderFilter(f.key)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2 border-2 ${
                  folderFilter === f.key
                    ? "border-black hard-shadow font-bold"
                    : "border-transparent hover:border-black"
                }`}
              >
                <Folder className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{f.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* search + note grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              data-testid="note-search-input"
              className="brut-input pl-9"
              placeholder="Search notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            data-testid="note-new-button"
            onClick={openNew}
            className="brut-btn brut-btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" /> New note
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="brut-card p-10 text-center text-neutral-600">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-bold">{query ? "No matches." : "No notes yet."}</p>
            {!query && (
              <p className="text-sm mt-1">Click “New note” to get started.</p>
            )}
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {visible.map((n) => (
              <li key={n.id}>
                <button
                  data-testid={`note-item-${n.id}`}
                  onClick={() => openNote(n)}
                  className={`w-full h-full text-left p-3 border-2 border-black rounded-md surface-${
                    n.color || "white"
                  } hover:hard-shadow transition-shadow`}
                >
                  <div className="flex items-start gap-2">
                    <p className="font-bold truncate flex-1">
                      <Highlight text={n.title} query={query} />
                    </p>
                    <span
                      data-testid={`note-pin-${n.id}`}
                      onClick={(e) => togglePin(n, e)}
                      className="shrink-0 p-0.5"
                      title={n.pinned ? "Unpin" : "Pin"}
                    >
                      {n.pinned ? (
                        <Pin className="w-4 h-4 fill-black" />
                      ) : (
                        <PinOff className="w-4 h-4 text-neutral-400" />
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-700 mt-1 line-clamp-4">
                    <Highlight text={htmlToText(n.content) || "—"} query={query} />
                  </p>
                  {n.folder && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold border border-black rounded px-1.5 py-0.5">
                      <Folder className="w-3 h-3" />
                      {n.folder}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
