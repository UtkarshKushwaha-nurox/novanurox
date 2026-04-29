# Nova Nurox — Supabase Setup

## 1. Create a Supabase Project
Go to https://supabase.com → New Project. Copy the **Project URL** and **anon (public) key** from Settings → API.

## 2. Fill in `.env`
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```
Restart the dev server after editing.

## 3. Run this SQL in Supabase SQL Editor

```sql
-- Signups table
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{10}$'),
  city text,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.signups enable row level security;

-- Anyone (anonymous) can insert their own signup
create policy "anyone can signup"
  on public.signups for insert
  to anon, authenticated
  with check (true);

-- Admin-only read / update / delete, scoped via JWT email claim.
-- IMPORTANT: do NOT use `using (true)` here — that would let ANY authenticated
-- Supabase user read all PII and toggle anyone's `paid` flag.
create policy "admin can read"
  on public.signups for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can update"
  on public.signups for update
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can delete"
  on public.signups for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

-- If you previously ran the old policies, drop them first:
--   drop policy if exists "authenticated can read"   on public.signups;
--   drop policy if exists "authenticated can update" on public.signups;

-- Public seat counter (count of paid signups, exposed via RPC so anon can call without reading rows)
create or replace function public.paid_count()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.signups where paid = true;
$$;

grant execute on function public.paid_count() to anon, authenticated;
```

## 4. Create your Admin user
In Supabase → Authentication → Users → **Add user** (email + password).
Then log in at `/admin/login` on your site.

## 5. Render Deployment (later)
This project currently uses the Lovable preview adapter (Cloudflare Workers). For Render Node.js deployment:
1. After exporting to GitHub, replace `vite.config.ts` with a standard `@tanstack/start` Node config.
2. Add to `package.json`:
   ```json
   "scripts": { "start": "node .output/server/index.mjs" }
   ```
3. In `vite.config.ts` set `server: { allowedHosts: true }` and `preview: { allowedHosts: true }`.
4. Render build command: `npm install --include=dev && npm run build`
5. Render start command: `npm run start`
