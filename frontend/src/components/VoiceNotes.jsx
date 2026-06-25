import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Loader2, AudioLines } from "lucide-react";
import { toast } from "sonner";
import {
  getVoiceNotes,
  uploadVoiceNote,
  deleteVoiceNote,
  voiceUrl,
} from "../lib/api";

// Format seconds as M:SS.
function fmt(secs) {
  const s = Math.max(0, Math.round(secs || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Records audio via the browser MediaRecorder API and lists the recordings
 * attached to a saved note. Audio bytes live in GridFS on the backend; this
 * component only ever deals with blobs and metadata.
 *
 * Requires a persisted note: `noteId` is null for brand-new, unsaved drafts.
 */
export default function VoiceNotes({ noteId }) {
  const [items, setItems] = useState([]);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRef = useRef(null); // MediaRecorder
  const chunksRef = useRef([]); // collected audio chunks
  const streamRef = useRef(null); // mic MediaStream (to stop tracks)
  const startRef = useRef(0); // recording start timestamp
  const tickRef = useRef(null); // elapsed-time interval

  const load = async () => {
    if (!noteId) return;
    try {
      setItems(await getVoiceNotes(noteId));
    } catch {
      /* a fresh note may 404 briefly; ignore */
    }
  };

  useEffect(() => {
    setItems([]);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  // Stop mic + timers on unmount.
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    if (!noteId) {
      toast.error("Type something first so the note saves, then record.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error("Recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = handleStop;
      mediaRef.current = mr;
      mr.start();
      startRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      tickRef.current = setInterval(
        () => setElapsed((Date.now() - startRef.current) / 1000),
        250
      );
    } catch {
      toast.error("Couldn't access the microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && recording) mediaRef.current.stop();
  };

  const handleStop = async () => {
    setRecording(false);
    if (tickRef.current) clearInterval(tickRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const duration = (Date.now() - startRef.current) / 1000;
    const blob = new Blob(chunksRef.current, {
      type: mediaRef.current?.mimeType || "audio/webm",
    });
    if (!blob.size) return;
    setUploading(true);
    try {
      const saved = await uploadVoiceNote(noteId, blob, duration);
      setItems((arr) => [...arr, saved]);
    } catch {
      toast.error("Couldn't save the recording.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (v) => {
    try {
      await deleteVoiceNote(v.id);
      setItems((arr) => arr.filter((x) => x.id !== v.id));
    } catch {
      toast.error("Couldn't delete the recording.");
    }
  };

  return (
    <div className="mt-4 border-t-2 border-black pt-3" data-testid="voice-notes">
      <div className="flex items-center gap-2 mb-2">
        <AudioLines className="w-4 h-4" />
        <span className="font-black text-sm">Voice notes</span>
        {items.length > 0 && (
          <span className="text-xs font-bold text-neutral-600">
            ({items.length})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        {!recording ? (
          <button
            type="button"
            data-testid="voice-record-button"
            onClick={startRecording}
            disabled={uploading || !noteId}
            className="brut-btn brut-btn-primary disabled:opacity-50"
            title={!noteId ? "Save the note first" : "Record"}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {uploading ? "Saving…" : "Record"}
          </button>
        ) : (
          <button
            type="button"
            data-testid="voice-stop-button"
            onClick={stopRecording}
            className="brut-btn brut-btn-dark"
          >
            <Square className="w-4 h-4 fill-current" /> Stop
          </button>
        )}
        {recording && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-red-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            {fmt(elapsed)}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((v) => (
            <li
              key={v.id}
              data-testid={`voice-item-${v.id}`}
              className="flex items-center gap-2 p-2 border-2 border-black rounded-md bg-white/60"
            >
              <audio
                controls
                preload="none"
                src={voiceUrl(v.file_id)}
                className="h-9 flex-1 min-w-0"
              />
              {v.duration_seconds > 0 && (
                <span className="text-xs font-bold text-neutral-600 shrink-0">
                  {fmt(v.duration_seconds)}
                </span>
              )}
              <button
                type="button"
                data-testid={`voice-delete-${v.id}`}
                onClick={() => remove(v)}
                className="p-1.5 border-2 border-black rounded-md hover:hard-shadow shrink-0"
                title="Delete recording"
                aria-label="Delete recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
