create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.assign_initial_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin')
     or lower(new.email) = 'elmadnim@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_assign_admin after insert on auth.users
for each row execute function public.assign_initial_admin();

create table public.site_media (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('hero','production','fleet','facilities','quarry')),
  kind text not null check (kind in ('image','video')),
  storage_path text not null unique,
  title_ar text not null default '',
  title_en text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.site_media to anon, authenticated;
grant insert, update, delete on public.site_media to authenticated;
grant all on public.site_media to service_role;
alter table public.site_media enable row level security;
create policy "Anyone can view site media" on public.site_media for select to anon, authenticated using (true);
create policy "Admins insert site media" on public.site_media for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admins update site media" on public.site_media for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins delete site media" on public.site_media for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "Anyone can read site media files" on storage.objects for select to anon, authenticated using (bucket_id = 'site-media');
create policy "Admins upload site media files" on storage.objects for insert to authenticated with check (bucket_id = 'site-media' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete site media files" on storage.objects for delete to authenticated using (bucket_id = 'site-media' and public.has_role(auth.uid(),'admin'));