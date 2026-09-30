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
  category_id: string;
  title: string;
  urgency: number;
  importance: number;
  effort: number;
  done: boolean;
  done_at: string | null;
  created_at: string;
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
