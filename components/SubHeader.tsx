"use client";

export default function SubHeader({
  title,
  onBack,
  backLabel = "back",
  right,
}: {
  title: React.ReactNode;
  onBack: () => void;
  backLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-[18px] pt-[18px] pb-1.5 flex-shrink-0">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 border-none bg-transparent cursor-pointer text-[13px]"
        style={{ color: "var(--text-muted)" }}
      >
        <svg viewBox="0 0 24 24" width={15} height={15} stroke="currentColor" fill="none" strokeWidth={1.8} strokeLinecap="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {backLabel}
      </button>
      <div className="font-display text-[19px] font-semibold flex items-center gap-2">{title}</div>
      {right ?? <div style={{ width: 44 }} />}
    </div>
  );
}
