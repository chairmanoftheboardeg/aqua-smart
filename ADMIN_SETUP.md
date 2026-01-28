# AquaSmart Website (GitHub Pages + Supabase)

This site is fully static (GitHub Pages) and uses Supabase for:
- Announcement banner (`site_settings`)
- Inquiries (`inquiries`)
- Jobs (`jobs`)
- Applications (`job_applications`)
- Admin access checks (`staff_profiles` + RLS policies)

## 1) Supabase config
Config is stored in: `assets/js/config.js`

It contains the public URL and publishable anon key (safe for browser use).
Do **not** add the service role key anywhere in this repo.

## 2) Admin access
Admin login uses Supabase Auth (email + password).

To grant admin access:
1. Create the user in Supabase Auth
2. Copy their UID
3. Insert a matching row into `public.staff_profiles` using that UID as `user_id`

RLS checks `public.is_staff()` which depends on that linkage.

## 3) About page team section (PUBLIC)
Right now your backend policies likely allow only staff to read `staff_profiles`.
But the About page is public, and you want to show the team publicly.

### Recommended patch (create a public team table)
Run this in Supabase SQL Editor:

```sql
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text,
  bio text,
  photo_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

drop trigger if exists trg_team_members_updated_at on public.team_members;
create trigger trg_team_members_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();

-- Public can read published team members
drop policy if exists "Public can read published team members" on public.team_members;
create policy "Public can read published team members"
on public.team_members for select
to anon, authenticated
using (is_published = true);

-- Staff manage team
drop policy if exists "Staff can insert team members" on public.team_members;
create policy "Staff can insert team members"
on public.team_members for insert
to authenticated
with check (public.is_staff());

drop policy if exists "Staff can update team members" on public.team_members;
create policy "Staff can update team members"
on public.team_members for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Staff can delete team members" on public.team_members;
create policy "Staff can delete team members"
on public.team_members for delete
to authenticated
using (public.is_staff());
```

Once added, the About page will automatically load from `team_members` (preferred) and show name, WhatsApp, bio and photo.

## 4) GitHub Pages setup
- Upload the entire folder to your repo root.
- Ensure GitHub Pages is enabled on the `main` branch (root).
- Paths use `/about/`, `/services/`, etc (folder + `index.html`).

## 5) Notes
- Footer and key pages clearly show: "Website and IT Services managed by BlueWave Digital"
- Admin dashboard replies use your own email client (mailto). No automated emails.
