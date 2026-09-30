"use client";

import { useState } from "react";
import SubHeader from "./SubHeader";
import type { Category, IntegrationRow, Profile, Task } from "@/lib/types";

export default function DataScreen({
  onBack,
  profile,
  categories,
  tasks,
  integrations,
  onReset,
}: {
  onBack: () => void;
  profile: Profile;
  categories: Category[];
  tasks: Task[];
  integrations: IntegrationRow[];
  onReset: () => void;
}) {
  const [armed, setArmed] = useState(false);

  function exportBackup() {
    const payload = { profile, categories, tasks, integrations, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "do-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    setArmed(false);
    onReset();
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader title="Data" onBack={onBack} />
      <div className="do-scroll flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <div className="text-[11px] mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>back up</div>
        <p className="text-[12px] mb-2.5" style={{ color: "var(--text-muted)" }}>
          Download a copy of everything on your map right now.
        </p>
        <button className="btn primary w-full mb-4.5" style={{ flex: "none" }} onClick={exportBackup}>
          download backup
        </button>

        <div className="text-[11px] mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>start over</div>
        <p className="text-[12px] mb-2.5" style={{ color: "var(--text-muted)" }}>
          Clears every task and category and puts the starter set back.
        </p>
        <button className="btn danger w-full" style={{ flex: "none" }} onClick={handleReset}>
          {armed ? "tap again to confirm" : "reset everything"}
        </button>
      </div>
    </div>
  );
}
