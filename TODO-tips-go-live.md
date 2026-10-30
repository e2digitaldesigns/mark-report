# News tips: before going live

The tip form, per-IP limit and CAPTCHA all work locally using Cloudflare's
always-pass **test** keys in `.env.local`. Do these before deploying.

## 1. Create a real Turnstile widget (free)

1. Sign in at <https://dash.cloudflare.com> → **Turnstile** → **Add widget**.
2. Add your production domain (and `localhost` if you want to test with real keys).
3. Copy the **site key** and **secret key**.

## 2. Set production environment variables

In your host's settings (e.g. Vercel → Project → Settings → Environment Variables):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | site key from step 1 |
| `TURNSTILE_SECRET_KEY` | secret key from step 1 |
| `TIP_IP_SALT` | any long random string (used to hash IPs) |

If `TURNSTILE_SECRET_KEY` is missing, the CAPTCHA check is **skipped** (a warning
is logged), so make sure it is set in production.

## 3. Swap the local test keys (optional)

`.env.local` currently has Cloudflare's published test keys:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Replace them with the real keys if you want to test the real widget locally,
then restart `npm run dev`.

## 4. Check the database

Both migrations should already be applied to your Supabase project:

- `supabase/migrations/0002_tips.sql` — `tips` table + admin-only read/manage
- `supabase/migrations/0003_tip_rate_limit.sql` — `submit_tip()` function,
  3 tips/hour and 10/day per IP

For any new environment, run them in the SQL Editor in order.

## 5. Test it

1. Submit a tip on the front page → it should say "Thanks — tip received."
2. Open `/admin/tips` → the tip appears with a "New" badge.
3. Submit 4 tips in an hour → the 4th should be refused with
   "You've sent several tips recently."

## Notes

- The client IP is read from the `x-forwarded-for` header (set by most hosts,
  including Vercel). If it's missing, the CAPTCHA still applies but the
  rate limit does not.
- To change the limits, edit the `3` / `10` in `public.submit_tip()` and
  re-run the function definition.
