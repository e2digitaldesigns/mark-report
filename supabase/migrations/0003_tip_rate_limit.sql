-- =====================================================================
-- Per-IP rate limit for news tips.
-- Visitors no longer insert into public.tips directly; they call
-- public.submit_tip(), which checks recent submissions from the same
-- (hashed) IP and inserts only if under the limit.
-- Run in the Supabase SQL editor after 0002_tips.sql.
-- =====================================================================

alter table public.tips add column if not exists ip_hash text;
create index if not exists tips_ip_created_idx on public.tips (ip_hash, created_at desc);

-- no more direct public inserts
drop policy if exists "tips public insert" on public.tips;

create or replace function public.submit_tip(p_message text, p_ip_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  msg text := btrim(coalesce(p_message, ''));
begin
  if char_length(msg) not between 1 and 5000 then
    return 'invalid';
  end if;

  -- limits: 3 per hour and 10 per day per IP
  if p_ip_hash is not null then
    if (select count(*) from public.tips
         where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 3
       or (select count(*) from public.tips
            where ip_hash = p_ip_hash and created_at > now() - interval '1 day') >= 10 then
      return 'rate_limited';
    end if;
  end if;

  insert into public.tips (message, ip_hash) values (msg, p_ip_hash);
  return 'ok';
end $$;

revoke all on function public.submit_tip(text, text) from public;
grant execute on function public.submit_tip(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
