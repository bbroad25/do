"use client";

import SubHeader from "./SubHeader";
import { ACCENTS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export default function SettingsScreen({
  onBack,
  onGoToCategories,
  profile,
  onToggleNotifications,
  onAccentChange,
}: {
  onBack: () => void;
  onGoToCategories: () => void;
  profile: Profile;
  onToggleNotifications: (v: boolean) => void;
  onAccentChange: (hex: string) => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader title="Settings" onBack={onBack} />
      <div className="do-scroll flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <div className="text-[11px] mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>the dial</div>
        <button className="nav-row mb-2.5" onClick={onGoToCategories}>
          <span className="ic">
            <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18M3 12h18" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <b className="block font-medium text-[13.5px]">Your categories</b>
            <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Rename, reorder, add or remove</span>
          </span>
          <svg viewBox="0 0 24 24" width={14} height={14} stroke="var(--text-faint)" fill="none" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        <div className="text-[11px] mt-4.5 mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>nudges</div>
        <div className="nav-row mb-2.5" style={{ cursor: "default" }}>
          <span className="ic">
            <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinecap="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </span>
          <span className="flex-1 min-w-0">
            <b className="block font-medium text-[13.5px]">Smart nudges</b>
            <span className="block text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Gentle pings for urgent, easy tasks</span>
          </span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={profile.notifications}
              onChange={(e) => onToggleNotifications(e.target.checked)}
            />
            <span className="track"><span className="thumb" /></span>
          </label>
        </div>

        <div className="text-[11px] mt-4.5 mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>accent color</div>
        <div className="flex flex-wrap gap-2.5 px-0.5 pb-1.5">
          {ACCENTS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onAccentChange(hex)}
              className="rounded-full"
              style={{
                width: 34,
                height: 34,
                background: hex,
                border: `2px solid ${profile.accent === hex ? "var(--text-primary)" : "transparent"}`,
              }}
              aria-label={`Use ${hex} as accent color`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
