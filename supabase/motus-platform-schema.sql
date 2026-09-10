-- Dedicated Motus account and community schema. Apply only to the Motus project.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z][a-z0-9_]{2,29}$'),
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 2000),
  created_at timestamptz not null default now()
);
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z][a-z0-9_]{2,29}$'),
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 3000),
  rules text not null default '' check (char_length(rules) <= 5000),
  owner_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index communities_owner_idx on public.communities(owner_id);
create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members(user_id);
create table public.works (
  id uuid primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  author text not null check (char_length(trim(author)) between 1 and 200),
  summary text not null default '' check (char_length(summary) <= 5000),
  tags text[] not null default '{}' check (cardinality(tags) <= 50),
  language text not null check (char_length(language) between 1 and 100),
  rating text not null check (rating in ('General','Teen','Mature','Explicit')),
  status text not null check (status in ('Ongoing','Complete')),
  format text not null check (format in ('scroll','page','spread')),
  page_count integer not null check (page_count between 1 and 100),
  animated boolean not null default false,
  cover text not null default '' check (char_length(cover) <= 250000 and (cover = '' or cover ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+=*$')),
  edition_path text not null check (split_part(edition_path, '/', 1) = owner_id::text and char_length(edition_path) <= 240),
  community_id uuid references public.communities(id) on delete set null,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create index works_owner_idx on public.works(owner_id);
create index works_community_idx on public.works(community_id);
create index works_public_updated_idx on public.works(updated_at desc) where published;
create table public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id, work_id)
);
create index bookmarks_work_idx on public.bookmarks(work_id);
create table public.creator_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id, creator_id),
  check (user_id <> creator_id)
);
create index creator_follows_creator_idx on public.creator_follows(creator_id);
create table public.reading_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}' check (jsonb_typeof(settings) = 'object' and octet_length(settings::text) <= 4000)
);
create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 10 and 2000),
  created_at timestamptz not null default now(), unique(reporter_id, work_id)
);
create index reports_work_idx on public.content_reports(work_id);

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.works enable row level security;
alter table public.bookmarks enable row level security;
alter table public.creator_follows enable row level security;
alter table public.reading_preferences enable row level security;
alter table public.content_reports enable row level security;

grant select on public.profiles, public.communities, public.community_members, public.works to anon, authenticated;
grant insert, update on public.profiles, public.communities, public.works to authenticated;
grant insert, delete on public.community_members, public.bookmarks, public.creator_follows to authenticated;
grant select on public.bookmarks, public.creator_follows, public.reading_preferences, public.content_reports to authenticated;
grant insert, update on public.reading_preferences to authenticated;
grant insert on public.content_reports to authenticated;

create policy profiles_read on public.profiles for select to anon, authenticated using (true);
create policy profiles_create on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_edit on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy communities_read on public.communities for select to anon, authenticated using (true);
create policy communities_create on public.communities for insert to authenticated with check (owner_id = (select auth.uid()));
create policy communities_edit on public.communities for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy members_read on public.community_members for select to anon, authenticated using (true);
create policy members_join on public.community_members for insert to authenticated with check (user_id = (select auth.uid()));
create policy members_leave on public.community_members for delete to authenticated using (user_id = (select auth.uid()));
create policy works_read on public.works for select to anon, authenticated using (published or owner_id = (select auth.uid()));
create policy works_create on public.works for insert to authenticated with check (
  owner_id = (select auth.uid()) and (community_id is null or
  exists(select 1 from public.community_members m where m.community_id = works.community_id and m.user_id = (select auth.uid())) or
  exists(select 1 from public.communities c where c.id = works.community_id and c.owner_id = (select auth.uid())))
);
create policy works_edit on public.works for update to authenticated using (owner_id = (select auth.uid())) with check (
  owner_id = (select auth.uid()) and (community_id is null or
  exists(select 1 from public.community_members m where m.community_id = works.community_id and m.user_id = (select auth.uid())) or
  exists(select 1 from public.communities c where c.id = works.community_id and c.owner_id = (select auth.uid())))
);
create policy bookmarks_read on public.bookmarks for select to authenticated using (user_id = (select auth.uid()));
create policy bookmarks_add on public.bookmarks for insert to authenticated with check (user_id = (select auth.uid()));
create policy bookmarks_remove on public.bookmarks for delete to authenticated using (user_id = (select auth.uid()));
create policy follows_read on public.creator_follows for select to authenticated using (user_id = (select auth.uid()));
create policy follows_add on public.creator_follows for insert to authenticated with check (user_id = (select auth.uid()));
create policy follows_remove on public.creator_follows for delete to authenticated using (user_id = (select auth.uid()));
create policy preferences_read on public.reading_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy preferences_create on public.reading_preferences for insert to authenticated with check (user_id = (select auth.uid()));
create policy preferences_edit on public.reading_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reports_read on public.content_reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy reports_create on public.content_reports for insert to authenticated with check (reporter_id = (select auth.uid()));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('comic-editions', 'comic-editions', false, 50000000, array['application/json']);
create policy editions_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'comic-editions' and (
  (storage.foldername(name))[1] = (select auth.uid())::text or
  exists(select 1 from public.works w where w.edition_path = name and w.published))
);
create policy editions_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'comic-editions' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy editions_remove on storage.objects for delete to authenticated using (
  bucket_id = 'comic-editions' and (storage.foldername(name))[1] = (select auth.uid())::text
);
