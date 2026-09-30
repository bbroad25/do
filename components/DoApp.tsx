"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Dial from "./Dial";
import Board from "./Board";
import { AddTaskSheet, ArchiveSheet, TaskDetailSheet } from "./TaskSheets";
import MenuRoot from "./MenuRoot";
import ProfileScreen from "./ProfileScreen";
import SettingsScreen from "./SettingsScreen";
import CategoryEditor from "./CategoryEditor";
import IntegrationsScreen from "./IntegrationsScreen";
import DataScreen from "./DataScreen";
import TriageScreen from "./TriageScreen";
import InstallPrompt from "./InstallPrompt";
import { Icon } from "@/lib/icons";
import { todayISODate } from "@/lib/constants";
import type { Category, IconKey, InboundToken, IntegrationRow, Profile, Task } from "@/lib/types";

export type Screen =
  | "home"
  | "board"
  | "menu"
  | "profile"
  | "settings"
  | "categories"
  | "integrations"
  | "data"
  | "triage";

const DEFAULT_CATEGORIES: { label: string; icon: IconKey }[] = [
  { label: "work", icon: "work" },
  { label: "fun", icon: "fun" },
  { label: "family", icon: "family" },
  { label: "self", icon: "self" },
  { label: "give", icon: "give" },
  { label: "other", icon: "other" },
];

