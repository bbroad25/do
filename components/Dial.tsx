"use client";

import { useRef, useState } from "react";
import { Icon } from "@/lib/icons";
import type { Category } from "@/lib/types";

function angleFromCenter(clientX: number, clientY: number, rect: DOMRect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const fromTop = (deg + 90 + 360) % 360;
  return { fromTop, dist: Math.sqrt(dx * dx + dy * dy) };
}

export default function Dial({
  categories,
  onSelect,
  counts,
}: {
  categories: Category[];
  onSelect: (categoryId: string, via: "drag" | "tap" | "key") => void;
  /** when a time filter is active: how many open tasks in each category fit it */
  counts?: Record<string, number>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [puckPos, setPuckPos] = useState({ x: 0, y: 0 });
  const [nearId, setNearId] = useState<string | null>(null);
  const movedRef = useRef(false);

  const n = categories.length;

  function nearestCategory(angleDeg: number): Category | null {
    if (n === 0) return null;
    const step = 360 / n;
    const idx = Math.round(angleDeg / step) % n;
    return categories[idx];
  }

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    movedRef.current = false;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const res = angleFromCenter(e.clientX, e.clientY, rect);
    const maxR = rect.width * 0.36;
    const r = Math.min(res.dist, maxR);
    if (res.dist > 14) movedRef.current = true;
    const rad = ((res.fromTop - 90) * Math.PI) / 180;
    setPuckPos({ x: Math.cos(rad) * r, y: Math.sin(rad) * r });
    const near = res.dist > 30 ? nearestCategory(res.fromTop) : null;
    setNearId(near ? near.id : null);
  }

  function endDrag(e: React.PointerEvent) {
    if (!dragging || !wrapRef.current) return;
    setDragging(false);
    setPuckPos({ x: 0, y: 0 });
    const rect = wrapRef.current.getBoundingClientRect();
    const res = angleFromCenter(e.clientX, e.clientY, rect);
    setNearId(null);
    if (movedRef.current && res.dist > 55) {
      const near = nearestCategory(res.fromTop);
      if (near) onSelect(near.id, "drag");
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div
        ref={wrapRef}
        className="do-dial relative"
        style={{ aspectRatio: "1 / 1" }}
      >
        <div
          className="absolute rounded-full"
          style={{ inset: "8%", border: "1px dashed #2c2f3b" }}
        />

        {categories.map((cat, i) => {
          const angle = n > 0 ? i * (360 / n) : 0;
          const near = nearId === cat.id;
          const count = counts ? counts[cat.id] ?? 0 : null;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id, "tap")}
              className="absolute flex flex-col items-center justify-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
              style={{
                top: "50%",
                left: "50%",
                width: 76,
                height: 76,
                color: near ? "var(--text-primary)" : "var(--text-muted)",
                opacity: count === 0 ? 0.35 : 1,
                transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(calc(-1 * var(--dial-r))) rotate(${-angle}deg) scale(${
                  near ? 1.12 : 1
                })`,
              }}
            >
              <span className="relative inline-flex">
                <Icon icon={cat.icon} size={22} />
                {count !== null && count > 0 && (
                  <span
                    className="absolute flex items-center justify-center rounded-full font-semibold"
                    style={{
                      top: -7,
                      right: -11,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      fontSize: 10,
                      background: "var(--accent)",
                      color: "var(--accent-ink)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </span>
              <span
                className="text-[11.5px] max-w-[74px] overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ letterSpacing: "0.01em" }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}

        <div
          role="button"
          tabIndex={0}
          aria-label="Drag to choose"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && categories[0]) {
              onSelect(categories[0].id, "key");
            }
          }}
          className="absolute flex items-center justify-center rounded-full font-display italic select-none"
          style={{
            top: "50%",
            left: "50%",
            width: 64,
            height: 64,
            marginTop: -32,
            marginLeft: -32,
            background: "linear-gradient(155deg,#ff8a75,var(--accent))",
            boxShadow: "0 12px 26px -8px rgba(255,107,94,.55)",
            color: "var(--accent-ink)",
            fontWeight: 600,
            fontSize: 15,
            cursor: dragging ? "grabbing" : "grab",
            touchAction: "none",
            transform: `translate(${puckPos.x}px, ${puckPos.y}px)`,
            transition: dragging ? "none" : "transform .18s cubic-bezier(.2,.8,.2,1)",
            zIndex: 5,
          }}
        >
          do
        </div>
      </div>
    </div>
  );
}
