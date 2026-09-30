export const ACCENTS = [
  "#ff6b5e",
  "#45c4b0",
  "#f5c15b",
  "#b98bff",
  "#5b9dff",
  "#ff7ab8",
];

export function relTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  return `${Math.floor(diff / day)} days ago`;
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
