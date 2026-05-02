# Nova Nurox — Supabase Setup

> ⚠️ **If you see "Could not find the table 'public.school_partnerships'"** or the Supabase Table Editor shows "Failed to fetch", run the SQL in **Section 3** below in your Supabase SQL Editor. Tables don't appear until you run the SQL.

## 1. Project credentials
Already configured in `.env`:
```
VITE_SUPABASE_URL=https://cyeskvdockcojtremqqa.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## 2. Create your Admin user (with TOTP)
1. Supabase → **Authentication → Users → Add user** (email + password).
2. Sign in at `/admin/login`.
3. On `/admin/mfa` enroll a TOTP factor (Google Authenticator / Authy).

---

## 3. Master SQL — run this entire block in Supabase SQL Editor

This block is **idempotent** — safe to re-run. It creates all 3 tables (signups, school_partnerships, student_enrollments) plus RLS policies and the `paid_count()` RPC.

```sql
-- =============================================================
-- 1) SIGNUPS (Alpha Batch — direct individual signups)
-- =============================================================
create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{10}$'),
  city text,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.signups enable row level security;

drop policy if exists "anyone can signup" on public.signups;
create policy "anyone can signup"
  on public.signups for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admin can read"   on public.signups;
drop policy if exists "admin can update" on public.signups;
drop policy if exists "admin can delete" on public.signups;

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

-- Public seat counter (paid signups)
create or replace function public.paid_count()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.signups where paid = true;
$$;

grant execute on function public.paid_count() to anon, authenticated;

-- =============================================================
-- 2) SCHOOL_PARTNERSHIPS (used by /partner form + /enroll dropdown)
-- =============================================================
create table if not exists public.school_partnerships (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  principal_name text not null,
  contact_person text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{10}$'),
  preferred_start_date date not null,
  agreed_payment_model boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.school_partnerships enable row level security;

drop policy if exists "anyone can submit partnership"   on public.school_partnerships;
drop policy if exists "admin can read partnerships"     on public.school_partnerships;
drop policy if exists "admin can update partnerships"   on public.school_partnerships;
drop policy if exists "admin can delete partnerships"   on public.school_partnerships;
drop policy if exists "anon can read approved schools"  on public.school_partnerships;

-- Anyone can submit a partnership request
create policy "anyone can submit partnership"
  on public.school_partnerships for insert
  to anon, authenticated
  with check (true);

-- Anyone can read just the school_name list (so /enroll dropdown works for visitors).
-- Note: PostgREST applies SELECT policies row-by-row, not column-by-column, so this
-- means the FULL row is technically visible. If you want to hide PII (principal name,
-- WhatsApp), keep this policy disabled and instead create a SECURITY DEFINER function
-- that returns only school names — see "Hide PII" section below.
create policy "anon can read approved schools"
  on public.school_partnerships for select
  to anon, authenticated
  using (true);

-- Admin full access
create policy "admin can read partnerships"
  on public.school_partnerships for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can update partnerships"
  on public.school_partnerships for update
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can delete partnerships"
  on public.school_partnerships for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

-- =============================================================
-- 3) STUDENT_ENROLLMENTS (used by /enroll page)
-- =============================================================
create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  class_section text not null,
  school_name text not null,
  parent_whatsapp text not null check (parent_whatsapp ~ '^[0-9]{10}$'),
  paid boolean not null default false,
  batch_number int,
  created_at timestamptz not null default now()
);

alter table public.student_enrollments enable row level security;

drop policy if exists "anyone can enroll"            on public.student_enrollments;
drop policy if exists "admin can read enrollments"   on public.student_enrollments;
drop policy if exists "admin can update enrollments" on public.student_enrollments;
drop policy if exists "admin can delete enrollments" on public.student_enrollments;

create policy "anyone can enroll"
  on public.student_enrollments for insert
  to anon, authenticated
  with check (true);

create policy "admin can read enrollments"
  on public.student_enrollments for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can update enrollments"
  on public.student_enrollments for update
  to authenticated
  using  ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');

create policy "admin can delete enrollments"
  on public.student_enrollments for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'nuroxindiaofficial@gmail.com');
```

After running, refresh the Supabase Table Editor. The 3 tables should appear under `public`.

---

## 4. (Optional) Hide PII from /enroll dropdown

The default policy above lets anyone read the full `school_partnerships` rows so the dropdown works. If you want to expose ONLY school names publicly (and keep principal/WhatsApp admin-only), run this and remove the `anon can read approved schools` policy above:

```sql
drop policy if exists "anon can read approved schools" on public.school_partnerships;

create or replace function public.list_partner_schools()
returns table(school_name text)
language sql
security definer
set search_path = public
as $$
  select distinct school_name from public.school_partnerships order by school_name;
$$;

grant execute on function public.list_partner_schools() to anon, authenticated;
```

Then update `src/pages/Enroll.tsx` to call `supabase.rpc('list_partner_schools')` instead of `.from('school_partnerships').select(...)`.

---

## 5. Troubleshooting

- **"Failed to fetch" in Supabase Table Editor**: usually a transient network issue. Hard-refresh the Supabase dashboard or check your connection. If persistent, try a different browser.
- **"Could not find the table 'public.X' in the schema cache"**: the table doesn't exist yet — run Section 3 SQL.
- **Form submits but admin sees nothing**: confirm you're signed in as `nuroxindiaofficial@gmail.com` (the admin email in the RLS policies). Change the email in the policies if you use a different one.

## 6. Render Deployment notes
Build: `npm install --include=dev && npm run build`
Start: `npm run start`
