"use client";

import { useRef, useState } from "react";
import { dueLabel, effectiveUrgency, zoneOf, ZONE_COLOR, type Task } from "@/lib/types";

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default function Board({
  tasks,
  completingIds,
  isDimmed,
  onCommitPosition,
  onTapTask,
  onAddClick,
}: {
  tasks: Task[];
  completingIds?: Set<string>;
  /** tasks outside the active time filter stay visible but recede */
  isDimmed?: (task: Task) => boolean;
  onCommitPosition: (taskId: string, urgency: number, importance: number) => void;
  onTapTask: (task: Task) => void;
  onAddClick: () => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ urgency: number; importance: number } | null>(null);
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  function startDrag(e: React.PointerEvent, task: Task, sizePx: number) {
    (e.target as Element).setPointerCapture(e.pointerId);
    movedRef.current = false;
    setDragId(task.id);
    setDragPos({ urgency: effectiveUrgency(task), importance: task.importance });
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - (rect.left + rect.width / 2),
      y: e.clientY - (rect.top + rect.height / 2),
    };
    void sizePx;
  }

  function moveDrag(e: React.PointerEvent) {
    if (!dragId || !gridRef.current) return;
    movedRef.current = true;
    const gr = gridRef.current.getBoundingClientRect();
    let x = (e.clientX - offsetRef.current.x - gr.left) / gr.width;
    let y = (e.clientY - offsetRef.current.y - gr.top) / gr.height;
    x = Math.max(0.03, Math.min(0.97, x));
    y = Math.max(0.03, Math.min(0.97, y));
    setDragPos({ urgency: x, importance: 1 - y });
  }

  function endDrag(task: Task) {
    if (dragId === task.id && dragPos) {
      if (movedRef.current) {
        onCommitPosition(task.id, dragPos.urgency, dragPos.importance);
      } else {
        onTapTask(task);
      }
    }
    setDragId(null);
    setDragPos(null);
  }

  return (
    <>
      <div className="flex justify-between px-[22px] pt-[2px]" style={{ color: "var(--text-faint)", fontSize: 10.5, letterSpacing: "0.03em" }}>
        <span>not important</span>
        <span>important</span>
      </div>

      <div
        ref={gridRef}
        className="relative flex-1 mx-[18px] mt-[10px] mb-1 rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}
      >
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "var(--hairline)" }} />
        <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: "var(--hairline)" }} />

        <div className="absolute top-0 right-0 p-2 pointer-events-none" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--q-now)" }}>now</div>
        <div className="absolute top-0 left-0 p-2 pointer-events-none" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--q-next)" }}>next</div>
        <div className="absolute bottom-0 right-0 p-2 pointer-events-none" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--q-quick)" }}>squeeze in</div>
        <div className="absolute bottom-0 left-0 p-2 pointer-events-none" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--text-faint)" }}>later</div>

        {tasks.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center text-center p-8"
            style={{ color: "var(--text-faint)", fontSize: 12.5, lineHeight: 1.5 }}
          >
            Nothing here. Tap + to put something on the map.
          </div>
        )}

        {tasks.map((task) => {
          const placed = { urgency: effectiveUrgency(task), importance: task.importance };
          const live = dragId === task.id && dragPos ? dragPos : placed;
          // ring = a due date is currently pulling this task right of where you put it
          const dueDriven = dragId !== task.id && placed.urgency > task.urgency + 0.001;
          const due = dueLabel(task.due_at);
          const size = 30 + task.effort * 34;
          const zone = zoneOf(live);
          const completing = completingIds?.has(task.id) ?? false;
          return (
            <div
              key={task.id}
              onPointerDown={(e) => !completing && startDrag(e, task, size)}
              onPointerMove={moveDrag}
              onPointerUp={() => endDrag(task)}
              onPointerCancel={() => endDrag(task)}
              title={due ? `${task.title} (${due})` : task.title}
              className="absolute flex items-center justify-center text-center select-none rounded-full"
              style={{
                animation: completing ? "pop 0.45s ease forwards" : undefined,
                opacity: dragId !== task.id && isDimmed?.(task) ? 0.22 : 1,
                left: `${live.urgency * 100}%`,
                top: `${(1 - live.importance) * 100}%`,
                width: size,
                height: size,
                transform: "translate(-50%,-50%)",
                background: ZONE_COLOR[zone],
                color: "#0e0f13",
                fontWeight: 600,
                fontSize: size < 40 ? 8.5 : 10.5,
                lineHeight: 1.1,
                padding: 4,
                cursor: dragId === task.id ? "grabbing" : "grab",
                touchAction: "none",
                boxShadow:
                  (dueDriven ? "0 0 0 2px var(--bg-panel), 0 0 0 3.5px rgba(243,241,235,.8), " : "") +
                  (dragId === task.id
                    ? "0 10px 24px -6px rgba(0,0,0,.6)"
                    : "0 6px 14px -6px rgba(0,0,0,.5)"),
                zIndex: dragId === task.id ? 6 : 1,
              }}
            >
              {size >= 38 ? truncate(task.title, 14) : ""}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between px-[22px] pb-[14px]" style={{ color: "var(--text-faint)", fontSize: 10.5, letterSpacing: "0.03em" }}>
        <span>← not urgent</span>
        <span>urgent →</span>
      </div>

      <button
        aria-label="Add task"
        onClick={onAddClick}
        className="absolute rounded-full flex items-center justify-center"
        style={{
          right: 22,
          bottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
          width: 52,
          height: 52,
          background: "var(--accent)",
          color: "var(--accent-ink)",
          boxShadow: "0 14px 28px -10px rgba(255,107,94,.6)",
          zIndex: 4,
        }}
      >
        <svg viewBox="0 0 24 24" width={22} height={22} stroke="currentColor" fill="none" strokeWidth={2} strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </>
  );
}
