// POST /api/inbound -- generic inbound-task endpoint for DO.
// Callers: iOS Shortcuts, IFTTT "Make a web request", Zapier/Make, curl, and (later)
// the forwarding-inbox parser, CSV import, and provider connectors. Everything
// converges on one database function, public.ingest_inbound, which verifies the
// token and writes through public.upsert_inbound_tasks.
//
// No service-role key: token verification happens inside Postgres, so this route
// only needs the public (publishable) key.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;

const TaskIn = z.object({
  title: z.string().trim().min(1).max(500),
  notes: z.string().max(10_000).optional(),
  due: z.string().max(64).optional(), // ISO 8601 preferred; parsed leniently
  completed: z.boolean().optional(),
  source: z.string().trim().min(1).max(40).default("webhook"),
  external_id: z.string().trim().min(1).max(200).optional(), // stable IDs make re-sends idempotent
  list: z.string().trim().max(200).optional(), // source list / project / board name
  url: z.string().url().max(2000).optional(),
});

function getToken(req: NextRequest): string {
  const h = req.headers.get("authorization");
  if (h?.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  // Fallback for callers that can't set headers (IFTTT). Query strings end up in
  // logs, so keep tokens per-integration and revocable.
  return req.nextUrl.searchParams.get("token")?.trim() ?? "";
}

function toIso(s?: string): string | null {
  if (!s) return null;
  // Date-only strings ("2026-10-01") mean end of that day in the sender's zone;
  // we don't know their zone, so pin them to 17:00 UTC rather than midnight.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T17:00:00Z`) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  const token = getToken(req);
  if (!token.startsWith("do_")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json: unknown = await req.json().catch(() => null);
  if (json === null || typeof json !== "object") {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const rawItems = "tasks" in json ? (json as { tasks: unknown }).tasks : [json];
  const parsed = z.array(TaskIn).min(1).max(100).safeParse(rawItems);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 }
    );
  }

  // Normalize + de-dupe within the batch (ON CONFLICT can't hit the same row twice).
  const now = new Date().toISOString();
  const byKey = new Map<string, Record<string, unknown>>();
  for (const t of parsed.data) {
    const externalId = t.external_id ?? randomUUID();
    byKey.set(`${t.source}\u0000${externalId}`, {
      source: t.source,
      external_id: externalId,
      title: t.title,
      notes: t.notes ?? null,
      due_at: toIso(t.due),
      completed_at: t.completed ? now : null,
      list: t.list ?? null,
      url: t.url ?? null,
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await supabase.rpc("ingest_inbound", {
    p_token: token,
    p_items: [...byKey.values()],
  });

  if (error) {
    if (error.code === "28000") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (error.code === "22023") return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    console.error("inbound ingest failed", error.message);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }

  const rows = (data ?? []) as { was_inserted: boolean }[];
  const created = rows.filter((r) => r.was_inserted).length;
  return NextResponse.json({ ok: true, received: byKey.size, created, updated: rows.length - created });
}
