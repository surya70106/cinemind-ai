-- CineMind watchlist table (run in Supabase SQL Editor)

create table if not exists public.watchlist (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  movie_id bigint,
  movie_title text not null,
  poster text,
  watched boolean not null default false,
  liked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Prevent duplicate shows per user
create unique index if not exists watchlist_user_movie_idx
  on public.watchlist (user_id, movie_id);

create index if not exists watchlist_user_id_idx
  on public.watchlist (user_id);

alter table public.watchlist enable row level security;

-- Users can only access their own rows (when using Supabase Auth JWT)
create policy "watchlist_select_own"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "watchlist_insert_own"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "watchlist_update_own"
  on public.watchlist for update
  using (auth.uid() = user_id);

create policy "watchlist_delete_own"
  on public.watchlist for delete
  using (auth.uid() = user_id);
