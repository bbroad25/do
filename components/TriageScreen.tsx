"use client";

import { useState } from "react";
import SubHeader from "./SubHeader";
import Dial from "./Dial";
import { dueLabel, type Category, type Task } from "@/lib/types";

/**
 * Imported tasks land here untriaged. One card at a time: drag the puck toward
 * the part of life it belongs to (the same gesture as the home screen), or
 * mark it done / skip / delete.
 */
export default function TriageScreen({
  tasks,
  categories,
  onBack,
  onTriage,
  onDone,
  onDelete,
}: {
  tasks: Task[];
  categories: Category[];
  onBack: () => void;
  onTriage: (taskId: string, categoryId: string) => void;
  onDone: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const [skip, setSkip] = useState(0);
  const task = tasks.length ? tasks[skip % tasks.length] : null;
  const meta = task ? [task.source && task.source !== "manual" ? task.source : null, task.source_list, dueLabel(task.due_at)].filter(Boolean) : [];

  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader
        title="Sort"
        onBack={onBack}
        backLabel="home"
        right={
          <div className="text-[12px] text-right" style={{ width: 44, color: "var(--text-muted)" }}>
            {tasks.length ? `${(skip % tasks.length) + 1} / ${tasks.length}` : ""}
          </div>
        }
      />

      {!task ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-2">
          <div className="font-display italic text-[24px]">All sorted.</div>
          <p className="text-[13px] m-0" style={{ color: "var(--text-muted)" }}>
            New imports will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="do-scroll px-5 pt-3 flex-shrink-0">
            <div
              className="rounded-2xl p-4"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}
            >
              {meta.length > 0 && (
                <div className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)", letterSpacing: "0.03em" }}>
                  {meta.join(" · ")}
                </div>
              )}
              <div className="font-display text-[20px] font-semibold leading-snug">{task.title}</div>
              {task.notes && (
                <p
                  className="text-[12.5px] mt-2 mb-0 overflow-hidden"
                  style={{ color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
                >
                  {task.notes}
                </p>
              )}
            </div>
            <p className="text-[12.5px] mt-3 mb-0 text-center" style={{ color: "var(--text-muted)" }}>
              Drag toward where it lives, or tap a category.
            </p>
          </div>

          <Dial categories={categories} onSelect={(catId) => onTriage(task.id, catId)} />

          <div
            className="do-scroll flex gap-2.5 px-5 flex-shrink-0"
            style={{ paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))" }}
          >
            <button className="btn danger" onClick={() => onDelete(task.id)}>delete</button>
            <button className="btn" onClick={() => setSkip((s) => s + 1)} disabled={tasks.length < 2}>skip</button>
            <button className="btn" onClick={() => onDone(task.id)}>already done</button>
          </div>
        </>
      )}
    </div>
  );
}
