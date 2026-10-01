import { createClient } from "@/lib/supabase/client";

type Props = Record<string, string | number | boolean | null>;

let client: ReturnType<typeof createClient> | null = null;

/**
 * Fire-and-forget product event for Reports. Never send task titles or other
 * content -- only what a user did (e.g. which time filter), never what about.
 * Failures are swallowed: reporting must never break the app.
 */
export function track(name: string, props: Props = {}) {
  try {
    client ??= createClient();
    void client
      .from("events")
      .insert({ name, props })
      .then(
        () => undefined,
        () => undefined
      );
  } catch {
    // ignore
  }
}

export function effortBucket(effort: number): string {
  if (effort <= 0.35) return "quick";
  if (effort <= 0.6) return "medium";
  return "deep";
}
