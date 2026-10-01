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

/** What people see. "quick" was confusing next to effort sizes (quick/medium/deep). */
export const ZONE_LABEL: Record<Zone, string> = {
  now: "now",
  next: "next",
  quick: "squeeze in",
  later: "later",
};

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

/* ---------------- "I have ___" time filter ---------------- */

export type TimeBudget = "any" | "5" | "30";
export const TIME_BUDGETS: { key: TimeBudget; label: string }[] = [
  { key: "5", label: "5 min" },
  { key: "30", label: "30 min" },
  { key: "any", label: "any time" },
];

/** Effort sizes: quick 0.28, medium 0.5, deep 0.8. */
export function fitsBudget(t: Pick<Task, "effort">, b: TimeBudget): boolean {
  const effort = Number(t.effort);
  if (b === "5") return effort <= 0.35;
  if (b === "30") return effort <= 0.6;
  return true;
}

/* ---------------- "pick one for me" ---------------- */

/** How strongly DO recommends doing this next: map position (incl. due-date drift) plus importance. */
export function suggestionScore(t: Task, now = Date.now()): number {
  return effectiveUrgency(t, now) * 0.55 + Number(t.importance) * 0.45;
}

/* ---------------- smart default placement (no LLM) ---------------- */

/**
 * Where a new task should land: the median of where *you* put tasks in that
 * category. Neutral (center) until there are 3 examples to learn from.
 */
export function learnedPlacement(tasks: Task[], categoryId: string): { urgency: number; importance: number } {
  const placed = tasks.filter(
    (t) => t.category_id === categoryId && t.triage_state !== "inbox" && !t.id.startsWith("tmp-")
  );
  if (placed.length < 3) return { urgency: 0.5, importance: 0.5 };
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const clamp = (v: number) => Math.min(0.9, Math.max(0.1, v));
  return {
    urgency: clamp(median(placed.map((t) => Number(t.urgency)))),
    importance: clamp(median(placed.map((t) => Number(t.importance)))),
  };
}
