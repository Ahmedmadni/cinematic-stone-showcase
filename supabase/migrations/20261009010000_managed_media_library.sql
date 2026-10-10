-- Review and apply on the connected project before enabling admin writes.
-- Existing roles remain unchanged. There is deliberately no first-signup admin.
do $$ begin
  create type public.app_role as enum ('admin','user');
exception when duplicate_object then null; end $$;
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
drop trigger if exists on_auth_user_created_assign_admin on auth.users;
drop function if exists public.assign_initial_admin();

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid()) and role = 'admin'::public.app_role
    )
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

create table if not exists public.site_media (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('hero','production','fleet','facilities','quarry')),
  kind text not null check(kind in ('image','video')),
  storage_path text not null unique,
  title_ar text not null default '', title_en text not null default '',
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
alter table public.site_media enable row level security;
grant select on public.site_media to anon, authenticated;
grant insert, update, delete on public.site_media to authenticated;
grant all on public.site_media to service_role;
drop policy if exists "Anyone can view site media" on public.site_media;
drop policy if exists "Admins insert site media" on public.site_media;
drop policy if exists "Admins update site media" on public.site_media;
drop policy if exists "Admins delete site media" on public.site_media;
create policy "Anyone can view site media" on public.site_media for select to anon, authenticated using(true);
create policy "Admins insert site media" on public.site_media for insert to authenticated with check((select private.is_admin()));
create policy "Admins update site media" on public.site_media for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy "Admins delete site media" on public.site_media for delete to authenticated using((select private.is_admin()));

create table if not exists public.media_overrides (
  target_key text primary key check (length(target_key) between 3 and 180),
  replacement_id text not null check (length(replacement_id) between 1 and 180),
  title_ar text not null default '' check(length(title_ar) <= 240),
  title_en text not null default '' check(length(title_en) <= 240),
  fit text not null default 'cover' check(fit in ('cover','contain')),
  focal_x integer not null default 50 check(focal_x between 0 and 100),
  focal_y integer not null default 50 check(focal_y between 0 and 100),
  updated_at timestamptz not null default now()
);
alter table public.media_overrides enable row level security;
grant select on public.media_overrides to anon, authenticated;
grant insert, update, delete on public.media_overrides to authenticated;
grant all on public.media_overrides to service_role;
drop policy if exists "Public media configuration" on public.media_overrides;
drop policy if exists "Admin media configuration" on public.media_overrides;
create policy "Public media configuration" on public.media_overrides for select to anon, authenticated using(true);
create policy "Admin media configuration" on public.media_overrides for all to authenticated
using((select private.is_admin())) with check((select private.is_admin()));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('site-media','site-media',false,52428800,array['image/webp','image/jpeg','image/png','video/mp4','video/webm'])
on conflict(id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Anyone can read site media files" on storage.objects;
drop policy if exists "Anyone can read registered site media files" on storage.objects;
drop policy if exists "Admins can read pending site media files" on storage.objects;
drop policy if exists "Admins upload site media files" on storage.objects;
drop policy if exists "Admins delete site media files" on storage.objects;
create policy "Anyone can read registered site media files" on storage.objects for select to anon, authenticated
using(bucket_id='site-media' and exists(select 1 from public.site_media m where m.storage_path=name));
create policy "Admins can read pending site media files" on storage.objects for select to authenticated
using(bucket_id='site-media' and (select private.is_admin()));
create policy "Admins upload site media files" on storage.objects for insert to authenticated
with check(bucket_id='site-media' and (select private.is_admin()));
create policy "Admins delete site media files" on storage.objects for delete to authenticated
using(bucket_id='site-media' and (select private.is_admin()));

-- The historical migration exposed a caller-supplied role check in the public schema.
-- All dependent policies have been replaced above, so remove it from the Data API surface.
drop function if exists public.has_role(uuid, public.app_role);
