-- =====================================================================
-- Headline site schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- =====================================================================

-- ---------- Enums ----------------------------------------------------
do $$ begin
  create type public.link_section as enum ('siren', 'top', 'col1', 'col2', 'col3');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.link_kind as enum ('story', 'resource');
exception when duplicate_object then null; end $$;

-- ---------- Links (every headline on the page) -----------------------
create table if not exists public.links (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 400),
  url           text not null check (url ~* '^https?://'),
  section       public.link_section not null default 'col1',
  kind          public.link_kind    not null default 'story',
  position      integer not null default 0,
  is_red        boolean not null default false,   -- urgent / breaking
  is_bold       boolean not null default false,
  image_url     text check (image_url is null or image_url ~* '^https?://'),
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) on delete set null
);

create index if not exists links_section_position_idx
  on public.links (section, kind, position);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists links_touch on public.links;
create trigger links_touch before update on public.links
  for each row execute function public.touch_updated_at();

-- ---------- Site settings (single row) -------------------------------
create table if not exists public.site_settings (
  id            boolean primary key default true check (id), -- enforces one row
  site_name     text not null default 'THE WIRE REPORT',
  tagline       text,
  show_siren    boolean not null default true,
  updated_at    timestamptz not null default now()
);
insert into public.site_settings (id) values (true) on conflict do nothing;

drop trigger if exists settings_touch on public.site_settings;
create trigger settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------- Admins ---------------------------------------------------
create table if not exists public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Row Level Security --------------------------------------
alter table public.links         enable row level security;
alter table public.site_settings enable row level security;
alter table public.admins        enable row level security;

-- links: public reads published rows; admins read/write everything
drop policy if exists "links public read"  on public.links;
drop policy if exists "links admin read"   on public.links;
drop policy if exists "links admin insert" on public.links;
drop policy if exists "links admin update" on public.links;
drop policy if exists "links admin delete" on public.links;

create policy "links public read"  on public.links for select
  using (is_published);
create policy "links admin read"   on public.links for select
  to authenticated using (public.is_admin());
create policy "links admin insert" on public.links for insert
  to authenticated with check (public.is_admin());
create policy "links admin update" on public.links for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "links admin delete" on public.links for delete
  to authenticated using (public.is_admin());

-- settings: anyone reads, admins update
drop policy if exists "settings public read"  on public.site_settings;
drop policy if exists "settings admin update" on public.site_settings;
create policy "settings public read"  on public.site_settings for select using (true);
create policy "settings admin update" on public.site_settings for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- admins: a signed-in user can see only their own row (no client writes)
drop policy if exists "admins self read" on public.admins;
create policy "admins self read" on public.admins for select
  to authenticated using (user_id = auth.uid());
