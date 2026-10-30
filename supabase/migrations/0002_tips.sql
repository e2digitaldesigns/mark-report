-- =====================================================================
-- News tips: anyone can submit, only admins can read / manage.
-- Run in the Supabase SQL editor after 0001_init.sql.
-- =====================================================================

create table if not exists public.tips (
  id          uuid primary key default gen_random_uuid(),
  message     text not null check (char_length(message) between 1 and 5000),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists tips_created_idx on public.tips (created_at desc);

alter table public.tips enable row level security;

drop policy if exists "tips public insert" on public.tips;
drop policy if exists "tips admin read"    on public.tips;
drop policy if exists "tips admin update"  on public.tips;
drop policy if exists "tips admin delete"  on public.tips;

-- visitors can submit but never read anything back
create policy "tips public insert" on public.tips for insert
  to anon, authenticated
  with check (is_read = false and char_length(message) between 1 and 5000);
create policy "tips admin read"   on public.tips for select
  to authenticated using (public.is_admin());
create policy "tips admin update" on public.tips for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tips admin delete" on public.tips for delete
  to authenticated using (public.is_admin());

notify pgrst, 'reload schema';
