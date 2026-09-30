"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

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
