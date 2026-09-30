"use client";

import { useState } from "react";
import SheetShell from "./SheetShell";
import { Icon } from "@/lib/icons";
import { relTime } from "@/lib/constants";
import { dueLabel, dueToInput, effectiveUrgency, inputToDue, zoneOf, ZONE_COLOR, type Category, type Task } from "@/lib/types";

const EFFORTS: { label: string; value: number }[] = [
  { label: "quick", value: 0.28 },
  { label: "medium", value: 0.5 },
  { label: "deep", value: 0.8 },
];

export function AddTaskSheet({
  open,
  categories,
  defaultCategoryId,
  onClose,
  onSave,
}: {
  open: boolean;
  categories: Category[];
  defaultCategoryId: string | null;
  onClose: () => void;
  onSave: (title: string, categoryId: string, effort: number, dueAt: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? "");
  const [effort, setEffort] = useState(0.5);
  const [due, setDue] = useState("");

  // Reset the form each time the sheet opens. Adjusting state during
  // render (rather than in a useEffect) is the pattern React recommends
  // for "reset state when X changes" — see https://react.dev/learn/you-might-not-need-an-effect
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTitle("");
      setCategoryId(defaultCategoryId ?? categories[0]?.id ?? "");
      setEffort(0.5);
      setDue("");
    }
  }

  function save() {
    const trimmed = title.trim();
    if (!trimmed || !categoryId) return;
    onSave(trimmed, categoryId, effort, inputToDue(due));
  }

  return (
    <SheetShell open={open} onClose={onClose}>
      <h3 className="font-display text-lg font-semibold mb-3.5">New thing to do</h3>

      <div className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>what is it</div>
      <input
        type="text"
        className="field-input"
        placeholder="e.g. call the roofer"
        maxLength={60}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus={open}
      />

      <div className="text-[11px] mt-3.5 mb-1.5" style={{ color: "var(--text-muted)" }}>where it lives</div>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`chip ${categoryId === cat.id ? "selected" : ""}`}
            onClick={() => setCategoryId(cat.id)}
          >
            <Icon icon={cat.icon} size={13} />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="text-[11px] mt-3.5 mb-1.5" style={{ color: "var(--text-muted)" }}>how much of a lift</div>
      <div className="flex flex-wrap gap-1.5">
        {EFFORTS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            className={`chip ${effort === opt.value ? "selected" : ""}`}
            onClick={() => setEffort(opt.value)}
          >
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="text-[11px] mt-3.5 mb-1.5" style={{ color: "var(--text-muted)" }}>
        due date <span style={{ color: "var(--text-faint)" }}>(optional — it drifts toward urgent as the day nears)</span>
      </div>
      <input
        type="date"
        className="field-input"
        style={{ colorScheme: "dark" }}
        value={due}
        onChange={(e) => setDue(e.target.value)}
      />

      <div className="flex gap-2.5 mt-4.5">
        <button className="btn" onClick={onClose}>cancel</button>
        <button className="btn primary" onClick={save}>add to the map</button>
      </div>
    </SheetShell>
  );
}

export function TaskDetailSheet({
  open,
  task,
  categoryLabel,
  onClose,
  onDelete,
  onMarkDone,
  onSetDue,
}: {
  open: boolean;
  task: Task | null;
  categoryLabel: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onMarkDone: (id: string) => void;
  onSetDue: (id: string, dueAt: string | null) => void;
}) {
  if (!task) {
    return (
      <SheetShell open={false} onClose={onClose}>
        {null}
      </SheetShell>
    );
  }
  const zone = zoneOf({ urgency: effectiveUrgency(task), importance: task.importance });
  const due = dueLabel(task.due_at);

  return (
    <SheetShell open={open} onClose={onClose}>
      <div className="flex items-center gap-1.5 mb-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="w-2 h-2 rounded-full" style={{ background: ZONE_COLOR[zone] }} />
        <span>{zone} · {categoryLabel}{due ? ` · ${due}` : ""}</span>
      </div>
      <h3 className="font-display text-lg font-semibold mb-3.5">{task.title}</h3>
      {task.notes && (
        <p className="text-[12.5px] -mt-2 mb-3.5" style={{ color: "var(--text-muted)" }}>{task.notes}</p>
      )}
      <div className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>due date</div>
      <div className="flex gap-2 mb-4">
        <input
          type="date"
          className="field-input"
          style={{ colorScheme: "dark" }}
          value={dueToInput(task.due_at)}
          onChange={(e) => onSetDue(task.id, inputToDue(e.target.value))}
        />
        {task.due_at && (
          <button className="btn" style={{ flex: "none", padding: "0 14px" }} onClick={() => onSetDue(task.id, null)}>
            clear
          </button>
        )}
      </div>
      <div className="flex gap-2.5">
        <button className="btn danger" onClick={() => onDelete(task.id)}>remove</button>
        <button className="btn primary" onClick={() => onMarkDone(task.id)}>mark done</button>
      </div>
    </SheetShell>
  );
}

export function ArchiveSheet({
  open,
  tasks,
  categoryLabel,
  onClose,
  onRestore,
  onDelete,
}: {
  open: boolean;
  tasks: Task[];
  categoryLabel: string;
  onClose: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...tasks].sort(
    (a, b) => new Date(b.done_at ?? 0).getTime() - new Date(a.done_at ?? 0).getTime()
  );

  return (
    <SheetShell open={open} onClose={onClose}>
      <h3 className="font-display text-lg font-semibold mb-3.5">Archive</h3>
      {sorted.length === 0 ? (
        <div className="text-center py-5 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          Nothing archived in {categoryLabel} yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2.5 rounded-xl p-2.5"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] overflow-hidden text-ellipsis whitespace-nowrap">{t.title}</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>{relTime(t.done_at)}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button className="icon-btn-sm" aria-label="Restore" onClick={() => onRestore(t.id)}>
                  <svg viewBox="0 0 24 24" width={13} height={13} stroke="currentColor" fill="none" strokeWidth={1.8} strokeLinecap="round">
                    <path d="M4 4v6h6" />
                    <path d="M20 20a9 9 0 0 0-15.3-6.4L4 10" />
                  </svg>
                </button>
                <button className="icon-btn-sm" aria-label="Delete" onClick={() => onDelete(t.id)}>
                  <svg viewBox="0 0 24 24" width={13} height={13} stroke="currentColor" fill="none" strokeWidth={1.8} strokeLinecap="round">
                    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2.5 mt-4.5">
        <button className="btn" style={{ flex: "none", padding: "10px 16px" }} onClick={onClose}>close</button>
      </div>
    </SheetShell>
  );
}