export default function DoApp({
  userId,
  initialProfile,
  initialCategories,
  initialTasks,
  initialIntegrations,
}: {
  userId: string;
  initialProfile: Profile;
  initialCategories: Category[];
  initialTasks: Task[];
  initialIntegrations: IntegrationRow[];
}) {
  const supabase = useMemo(() => createClient(), []);

  const [screen, setScreen] = useState<Screen>("home");
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>(initialIntegrations);
  const [tokens, setTokens] = useState<InboundToken[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);

  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", profile.accent);
  }, [profile.accent]);

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1700);
  }

  function catById(id: string | null): Category | undefined {
    return categories.find((c) => c.id === id);
  }

  const boardTasks = useMemo(
    () => tasks.filter((t) => t.category_id === currentCategoryId && !t.done),
    [tasks, currentCategoryId]
  );
  const inboxTasks = useMemo(
    () => tasks.filter((t) => t.triage_state === "inbox" && !t.done),
    [tasks]
  );
  const archivedTasks = useMemo(
    () => tasks.filter((t) => t.category_id === currentCategoryId && t.done),
    [tasks, currentCategoryId]
  );

  /* ---------------- task mutations ---------------- */

  async function handleAddTask(title: string, categoryId: string, effort: number, dueAt: string | null) {
    setAddTaskOpen(false);
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic: Task = {
      id: optimisticId,
      user_id: userId,
      category_id: categoryId,
      title,
      urgency: 0.5,
      importance: 0.5,
      effort,
      done: false,
      done_at: null,
      created_at: new Date().toISOString(),
      due_at: dueAt,
      triage_state: "triaged",
      source: "manual",
    };
    setTasks((prev) => [...prev, optimistic]);
    if (categoryId !== currentCategoryId) {
      showToast(`added to ${catById(categoryId)?.label ?? "that category"}`);
    }
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: userId, category_id: categoryId, title, urgency: 0.5, importance: 0.5, effort, due_at: dueAt })
      .select()
      .single();
    if (error || !data) {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
      showToast("could not save that task");
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === optimisticId ? (data as Task) : t)));
  }

  async function setTaskDue(taskId: string, dueAt: string | null) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, due_at: dueAt } : t)));
    setDetailTask((prev) => (prev && prev.id === taskId ? { ...prev, due_at: dueAt } : prev));
    const { error } = await supabase.from("tasks").update({ due_at: dueAt }).eq("id", taskId);
    if (error) showToast("could not save that date");
  }

  /* ---------------- triage inbox (imported tasks) ---------------- */

  async function triageTask(taskId: string, categoryId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, category_id: categoryId, triage_state: "triaged" } : t))
    );
    showToast(`sorted into ${catById(categoryId)?.label ?? "that category"}`);
    const { error } = await supabase
      .from("tasks")
      .update({ category_id: categoryId, triage_state: "triaged" })
      .eq("id", taskId);
    if (error) showToast("could not sort that");
  }

  async function markInboxDone(taskId: string) {
    const doneAt = new Date().toISOString();
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: true, done_at: doneAt } : t)));
    const { error } = await supabase.from("tasks").update({ done: true, done_at: doneAt }).eq("id", taskId);
    if (error) showToast("could not save that");
  }

  /* ---------------- inbound keys ---------------- */

  async function loadTokens() {
    const { data, error } = await supabase
      .from("inbound_tokens")
      .select("id, label, created_at, last_used_at")
      .is("revoked_at", null)
      .order("created_at");
    if (!error) setTokens((data ?? []) as InboundToken[]);
  }

  async function createToken(label: string) {
    const { data, error } = await supabase.rpc("create_inbound_token", { p_label: label });
    if (error || !data) {
      showToast(error?.code === "54000" ? "limit is 10 active keys" : "could not create a key");
      return;
    }
    setNewToken(data as string);
    loadTokens();
  }

  async function revokeToken(id: string) {
    setTokens((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.rpc("revoke_inbound_token", { p_id: id });
    if (error) {
      showToast("could not revoke that");
      loadTokens();
    } else {
      showToast("key revoked");
    }
  }

  function goTo(s: Screen) {
    if (s === "integrations") {
      setNewToken(null);
      loadTokens();
    }
    setScreen(s);
  }

  async function commitPosition(taskId: string, urgency: number, importance: number) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, urgency, importance } : t)));
    const { error } = await supabase.from("tasks").update({ urgency, importance }).eq("id", taskId);
    if (error) showToast("could not save that move");
  }

  function markTaskDone(id: string) {
    setDetailTask(null);
    setCompletingIds((prev) => new Set(prev).add(id));
    setTimeout(async () => {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const doneAt = new Date().toISOString();
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: true, done_at: doneAt } : t)));

      const today = todayISODate();
      setProfile((prev) => {
        let streak = prev.streak;
        let lastActive = prev.last_active_date;
        if (lastActive !== today) {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          const yesterday = y.toISOString().slice(0, 10);
          streak = lastActive === yesterday ? streak + 1 : 1;
          lastActive = today;
        }
        const points = prev.points + 1;
        const bestStreak = Math.max(prev.best_streak, streak);
        showToast(`nice — streak of ${streak}`);
        supabase
          .from("profiles")
          .update({ streak, points, best_streak: bestStreak, last_active_date: lastActive })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.error(error);
          });
        return { ...prev, streak, points, best_streak: bestStreak, last_active_date: lastActive };
      });

      const { error } = await supabase
        .from("tasks")
        .update({ done: true, done_at: doneAt })
        .eq("id", id);
      if (error) showToast("could not save that completion");
    }, 420);
  }

  async function deleteTask(id: string) {
    setDetailTask(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) showToast("could not delete that");
  }

  async function restoreTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: false, done_at: null } : t)));
    const { error } = await supabase.from("tasks").update({ done: false, done_at: null }).eq("id", id);
    if (error) showToast("could not restore that");
  }

  /* ---------------- category mutations ---------------- */

  async function handleAddCategory(label: string, icon: IconKey) {
    const optimisticId = `tmp-${Date.now()}`;
    const sortOrder = categories.length;
    setCategories((prev) => [...prev, { id: optimisticId, user_id: userId, label, icon, sort_order: sortOrder }]);
    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: userId, label, icon, sort_order: sortOrder })
      .select()
      .single();
    if (error || !data) {
      setCategories((prev) => prev.filter((c) => c.id !== optimisticId));
      showToast("could not add that category");
      return;
    }
    setCategories((prev) => prev.map((c) => (c.id === optimisticId ? (data as Category) : c)));
  }

  async function renameCategory(id: string, label: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
    const { error } = await supabase.from("categories").update({ label }).eq("id", id);
    if (error) showToast("could not rename that");
  }

  async function moveCategory(id: string, direction: -1 | 1) {
    const idx = categories.findIndex((c) => c.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= categories.length) return;
    const a = categories[idx];
    const b = categories[swapIdx];
    const next = [...categories];
    next[idx] = { ...b, sort_order: a.sort_order };
    next[swapIdx] = { ...a, sort_order: b.sort_order };
    next.sort((x, y) => x.sort_order - y.sort_order);
    setCategories(next);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    if (e1 || e2) showToast("could not save that order");
  }

  async function deleteCategory(id: string) {
    if (categories.length <= 2) return;
    const fallback = categories.find((c) => c.id !== id);
    if (!fallback) return;

    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.map((t) => (t.category_id === id ? { ...t, category_id: fallback.id } : t)));
    if (currentCategoryId === id) setCurrentCategoryId(fallback.id);
    showToast(`moved its tasks to ${fallback.label}`);

    const { error: reassignError } = await supabase
      .from("tasks")
      .update({ category_id: fallback.id })
      .eq("category_id", id);
    if (reassignError) {
      showToast("could not move those tasks");
      return;
    }
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);
    if (deleteError) showToast("could not delete that category");
  }

  /* ---------------- profile / settings / integrations ---------------- */

  function handleNameChange(name: string) {
    setProfile((prev) => ({ ...prev, name }));
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(async () => {
      const { error } = await supabase.from("profiles").update({ name }).eq("id", userId);
      if (error) showToast("could not save your name");
    }, 500);
  }

  async function handleAccentChange(hex: string) {
    setProfile((prev) => ({ ...prev, accent: hex }));
    const { error } = await supabase.from("profiles").update({ accent: hex }).eq("id", userId);
    if (error) showToast("could not save that color");
  }

  async function handleToggleNotifications(v: boolean) {
    setProfile((prev) => ({ ...prev, notifications: v }));
    const { error } = await supabase.from("profiles").update({ notifications: v }).eq("id", userId);
    if (error) showToast("could not save that setting");
    else showToast(v ? "nudges on" : "nudges off");
  }

  async function handleToggleIntegration(key: IntegrationRow["key"], enabled: boolean) {
    setIntegrations((prev) => prev.map((i) => (i.key === key ? { ...i, enabled } : i)));
    const { error } = await supabase
      .from("integrations")
      .upsert({ user_id: userId, key, enabled }, { onConflict: "user_id,key" });
    if (error) showToast("could not save that");
    else showToast(enabled ? "demo only — not actually connected" : "turned off");
  }

  /* ---------------- data / reset ---------------- */

  async function handleReset() {
    try {
      await supabase.from("tasks").delete().eq("user_id", userId);
      await supabase.from("categories").delete().eq("user_id", userId);

      const { data: newCats, error: catError } = await supabase
        .from("categories")
        .insert(
          DEFAULT_CATEGORIES.map((c, i) => ({ user_id: userId, label: c.label, icon: c.icon, sort_order: i }))
        )
        .select();
      if (catError || !newCats) throw catError;

      const byLabel = new Map(newCats.map((c) => [c.label, c.id as string]));
      const seedRows = [
        { title: "Ship the release notes", label: "work", urgency: 0.82, importance: 0.78, effort: 0.5 },
        { title: "Book the summer trip", label: "fun", urgency: 0.35, importance: 0.55, effort: 0.5 },
        { title: "Plan the birthday party", label: "family", urgency: 0.68, importance: 0.86, effort: 0.5 },
        { title: "Actually stretch today", label: "self", urgency: 0.6, importance: 0.4, effort: 0.28 },
        { title: "Pick a cause to back", label: "give", urgency: 0.2, importance: 0.45, effort: 0.5 },
      ];
      const { data: newTasks, error: taskError } = await supabase
        .from("tasks")
        .insert(
          seedRows.map((r) => ({
            user_id: userId,
            category_id: byLabel.get(r.label),
            title: r.title,
            urgency: r.urgency,
            importance: r.importance,
            effort: r.effort,
          }))
        )
        .select();
      if (taskError) throw taskError;

      await supabase
        .from("profiles")
        .update({ streak: 0, points: 0, best_streak: 0, last_active_date: null })
        .eq("id", userId);

      await supabase.from("integrations").upsert(
        [
          { user_id: userId, key: "inbox", enabled: true },
          { user_id: userId, key: "calendar", enabled: false },
          { user_id: userId, key: "reminders", enabled: false },
          { user_id: userId, key: "slack", enabled: false },
        ],
        { onConflict: "user_id,key" }
      );

      setCategories(newCats as Category[]);
      setTasks((newTasks ?? []) as Task[]);
      setProfile((prev) => ({ ...prev, streak: 0, points: 0, best_streak: 0, last_active_date: null }));
      setIntegrations([
        { user_id: userId, key: "inbox", enabled: true },
        { user_id: userId, key: "calendar", enabled: false },
        { user_id: userId, key: "reminders", enabled: false },
        { user_id: userId, key: "slack", enabled: false },
      ]);
      setCurrentCategoryId(null);
      showToast("starting fresh");
      setScreen("home");
    } catch (err) {
      console.error(err);
      showToast("reset did not fully complete");
    }
  }

  /* ---------------- navigation ---------------- */

  function openBoard(categoryId: string) {
    setCurrentCategoryId(categoryId);
    setScreen("board");
  }

  const currentCategory = catById(currentCategoryId);

  return (
    <div className="do-outer min-h-screen flex items-center justify-center">
      <div className="do-shell relative w-full flex flex-col overflow-hidden">
        {screen === "home" && (
          <div className="do-home absolute inset-0 flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-1.5 flex-shrink-0">
              <div className="font-display font-semibold text-[22px]">DO</div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)", fontSize: 13, color: "var(--text-muted)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  <b style={{ color: "var(--accent)", fontWeight: 600 }}>{profile.streak}</b>
                  <span>day streak</span>
                </div>
                <button
                  aria-label="Menu"
                  onClick={() => setScreen("menu")}
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 40, height: 40, background: "var(--bg-panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}
                >
                  <svg viewBox="0 0 24 24" width={18} height={18} stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6" /><circle cx="9" cy="6" r="2" />
                    <line x1="4" y1="12" x2="20" y2="12" /><circle cx="15" cy="12" r="2" />
                    <line x1="4" y1="18" x2="20" y2="18" /><circle cx="7" cy="18" r="2" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6.5 pt-1.5 flex-shrink-0">
              <h1 className="font-display italic text-[29px] mb-1" style={{ fontWeight: 500, lineHeight: 1.18, animation: "settle .6s cubic-bezier(.2,.8,.2,1) both" }}>
                What do you<br />want to do?
              </h1>
              <p className="text-[13.5px] m-0" style={{ color: "var(--text-muted)" }}>Drag toward a part of your life, or tap it.</p>
              {inboxTasks.length > 0 && (
                <button
                  onClick={() => setScreen("triage")}
                  className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] cursor-pointer"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)", color: "var(--text-primary)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--q-next)" }} />
                  {inboxTasks.length} new {inboxTasks.length === 1 ? "task" : "tasks"} to sort
                </button>
              )}
            </div>

            <Dial categories={categories} onSelect={openBoard} />

            <InstallPrompt />

            <div className="px-5 flex-shrink-0" style={{ paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))" }}>
              <button
                onClick={() => showToast("coming soon — forwarded mail becomes a task")}
                className="w-full flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)", fontSize: 12 }}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} stroke="var(--text-muted)" fill="none" strokeWidth={1.5} strokeLinecap="round" className="flex-shrink-0">
                  <path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" />
                </svg>
                <span><b style={{ color: "var(--text-primary)", fontWeight: 500 }}>do@inbox</b> — forward anything, it becomes a task</span>
              </button>
            </div>
          </div>
        )}

        {screen === "board" && currentCategory && (
          <div className="do-board absolute inset-0 flex flex-col">
            <div className="flex items-center justify-between px-[18px] pt-[18px] pb-1.5 flex-shrink-0">
              <button onClick={() => setScreen("home")} className="flex items-center gap-1.5 border-none bg-transparent cursor-pointer text-[13px]" style={{ color: "var(--text-muted)" }}>
                <svg viewBox="0 0 24 24" width={15} height={15} stroke="currentColor" fill="none" strokeWidth={1.8} strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                home
              </button>
              <div className="font-display text-[19px] font-semibold flex items-center gap-2">
                <Icon icon={currentCategory.icon} size={18} />
                <span>{currentCategory.label}</span>
              </div>
              <button
                aria-label="Archive"
                onClick={() => setArchiveOpen(true)}
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 38, height: 38, background: "var(--bg-panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}
              >
                <svg viewBox="0 0 24 24" width={17} height={17} stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinecap="round">
                  <path d="M3 8l2-4h14l2 4" /><path d="M3 8h18v11H3z" /><path d="M9 12h6" />
                </svg>
              </button>
            </div>

            <Board
              tasks={boardTasks}
              completingIds={completingIds}
              onCommitPosition={commitPosition}
              onTapTask={setDetailTask}
              onAddClick={() => setAddTaskOpen(true)}
            />
          </div>
        )}

        {screen === "menu" && <MenuRoot onBack={() => setScreen("home")} onGoTo={goTo} />}

        {screen === "triage" && (
          <TriageScreen
            tasks={inboxTasks}
            categories={categories}
            onBack={() => setScreen("home")}
            onTriage={triageTask}
            onDone={markInboxDone}
            onDelete={deleteTask}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen onBack={() => setScreen("menu")} profile={profile} tasks={tasks} onNameChange={handleNameChange} />
        )}

        {screen === "settings" && (
          <SettingsScreen
            onBack={() => setScreen("menu")}
            onGoToCategories={() => setScreen("categories")}
            profile={profile}
            onToggleNotifications={handleToggleNotifications}
            onAccentChange={handleAccentChange}
          />
        )}

        {screen === "categories" && (
          <CategoryEditor
            onBack={() => setScreen("settings")}
            categories={categories}
            onRename={renameCategory}
            onMove={moveCategory}
            onDelete={deleteCategory}
            onAdd={handleAddCategory}
          />
        )}

        {screen === "integrations" && (
          <IntegrationsScreen
            onBack={() => setScreen("menu")}
            integrations={integrations}
            onToggle={handleToggleIntegration}
            tokens={tokens}
            newToken={newToken}
            onCreateToken={createToken}
            onRevokeToken={revokeToken}
            onDismissNewToken={() => setNewToken(null)}
          />
        )}

        {screen === "data" && (
          <DataScreen
            onBack={() => setScreen("menu")}
            profile={profile}
            categories={categories}
            tasks={tasks}
            integrations={integrations}
            onReset={handleReset}
          />
        )}

        <AddTaskSheet
          open={addTaskOpen}
          categories={categories}
          defaultCategoryId={currentCategoryId}
          onClose={() => setAddTaskOpen(false)}
          onSave={handleAddTask}
        />
        <TaskDetailSheet
          open={!!detailTask}
          task={detailTask}
          categoryLabel={detailTask ? catById(detailTask.category_id)?.label ?? "" : ""}
          onClose={() => setDetailTask(null)}
          onDelete={deleteTask}
          onMarkDone={markTaskDone}
          onSetDue={setTaskDue}
        />
        <ArchiveSheet
          open={archiveOpen}
          tasks={archivedTasks}
          categoryLabel={currentCategory?.label ?? ""}
          onClose={() => setArchiveOpen(false)}
          onRestore={restoreTask}
          onDelete={deleteTask}
        />

        {toastMsg && (
          <div
            className="absolute left-1/2 rounded-full font-semibold"
            style={{
              bottom: "calc(26px + env(safe-area-inset-bottom, 0px))",
              transform: "translateX(-50%)",
              background: "#f3f1eb",
              color: "#16171c",
              padding: "10px 16px",
              fontSize: 12.5,
              zIndex: 20,
              maxWidth: "88%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );
}
