-- Media workflow controls: sortable uploads, generated video posters, and an admin-only audit log.
-- Safe to run after 20261009010000_managed_media_library.sql.

alter table public.site_media
  add column if not exists poster_path text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'site_media_sort_order_range'
      and conrelid = 'public.site_media'::regclass
  ) then
    alter table public.site_media
      add constraint site_media_sort_order_range
      check (sort_order between -10000 and 10000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'site_media_poster_path_length'
      and conrelid = 'public.site_media'::regclass
  ) then
    alter table public.site_media
      add constraint site_media_poster_path_length
      check (poster_path is null or length(poster_path) between 1 and 1024);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'site_media_distinct_poster_path'
      and conrelid = 'public.site_media'::regclass
  ) then
    alter table public.site_media
      add constraint site_media_distinct_poster_path
      check (poster_path is null or poster_path <> storage_path);
  end if;
end $$;

create index if not exists site_media_section_sort_order_idx
  on public.site_media (section, sort_order, created_at desc);

create unique index if not exists site_media_poster_path_unique_idx
  on public.site_media (poster_path)
  where poster_path is not null;

create table if not exists public.media_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity text not null check (entity in ('site_media', 'media_overrides')),
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists media_audit_log_created_at_idx
  on public.media_audit_log (created_at desc);

create index if not exists media_audit_log_entity_idx
  on public.media_audit_log (entity, entity_id, created_at desc);

alter table public.media_audit_log enable row level security;
revoke all on public.media_audit_log from anon, authenticated;
grant select on public.media_audit_log to authenticated;
grant all on public.media_audit_log to service_role;

drop policy if exists "Admins read media audit log" on public.media_audit_log;
create policy "Admins read media audit log"
  on public.media_audit_log
  for select
  to authenticated
  using ((select private.is_admin()));

create or replace function private.touch_site_media_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_site_media_updated_at() from public, anon, authenticated;

drop trigger if exists site_media_touch_updated_at on public.site_media;
create trigger site_media_touch_updated_at
before update on public.site_media
for each row execute function private.touch_site_media_updated_at();

create or replace function private.log_media_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_record jsonb;
  new_record jsonb;
  record_id text;
begin
  old_record := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_record := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  record_id := coalesce(
    new_record ->> 'id',
    old_record ->> 'id',
    new_record ->> 'target_key',
    old_record ->> 'target_key',
    ''
  );

  insert into public.media_audit_log (
    actor_id,
    action,
    entity,
    entity_id,
    before_data,
    after_data
  ) values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    record_id,
    old_record,
    new_record
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.log_media_change() from public, anon, authenticated, service_role;

drop trigger if exists site_media_audit_changes on public.site_media;
create trigger site_media_audit_changes
after insert or update or delete on public.site_media
for each row execute function private.log_media_change();

drop trigger if exists media_overrides_audit_changes on public.media_overrides;
create trigger media_overrides_audit_changes
after insert or update or delete on public.media_overrides
for each row execute function private.log_media_change();

-- Poster objects are registered through site_media.poster_path and inherit the same
-- public signed-read rule as the primary upload. Pending objects remain admin-only.
drop policy if exists "Anyone can read registered site media files" on storage.objects;
create policy "Anyone can read registered site media files"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'site-media'
    and exists (
      select 1
      from public.site_media media
      where media.storage_path = name or media.poster_path = name
    )
  );
