"use client";

import SubHeader from "./SubHeader";
import type { IntegrationRow } from "@/lib/types";

const ROWS: { key: IntegrationRow["key"]; title: string; desc: string; icon: string }[] = [
  {
    key: "inbox",
    title: "Forwarding inbox",
    desc: "Auto-import from do@inbox",
    icon: '<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>',
  },
  {
    key: "calendar",
    title: "Calendar",
    desc: "Pull in dated events as tasks",
    icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  },
  {
    key: "reminders",
    title: "Reminders",
    desc: "Two-way sync with your reminders app",
    icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  },
  {
    key: "slack",
    title: "Slack",
    desc: "Turn starred messages into work tasks",
    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  },
];

export default function IntegrationsScreen({
  onBack,
  integrations,
  onToggle,
}: {
  onBack: () => void;
  integrations: IntegrationRow[];
  onToggle: (key: IntegrationRow["key"], enabled: boolean) => void;
}) {
  function enabledFor(key: IntegrationRow["key"]) {
    return integrations.find((i) => i.key === key)?.enabled ?? false;
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader title="Integrations" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <p className="text-[12px] mb-2" style={{ color: "var(--text-muted)" }}>
          Demo only for now — nothing here actually connects yet.
        </p>
        {ROWS.map((row) => (
          <div key={row.key} className="nav-row mb-2.5" style={{ cursor: "default" }}>
            <span className="ic">
              <svg
                viewBox="0 0 24 24"
                width={16}
                height={16}
                stroke="currentColor"
                fill="none"
                strokeWidth={1.6}
                strokeLinecap="round"
                dangerouslySetInnerHTML={{ __html: row.icon }}
              />
            </span>
            <span className="flex-1 min-w-0">
              <b className="block font-medium text-[13.5px]">{row.title}</b>
              <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{row.desc}</span>
            </span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={enabledFor(row.key)}
                onChange={(e) => onToggle(row.key, e.target.checked)}
              />
              <span className="track"><span className="thumb" /></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
