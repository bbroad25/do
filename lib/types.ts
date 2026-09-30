export type IconKey =
  | "work"
  | "fun"
  | "family"
  | "self"
  | "give"
  | "other"
  | "flag"
  | "bolt"
  | "book"
  | "sun";

export interface Category {
  id: string;
  user_id: string;
  label: string;
  icon: IconKey;
  sort_order: number;
}

export interface Task {
  id: string;
  user_id: string;
  /** null only while an imported task is waiting in the triage inbox */
  category_id: string | null;
  title: string;
  urgency: number;
  importance: number;
  effort: number;
  done: boolean;
  done_at: string | null;
  created_at: string;
  notes?: string | null;
  due_at?: string | null;
  triage_state?: "inbox" | "triaged";
  source?: string;
  source_list?: string | null;
  source_url?: string | null;
}

export interface InboundToken {
  id: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
}

const DAY = 86400000;

/**
 * How much a due date pushes a task toward "urgent". Nothing beyond a week out;
 * then it ramps from 0.5 (7 days) to 0.95 (due now), and overdue pins near the edge.
 */
export function dueUrgency(dueAt: string | null | undefined, now = Date.now()): number | null {
  if (!dueAt) return null;
  const days = (new Date(dueAt).getTime() - now) / DAY;
  if (Number.isNaN(days) || days >= 7) return null;
  if (days <= 0) return 0.97;
  return 0.5 + (1 - days / 7) * 0.45;
}

/** Where a task actually sits on the map: the user's placement, pulled right by a looming due date. */
export function effectiveUrgency(t: Pick<Task, "urgency" | "due_at">, now = Date.now()): number {
  const d = dueUrgency(t.due_at, now);
  return d == null ? t.urgency : Math.max(t.urgency, d);
}

export function dueLabel(dueAt: string | null | undefined, now = new Date()): string | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOf(due) - startOf(now)) / DAY);
  if (due.getTime() < now.getTime() && dayDiff < 0) return "overdue";
  if (dayDiff === 0) return "due today";
  if (dayDiff === 1) return "due tomorrow";
  if (dayDiff < 7) return `due ${due.toLocaleDateString(undefined, { weekday: "short" })}`;
  return `due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/** <input type="date"> value (yyyy-mm-dd, local) <-> stored timestamp (5pm local that day). */
export function dueToInput(dueAt: string | null | undefined): string {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function inputToDue(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T17:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export interface Profile {
  id: string;
  name: string;
  accent: string;
  notifications: boolean;
  streak: number;
  best_streak: number;
  points: number;
  last_active_date: string | null;
}

export interface IntegrationRow {
  user_id: string;
  key: "inbox" | "calendar" | "reminders" | "slack";
  enabled: boolean;
}

export type Zone = "now" | "next" | "quick" | "later";

export function zoneOf(task: Pick<Task, "urgency" | "importance">): Zone {
  const urgent = task.urgency >= 0.5;
  const important = task.importance >= 0.5;
  if (urgent && important) return "now";
  if (!urgent && important) return "next";
  if (urgent && !important) return "quick";
  return "later";
}

export const ZONE_COLOR: Record<Zone, string> = {
  now: "var(--q-now)",
  next: "var(--q-next)",
  quick: "var(--q-quick)",
  later: "var(--q-later)",
};
