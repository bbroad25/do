"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const DISMISS_KEY = "do-install-dismissed";

/**
 * Nudges people to put DO on their home screen. Chrome/Edge/Android get a real
 * one-tap install button (beforeinstallprompt); iOS Safari has no install API,
 * so it gets the Share -> Add to Home Screen instructions. Hidden once dismissed
 * or when already running as an installed app.
 */
export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // storage blocked (private mode); just show the prompt
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (dismissed || standalone) return;

    const ua = navigator.userAgent;
    const isIosSafari = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    // Give people a beat with the app before asking.
    const timer = isIosSafari ? setTimeout(() => setIosHint(true), 1500) : undefined;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setInstallEvent(null);
    setIosHint(false);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    dismiss();
  }

  if (!installEvent && !iosHint) return null;

  return (
    <div
      className="do-install absolute flex items-center gap-3 rounded-2xl"
      style={{
        left: 16,
        right: 16,
        bottom: "calc(78px + env(safe-area-inset-bottom, 0px))",
        padding: "12px 12px 12px 14px",
        background: "var(--bg-panel-2)",
        border: "1px solid var(--hairline)",
        boxShadow: "0 18px 40px -16px rgba(0,0,0,.7)",
        zIndex: 8,
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl font-display italic flex-shrink-0"
        style={{ width: 38, height: 38, background: "linear-gradient(155deg,#ff8a75,var(--accent))", color: "var(--accent-ink)", fontWeight: 600 }}
      >
        do
      </div>
      <div className="flex-1 min-w-0 text-[12.5px] leading-snug">
        <b className="block font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>
          Put DO on your home screen
        </b>
        <span style={{ color: "var(--text-muted)" }}>
          {iosHint ? "Tap Share, then “Add to Home Screen.”" : "Opens full-screen, like a real app."}
        </span>
      </div>
      {!iosHint && (
        <button className="btn primary" style={{ flex: "none", padding: "8px 14px" }} onClick={install}>
          install
        </button>
      )}
      <button
        aria-label="Dismiss"
        onClick={dismiss}
        className="flex items-center justify-center flex-shrink-0 bg-transparent border-none"
        style={{ width: 28, height: 28, color: "var(--text-muted)" }}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" fill="none" strokeWidth={2} strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
