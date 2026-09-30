"use client";

import { useState } from "react";
import SubHeader from "./SubHeader";
import { relTime } from "@/lib/constants";
import type { InboundToken, IntegrationRow } from "@/lib/types";

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
  tokens,
  newToken,
  onCreateToken,
  onRevokeToken,
  onDismissNewToken,
}: {
  onBack: () => void;
  integrations: IntegrationRow[];
  onToggle: (key: IntegrationRow["key"], enabled: boolean) => void;
  tokens: InboundToken[];
  newToken: string | null;
  onCreateToken: (label: string) => void;
  onRevokeToken: (id: string) => void;
  onDismissNewToken: () => void;
}) {
  const [label, setLabel] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [armedRevoke, setArmedRevoke] = useState<string | null>(null);
  const endpoint = `${typeof window !== "undefined" ? window.location.origin : ""}/api/inbound`;

  function enabledFor(key: IntegrationRow["key"]) {
    return integrations.find((i) => i.key === key)?.enabled ?? false;
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  function create() {
    onCreateToken(label.trim() || "untitled");
    setLabel("");
  }

  function revoke(id: string) {
    if (armedRevoke !== id) {
      setArmedRevoke(id);
      setTimeout(() => setArmedRevoke((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    setArmedRevoke(null);
    onRevokeToken(id);
  }

  const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };
  const sectionLabel = "text-[11px] mb-2";
  const sectionStyle = { color: "var(--text-muted)", letterSpacing: "0.04em" };

  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader title="Integrations" onBack={onBack} />
      <div className="do-scroll flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <div className={sectionLabel} style={sectionStyle}>send tasks to DO</div>
        <p className="text-[12.5px] mt-0 mb-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Anything that can make a web request — iOS Shortcuts (and so Apple Reminders), IFTTT, Zapier, Make, a
          script — can drop tasks into your <b style={{ color: "var(--text-primary)", fontWeight: 500 }}>Sort</b> inbox.
          Make one key per app so you can revoke them separately.
        </p>

        {newToken && (
          <div
            className="rounded-2xl p-3.5 mb-3"
            style={{ background: "var(--bg-panel-2)", border: "1px solid var(--accent)" }}
          >
            <div className="text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
              Copy this key now — it won&apos;t be shown again.
            </div>
            <div
              className="text-[11.5px] break-all rounded-lg p-2.5 mb-2.5"
              style={{ ...mono, background: "var(--bg-deep)", color: "var(--text-primary)" }}
            >
              {newToken}
            </div>
            <div className="flex gap-2">
              <button className="btn primary" style={{ padding: "9px" }} onClick={() => copy(newToken, "key")}>
                {copied === "key" ? "copied" : "copy key"}
              </button>
              <button className="btn" style={{ padding: "9px" }} onClick={onDismissNewToken}>
                done
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            className="field-input"
            placeholder="name it, e.g. iOS Shortcut"
            maxLength={60}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <button className="btn primary" style={{ flex: "none", padding: "0 16px" }} onClick={create}>
            new key
          </button>
        </div>

        {tokens.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {tokens.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2.5 rounded-xl p-2.5"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] overflow-hidden text-ellipsis whitespace-nowrap">{t.label || "untitled"}</div>
                  <div className="text-[10.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {t.last_used_at ? `last used ${relTime(t.last_used_at)}` : "never used"}
                  </div>
                </div>
                <button
                  className="btn danger"
                  style={{ flex: "none", padding: "6px 12px", fontSize: 12 }}
                  onClick={() => revoke(t.id)}
                >
                  {armedRevoke === t.id ? "tap to confirm" : "revoke"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl p-3.5 mb-2" style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px]" style={sectionStyle}>endpoint</span>
            <button
              className="text-[11px] bg-transparent border-none cursor-pointer"
              style={{ color: "var(--accent)" }}
              onClick={() => copy(endpoint, "url")}
            >
              {copied === "url" ? "copied" : "copy"}
            </button>
          </div>
          <div className="text-[11.5px] break-all mb-3" style={{ ...mono, color: "var(--text-primary)" }}>
            POST {endpoint}
          </div>
          <div className="text-[11px] mb-1.5" style={sectionStyle}>send</div>
          <pre
            className="text-[11px] m-0 p-2.5 rounded-lg overflow-x-auto"
            style={{ ...mono, background: "var(--bg-deep)", color: "var(--text-muted)", whiteSpace: "pre" }}
          >{`Authorization: Bearer <your key>
Content-Type: application/json

{ "title": "Call the tile guy",
  "source": "shortcuts",
  "due": "2026-10-02" }`}</pre>
          <p className="text-[11px] mt-2 mb-0 leading-relaxed" style={{ color: "var(--text-faint)" }}>
            Can&apos;t set headers (IFTTT)? Add <span style={mono}>?token=&lt;your key&gt;</span> to the URL instead.
            Optional fields: <span style={mono}>notes, list, url, external_id, completed</span>. Send
            <span style={mono}> {"{ tasks: [...] }"}</span> for up to 100 at once.
          </p>
        </div>

        <div className={`${sectionLabel} mt-5`} style={sectionStyle}>connected apps — coming soon</div>
        {ROWS.map((row) => (
          <div key={row.key} className="nav-row mb-2.5" style={{ cursor: "default", opacity: 0.6 }}>
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
