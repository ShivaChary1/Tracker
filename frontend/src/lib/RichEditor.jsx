import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * A lightweight WYSIWYG editor backed by a contentEditable div. It stores and
 * emits HTML, so formatting (bold, headings, lists…) renders live in the editor
 * itself rather than showing raw markup.
 *
 * It is intentionally *uncontrolled*: the DOM is the source of truth while you
 * type (re-writing innerHTML on every keystroke would fight the caret). We only
 * push `html` into the DOM when `noteKey` changes (i.e. a different note is
 * opened), which keeps the cursor stable during editing.
 */
export const RichEditor = forwardRef(function RichEditor(
  { html, noteKey, onChange, placeholder, className, "data-testid": testId },
  ref
) {
  const divRef = useRef(null);
  useImperativeHandle(ref, () => divRef.current, []);

  useEffect(() => {
    if (divRef.current && divRef.current.innerHTML !== (html || "")) {
      divRef.current.innerHTML = html || "";
    }
    // only resync when the open note changes, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteKey]);

  return (
    <div
      ref={divRef}
      data-testid={testId}
      contentEditable
      suppressContentEditableWarning
      onInput={() => onChange(divRef.current.innerHTML)}
      data-placeholder={placeholder}
      className={`rich-editor ${className || ""}`}
    />
  );
});
