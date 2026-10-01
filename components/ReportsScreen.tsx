"use client";

import SubHeader from "./SubHeader";

export interface Report {
  since: string;
  users_total: number;
  active_users: number;
  returning_users: number;
  sessions: number;
  sessions_desktop: number;
  sessions_installed: number;
  tasks_added: number;
  tasks_completed: number;
  completed_via: Record<string, number>;
  board_opened_via: Record<string, number>;
  time_filter: Record<string, number>;
  suggest_opened: number;
  suggest_done: number;
  suggest_another: number;
  triage_sorted: number;
  median_minutes_to_first_task: number | null;
  daily: { day: string; active: number; added: number; completed: number }[];
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

function Stat({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}>
      <b className="block font-display font-semibold text-[22px]">{value}</b>
      <span className="block text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</span>
      {hint && <span className="block text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>{hint}</span>}
    </div>
  );
}

function Breakdown({ title, data, question }: { title: string; data: Record<string, number>; question: string }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-2xl p-3.5 mb-2.5" style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}>
      <div className="text-[12.5px] font-medium">{title}</div>
      <div className="text-[10.5px] mb-2.5" style={{ color: "var(--text-faint)" }}>{question}</div>
      {total === 0 ? (
        <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>no data yet</div>
      ) : (
        rows.map(([k, n]) => (
          <div key={k} className="mb-1.5">
            <div className="flex justify-between text-[11.5px] mb-0.5">
              <span>{k}</span>
              <span style={{ color: "var(--text-muted)" }}>{n} · {pct(n, total)}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "var(--bg-deep)" }}>
              <div className="h-1.5 rounded-full" style={{ width: pct(n, total), background: "var(--accent)" }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function ReportsScreen({
  onBack,
  report,
  days,
  loading,
  error,
  onRange,
}: {
  onBack: () => void;
  report: Report | null;
  days: number;
  loading: boolean;
  error: string | null;
  onRange: (days: number) => void;
}) {
  const maxDaily = Math.max(1, ...(report?.daily ?? []).map((d) => Math.max(d.added, d.completed)));
  return (
    <div className="absolute inset-0 flex flex-col">
      <SubHeader title="Reports" onBack={onBack} />
      <div className="do-scroll flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <div className="flex gap-1.5 mb-3">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              className={`chip ${days === d ? "selected" : ""}`}
              style={{ padding: "5px 11px", fontSize: 12 }}
              onClick={() => onRange(d)}
            >
              {d} days
            </button>
          ))}
        </div>

        {error && <p className="text-[12.5px]" style={{ color: "#ff8f86" }}>{error}</p>}
        {loading && !report && <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>loading…</p>}

        {report && (
          <>
            <div className="text-[11px] mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>people</div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <Stat value={report.active_users} label="active users" hint={`of ${report.users_total} signed up`} />
              <Stat value={report.returning_users} label="came back" hint="active on 2+ days" />
              <Stat value={report.sessions} label="sessions" hint={`${pct(report.sessions_desktop, report.sessions)} desktop · ${pct(report.sessions_installed, report.sessions)} installed app`} />
              <Stat
                value={report.median_minutes_to_first_task == null ? "—" : `${report.median_minutes_to_first_task}m`}
                label="time to first task"
                hint="median, new signups"
              />
            </div>

            <div className="text-[11px] mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>doing</div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <Stat value={report.tasks_added} label="tasks added" />
              <Stat value={report.tasks_completed} label="tasks done" hint={`${pct(report.tasks_completed, report.tasks_added)} of added`} />
              <Stat value={pct(report.suggest_done, report.suggest_opened)} label="suggestions accepted" hint={`${report.suggest_done} of ${report.suggest_opened} opened · ${report.suggest_another} skips`} />
              <Stat value={report.triage_sorted} label="imports sorted" />
            </div>

            {report.daily.length > 0 && (
              <div className="rounded-2xl p-3.5 mb-2.5" style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}>
                <div className="flex justify-between items-baseline mb-2.5">
                  <span className="text-[12.5px] font-medium">daily</span>
                  <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                    <span style={{ color: "var(--q-quick)" }}>■</span> added &nbsp;
                    <span style={{ color: "var(--accent)" }}>■</span> done
                  </span>
                </div>
                <div className="flex items-end gap-1" style={{ height: 80 }}>
                  {report.daily.map((d) => (
                    <div key={d.day} className="flex-1 flex items-end gap-px h-full" title={`${d.day}: ${d.added} added, ${d.completed} done, ${d.active} active`}>
                      <div className="flex-1 rounded-t-sm" style={{ height: `${(d.added / maxDaily) * 100}%`, background: "var(--q-quick)", minHeight: d.added ? 2 : 0 }} />
                      <div className="flex-1 rounded-t-sm" style={{ height: `${(d.completed / maxDaily) * 100}%`, background: "var(--accent)", minHeight: d.completed ? 2 : 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] mt-4 mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>focus-group hypotheses</div>
            <Breakdown title="How people open a category" data={report.board_opened_via} question="Is the drag gesture used, or do people just tap?" />
            <Breakdown title="Time filter choices" data={report.time_filter} question="Do people pick by time available?" />
            <Breakdown title="Where tasks get done" data={report.completed_via} question="Board, suggestion, or triage inbox?" />
          </>
        )}
      </div>
    </div>
  );
}
