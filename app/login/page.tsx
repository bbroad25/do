"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)" }}
      >
        <div className="font-display italic text-3xl mb-2" style={{ fontWeight: 600 }}>
          DO
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          What do you want to do? Sign in with your email — no password, just
          a link.
        </p>

        {status !== "sent" && (
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="btn w-full mb-3 flex items-center justify-center gap-2.5"
              style={{ color: "var(--text-primary)", background: "var(--bg-deep)" }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 mb-3 text-[11px]" style={{ color: "var(--text-faint)" }}>
              <span className="flex-1 h-px" style={{ background: "var(--hairline)" }} />
              or use email
              <span className="flex-1 h-px" style={{ background: "var(--hairline)" }} />
            </div>
          </>
        )}

        {status === "sent" ? (
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            Check <b>{email}</b> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={sendLink}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input mb-3"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn primary w-full"
            >
              {status === "sending" ? "sending…" : "send sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-xs mt-3" style={{ color: "#ff8f86" }}>
                {errorMsg}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
