'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A note the mentor types straight onto the slide.
 *
 * Positions are stored as percentages of the stage, not pixels, so a note
 * written on a laptop stays where it was put when the deck goes fullscreen on
 * the projector. Drag moves it, the corner handle resizes it, and the palette's
 * colour applies to whichever note is selected.
 */

export interface Note {
  id: string;
  /** percentage of the stage, so the note survives a resize */
  x: number;
  y: number;
  /** width as a percentage of the stage */
  w: number;
  size: number;
  color: string;
  text: string;
}

export const NOTE_MIN_W = 8;
export const NOTE_MIN_SIZE = 12;

export default function TextNote({
  note,
  stage,
  selected,
  onSelect,
  onChange,
  onDelete,
}: {
  note: Note;
  /** the element the percentages are measured against */
  stage: HTMLElement | null;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Note>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(!note.text);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const el = area.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  // grow the box to fit what is being typed
  useEffect(() => {
    const el = area.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [note.text, note.size, note.w, editing]);

  const drag = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    if (!stage) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const box = stage.getBoundingClientRect();
    const start = { px: e.clientX, py: e.clientY, x: note.x, y: note.y, w: note.w, size: note.size };
    // capture keeps the drag alive if the pointer leaves the handle, but it is
    // not essential — never let a failed capture abort the drag itself
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - start.px) / box.width) * 100;
      const dy = ((ev.clientY - start.py) / box.height) * 100;

      if (mode === 'move') {
        onChange({
          x: Math.min(98, Math.max(0, start.x + dx)),
          y: Math.min(98, Math.max(0, start.y + dy)),
        });
      } else {
        // dragging right widens the box; dragging down grows the type
        onChange({
          w: Math.min(96, Math.max(NOTE_MIN_W, start.w + dx)),
          size: Math.min(96, Math.max(NOTE_MIN_SIZE, Math.round(start.size + (ev.clientY - start.py) / 4))),
        });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      className={`wb-note${selected ? ' sel' : ''}${editing ? ' editing' : ''}`}
      style={{ left: `${note.x}%`, top: `${note.y}%`, width: `${note.w}%`, color: note.color }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={() => setEditing(true)}
    >
      <span className="wb-note-grip" onPointerDown={(e) => drag(e, 'move')} title="সরান">
        ⠿
      </span>
      <button
        className="wb-note-x"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onDelete}
        title="মুছুন"
      >
        ✕
      </button>

      {editing ? (
        <textarea
          ref={area}
          value={note.text}
          style={{ fontSize: note.size, color: note.color }}
          onChange={(e) => onChange({ text: e.target.value })}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            e.stopPropagation(); // the deck's shortcuts must not fire while typing
            if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
          }}
          placeholder="লিখুন…"
          rows={1}
        />
      ) : (
        <div className="wb-note-text" style={{ fontSize: note.size }}>
          {note.text || 'লিখুন…'}
        </div>
      )}

      <span className="wb-note-size" onPointerDown={(e) => drag(e, 'resize')} title="আকার বদলান" />
    </div>
  );
}
