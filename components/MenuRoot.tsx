"use client";

import SubHeader from "./SubHeader";
import type { Screen } from "./DoApp";

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} stroke="var(--text-faint)" fill="none" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0 ml-auto">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export default function MenuRoot({ onBack, onGoTo }: { onBack: () => void; onGoTo: (s: Screen) => void }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader title="you" onBack={onBack} backLabel="home" />
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <button className="nav-row mb-2.5" onClick={() => onGoTo("profile")}>
          <span className="ic">
            <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <b className="block font-medium text-[13.5px]">Profile</b>
            <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Name, streak, all-time stats</span>
          </span>
          <Chevron />
        </button>

        <button className="nav-row mb-2.5" onClick={() => onGoTo("settings")}>
          <span className="ic">
            <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5 2 2 0 1 1 4 0 1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1 2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <b className="block font-medium text-[13.5px]">Settings</b>
            <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Your categories, accent color, nudges</span>
          </span>
          <Chevron />
        </button>

        <button className="nav-row mb-2.5" onClick={() => onGoTo("integrations")}>
          <span className="ic">
            <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinecap="round">
              <path d="M8 12h8M12 8v8" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <b className="block font-medium text-[13.5px]">Integrations</b>
            <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Inbox, calendar, reminders, Slack</span>
          </span>
          <Chevron />
        </button>

        <button className="nav-row mb-2.5" onClick={() => onGoTo("data")}>
          <span className="ic">
            <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinecap="round">
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
              <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <b className="block font-medium text-[13.5px]">Data</b>
            <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Back up or start fresh</span>
          </span>
          <Chevron />
        </button>
      </div>
    </div>
  );
}
