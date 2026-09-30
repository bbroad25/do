import type { IconKey } from "./types";

// Each entry is the inner markup of a 24x24 viewBox stroke icon.
export const ICON_PATHS: Record<IconKey, string> = {
  work: '<path d="M4 8h16v11H4z"/><path d="M9 8V6a3 3 0 0 1 3-3v0a3 3 0 0 1 3 3v2"/>',
  fun: '<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M19 5l-4 4M5 19l4-4M19 19l-4-4"/>',
  family: '<circle cx="8" cy="12" r="4"/><circle cx="15" cy="12" r="4"/>',
  self: '<path d="M12 3c4 3 7 6.5 7 10a7 7 0 0 1-14 0c0-3.5 3-7 7-10z"/>',
  give: '<path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z"/>',
  other:
    '<circle cx="7" cy="16" r="1.6"/><circle cx="17" cy="16" r="1.6"/><circle cx="12" cy="7" r="1.6"/>',
  flag: '<path d="M5 3v18"/><path d="M5 4h13l-3 4 3 4H5"/>',
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M19 17H6a2 2 0 0 0-2 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
};

export const ICON_KEYS = Object.keys(ICON_PATHS) as IconKey[];

export function Icon({
  icon,
  size = 18,
  className,
}: {
  icon: IconKey;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[icon] }}
    />
  );
}
