"use client";

export default function SheetShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity"
        style={{
          background: "rgba(8,9,12,.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          zIndex: 10,
        }}
      />
      <div
        className="absolute left-0 right-0 bottom-0 overflow-y-auto"
        style={{
          maxHeight: "82%",
          background: "var(--bg-panel-2)",
          border: "1px solid var(--hairline)",
          borderBottom: "none",
          borderRadius: "20px 20px 0 0",
          padding: "16px 20px calc(20px + env(safe-area-inset-bottom, 0px))",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform .28s cubic-bezier(.2,.8,.2,1)",
          zIndex: 11,
        }}
      >
        <div
          className="mx-auto mb-3.5 sticky top-0"
          style={{ width: 36, height: 4, borderRadius: 2, background: "var(--hairline)" }}
        />
        {children}
      </div>
    </>
  );
}
