# The Wire Report

A Drudge-style headline site with an admin back office.
**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · Supabase (Postgres + Auth + RLS)

- `/` — public front page: top stories, flashing siren lead, masthead, three columns with resource links at the bottom
- `/admin` — back office: create / edit / delete headlines, reorder, toggle red & published, site settings

## Setup

1. **Create a Supabase project** at supabase.com.
2. **Run the schema:** open *SQL Editor*, paste `supabase/migrations/0001_init.sql`, run it.
   Optionally run `supabase/seed.sql` for sample headlines.
3. **Create your admin user:** *Authentication → Users → Add user* (email + password, auto-confirm).
   Then in the SQL editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
4. **Env vars:** `cp .env.example .env.local` and fill in the project URL and publishable (anon) key from *Project Settings → API*.
5. **Run it:**
   ```bash
   npm install
   npm run dev
   ```
   Front page at http://localhost:3000, back office at http://localhost:3000/admin.

> Tip: in *Authentication → Providers → Email*, turn off public sign-ups so only users you add can log in.
> (Even if someone signs up, they can't edit anything unless they're in `admins`.)

## How it works

| Piece | Where |
| --- | --- |
| Schema, RLS policies, `is_admin()` | `supabase/migrations/0001_init.sql` |
| Public page (cached, cookie-free client) | `src/app/page.tsx` |
| Auth redirect for `/admin/*` | `src/proxy.ts` |
| All writes (server actions) | `src/app/admin/actions.ts` |
| Admin list / form / settings | `src/app/admin/(dashboard)/…` |

**Sections:** `siren` (big lead), `top` (top-left stories), `col1` / `col2` / `col3`.
Each link is a `story` or a `resource` (small link under a column rule).

**Caching:** the front page is cached with `"use cache"` and tag `front-page`. Every admin save calls
`updateTag("front-page")`, so edits appear instantly while visitors get a static, fast page
(with a few-minute time-based refresh as a fallback).

**Security:** Row Level Security is the real gate — the public key can only read published links;
inserts/updates/deletes require a row in `admins`. The app-side checks are for UX.

## Deploy

Push to GitHub and import into Vercel; add the same env vars. Set `NEXT_PUBLIC_SITE_URL` to your domain
and optionally `NEXT_PUBLIC_TIMEZONE` (default `America/New_York`) for the "last updated" stamp.
