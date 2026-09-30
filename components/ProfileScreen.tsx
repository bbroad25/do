"use client";

import SubHeader from "./SubHeader";
import type { Profile, Task } from "@/lib/types";

export default function ProfileScreen({
  onBack,
  profile,
  tasks,
  onNameChange,
}: {
  onBack: () => void;
  profile: Profile;
  tasks: Task[];
  onNameChange: (name: string) => void;
}) {
  const initial = (profile.name || "").trim().charAt(0).toUpperCase() || "?";
  const doneCount = tasks.filter((t) => t.done).length;
  const openCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader title="Profile" onBack={onBack} />
      <div className="do-scroll flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <div
          className="mx-auto flex items-center justify-center rounded-full font-display italic font-semibold"
          style={{
            width: 64,
            height: 64,
            margin: "6px auto 16px",
            background: "linear-gradient(155deg,#ff8a75,var(--accent))",
            color: "var(--accent-ink)",
            fontSize: 26,
          }}
        >
          {initial}
        </div>

        <div className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>your name</div>
        <input
          type="text"
          className="field-input"
          placeholder="add your name"
          maxLength={30}
          value={profile.name}
          onChange={(e) => onNameChange(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2.5 mt-4.5">
          <StatCard value={profile.streak} label="day streak" />
          <StatCard value={profile.best_streak} label="best streak" />
          <StatCard value={doneCount} label="done all-time" />
          <StatCard value={openCount} label="still open" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="text-center rounded-2xl p-3.5"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}
    >
      <b className="block font-display font-semibold text-[22px]">{value}</b>
      <span className="text-[10.5px]" style={{ color: "var(--text-muted)", letterSpacing: "0.03em" }}>{label}</span>
    </div>
  );
}
