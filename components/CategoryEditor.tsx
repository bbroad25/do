"use client";

import { useState } from "react";
import SubHeader from "./SubHeader";
import SheetShell from "./SheetShell";
import { Icon, ICON_KEYS } from "@/lib/icons";
import type { Category, IconKey } from "@/lib/types";

export default function CategoryEditor({
  onBack,
  categories,
  onRename,
  onMove,
  onDelete,
  onAdd,
}: {
  onBack: () => void;
  categories: Category[];
  onRename: (id: string, label: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDelete: (id: string) => void;
  onAdd: (label: string, icon: IconKey) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditValue(cat.label);
  }
  function commitEdit() {
    if (editingId) {
      const v = editValue.trim();
      if (v) onRename(editingId, v);
    }
    setEditingId(null);
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader title="Categories" onBack={onBack} />
      <div className="do-scroll flex-1 overflow-y-auto px-5 pb-6 pt-2">
        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            className="flex items-center gap-2.5 rounded-xl p-2.5 mb-2"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}
          >
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 30, height: 30, background: "var(--bg-panel-2)", color: "var(--text-muted)" }}
            >
              <Icon icon={cat.icon} size={15} />
            </div>

            {editingId === cat.id ? (
              <input
                autoFocus
                className="flex-1 min-w-0 bg-transparent text-[13.5px] py-0.5"
                style={{ border: "none", borderBottom: "1px solid var(--hairline)", color: "var(--text-primary)" }}
                value={editValue}
                maxLength={18}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => e.key === "Enter" && commitEdit()}
              />
            ) : (
              <button
                className="flex-1 min-w-0 text-left bg-transparent border-none text-[13.5px] overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                style={{ color: "var(--text-primary)" }}
                onClick={() => startEdit(cat)}
              >
                {cat.label}
              </button>
            )}

            <div className="flex gap-1 flex-shrink-0">
              <button className="icon-btn-sm" disabled={idx === 0} onClick={() => onMove(cat.id, -1)} aria-label="Move up">
                <svg viewBox="0 0 24 24" width={13} height={13} stroke="currentColor" fill="none" strokeWidth={1.8} strokeLinecap="round"><path d="M6 15l6-6 6 6" /></svg>
              </button>
              <button className="icon-btn-sm" disabled={idx === categories.length - 1} onClick={() => onMove(cat.id, 1)} aria-label="Move down">
                <svg viewBox="0 0 24 24" width={13} height={13} stroke="currentColor" fill="none" strokeWidth={1.8} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <button className="icon-btn-sm" disabled={categories.length <= 2} onClick={() => onDelete(cat.id)} aria-label="Delete">
                <svg viewBox="0 0 24 24" width={13} height={13} stroke="currentColor" fill="none" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" /></svg>
              </button>
            </div>
          </div>
        ))}

        <button
          className="w-full rounded-xl py-3 text-[13px] mt-1"
          style={{ border: "1px dashed var(--hairline)", background: "none", color: "var(--text-muted)" }}
          onClick={() => setAddOpen(true)}
        >
          + add a category
        </button>
      </div>

      <AddCategorySheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(label, icon) => {
          onAdd(label, icon);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

function AddCategorySheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string, icon: IconKey) => void;
}) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<IconKey>("flag");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTitle("");
      setIcon("flag");
    }
  }

  return (
    <SheetShell open={open} onClose={onClose}>
      <h3 className="font-display text-lg font-semibold mb-3.5">New category</h3>
      <div className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>what do you call it</div>
      <input
        type="text"
        className="field-input"
        placeholder="e.g. side project"
        maxLength={18}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus={open}
      />
      <div className="text-[11px] mt-3.5 mb-1.5" style={{ color: "var(--text-muted)" }}>pick an icon</div>
      <div className="grid grid-cols-5 gap-2">
        {ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setIcon(key)}
            className="flex items-center justify-center rounded-[10px]"
            style={{
              aspectRatio: "1 / 1",
              border: `1px solid ${icon === key ? "var(--accent)" : "var(--hairline)"}`,
              background: icon === key ? "var(--accent)" : "var(--bg-deep)",
              color: icon === key ? "var(--accent-ink)" : "var(--text-muted)",
            }}
          >
            <Icon icon={key} size={18} />
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 mt-4.5">
        <button className="btn" onClick={onClose}>cancel</button>
        <button
          className="btn primary"
          onClick={() => {
            const v = title.trim();
            if (v) onAdd(v, icon);
          }}
        >
          add category
        </button>
      </div>
    </SheetShell>
  );
}
