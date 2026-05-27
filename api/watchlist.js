import { getSupabaseClient, getUserFromAuthHeader, handleCors } from './_lib.js';

const WATCHLIST_TABLE = 'watchlist';

function toClientRow(row) {
  return {
    id: row.movie_id,
    title: row.movie_title,
    poster_path: row.poster,
    watched: row.watched ?? false,
    liked: row.liked ?? false,
    user_rating: row.user_rating != null ? Number(row.user_rating) : null,
    added_at: row.created_at,
    rowId: row.id,
  };
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const user = await getUserFromAuthHeader(req, supabase);
  if (!user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from(WATCHLIST_TABLE)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ results: (data || []).map(toClientRow) });
  }

  if (req.method === 'POST') {
    const { movie_id, movie_title, poster } = req.body || {};
    if (!movie_id || !movie_title) {
      return res.status(400).json({ error: 'movie_id and movie_title are required' });
    }

    const { error } = await supabase.from(WATCHLIST_TABLE).upsert(
      {
        user_id: user.id,
        movie_id: Number(movie_id),
        movie_title,
        poster: poster || '',
      },
      { onConflict: 'user_id,movie_id', ignoreDuplicates: true }
    );

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'PATCH') {
    const { movie_id, watched, liked, user_rating } = req.body || {};
    if (!movie_id) return res.status(400).json({ error: 'movie_id is required' });

    const updates = {};
    if (typeof watched === 'boolean') updates.watched = watched;
    if (typeof liked === 'boolean') updates.liked = liked;
    if (user_rating !== undefined) updates.user_rating = user_rating;

    const { error } = await supabase
      .from(WATCHLIST_TABLE)
      .update(updates)
      .eq('user_id', user.id)
      .eq('movie_id', Number(movie_id));

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { movie_id } = req.body || {};
    if (!movie_id) return res.status(400).json({ error: 'movie_id is required' });

    const { error } = await supabase
      .from(WATCHLIST_TABLE)
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', Number(movie_id));

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
