import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DoApp from "@/components/DoApp";
import type { Category, IntegrationRow, Profile, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: categories }, { data: tasks }, { data: integrations }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("categories").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("integrations").select("*").eq("user_id", user.id),
    ]);

  return (
    <DoApp
      userId={user.id}
      initialProfile={profile as Profile}
      initialCategories={(categories ?? []) as Category[]}
      initialTasks={(tasks ?? []) as Task[]}
      initialIntegrations={(integrations ?? []) as IntegrationRow[]}
    />
  );
}
