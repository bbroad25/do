# DO

What do you want to do? Drag toward a part of your life, land on the
urgency × importance map, and knock things out.

This is the real, database-backed version of the DO prototype: Next.js
(App Router, TypeScript, Tailwind) on the front end, Supabase for auth
and data.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** and run the contents of `supabase/schema.sql`.
   This creates the `profiles`, `categories`, `tasks`, and `integrations`
   tables, turns on row-level security so people can only ever see their
   own rows, and sets up a trigger that gives every new user six starter
   categories and a few seed tasks the moment they sign up.
3. In **Authentication → Providers**, email magic-link sign-in is on by
   default — nothing else to configure for now.
4. In **Authentication → URL Configuration**, add your site's URL (and
   `http://localhost:3000` for local dev) to the redirect allow list.
5. Copy your **Project URL** and **anon public key** from
   **Settings → API**.

## 2. Run it locally

```bash
cp .env.local.example .env.local
# paste your Supabase URL + anon key into .env.local

npm install
npm run dev
```

Open `http://localhost:3000`, enter your email, and click the sign-in
link it sends you.

## 3. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, "Add New Project" → import the repo.
3. Add the two environment variables from `.env.local.example` under
   Project → Settings → Environment Variables.
4. Deploy. Add the deployed URL to Supabase's redirect allow list
   (Authentication → URL Configuration) so magic links work in
   production too.

## What's here

- `app/page.tsx` — server-fetches the signed-in user's data, hands it to
  the client app.
- `components/DoApp.tsx` — screen state machine and every Supabase
  read/write (tasks, categories, profile, integrations).
- `components/Dial.tsx`, `Board.tsx` — the drag-to-choose home screen and
  the draggable urgency/importance map.
- `components/TaskSheets.tsx`, `CategoryEditor.tsx`, `MenuRoot.tsx`,
  `ProfileScreen.tsx`, `SettingsScreen.tsx`, `IntegrationsScreen.tsx`,
  `DataScreen.tsx` — the menu, its sub-screens, and the add/detail/archive
  sheets.
- `supabase/schema.sql` — the whole database, ready to paste into the SQL
  editor.

## Deliberately not built yet

- **Inbox forwarding.** The home screen's `do@inbox` hint is still just a
  toast. Wiring it up for real means an inbound-email provider (Postmark
  or Resend both have this) plus a serverless function that parses the
  email with an LLM and inserts a task row. Good phase-two work — no
  sense blocking the rest of the app on it.
- **Integrations.** Calendar, Reminders, and Slack toggles are stored but
  don't connect to anything real yet.
- **Data import.** Export (a JSON download) works; restoring from a
  pasted backup was left out for now since it would need to safely
  reconcile against a real relational schema rather than just overwrite
  a local blob.
