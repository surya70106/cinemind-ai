# Supabase setup for CineMind watchlist

## 1. Create the table

In Supabase Dashboard → **SQL Editor**, run the script:

`supabase/watchlist.sql`

This creates `watchlist` with your columns plus `movie_id`, `watched`, and `liked` (needed for the app UI).

## 2. Server environment

Edit `server/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_publishable_key_here
SUPABASE_WATCHLIST_TABLE=watchlist
```

Get **Project URL** and **anon / publishable key** from:  
**Project Settings → API**

Restart the server after saving.

## 3. Test

1. Sign in on the site
2. Add a show to your watchlist
3. In Supabase → **Table Editor → watchlist**, you should see a new row with `user_id`, `movie_title`, `poster`, `created_at`

## Column mapping

| Supabase column | App usage        |
|-----------------|------------------|
| `id`            | Row id (int8)    |
| `user_id`       | UUID per user    |
| `movie_title`   | Show title       |
| `poster`        | Poster URL       |
| `created_at`    | Added timestamp  |
| `movie_id`      | TMDB / show id   |
| `watched`       | Watched toggle   |
| `liked`         | Liked toggle     |

Each MongoDB user gets a stable `supabaseUserId` (UUID) stored on first watchlist use.
