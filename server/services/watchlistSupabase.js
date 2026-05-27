import crypto from 'crypto';
import User from '../models/User.js';
import { supabase, WATCHLIST_TABLE } from '../config/supabase.js';

function mapRowToClient(row) {
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

export async function getUserUuid(mongoUserId) {
  const user = await User.findById(mongoUserId);
  if (!user) return null;

  if (!user.supabaseUserId) {
    user.supabaseUserId = crypto.randomUUID();
    await user.save();
  }

  return user.supabaseUserId;
}

export function assertSupabase() {
  if (!supabase) {
    const err = new Error('Supabase is not configured on the server');
    err.statusCode = 503;
    throw err;
  }
}

export async function listWatchlist(userUuid) {
  assertSupabase();
  const { data, error } = await supabase
    .from(WATCHLIST_TABLE)
    .select('*')
    .eq('user_id', userUuid)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRowToClient);
}

export async function addWatchlistItem(userUuid, movie) {
  assertSupabase();
  const movieId = Number(movie.movieId ?? movie.id);
  const movieTitle = movie.title || movie.movie_title || movie.name;
  const poster = movie.posterPath ?? movie.poster_path ?? movie.poster ?? '';

  const { data: existing, error: findError } = await supabase
    .from(WATCHLIST_TABLE)
    .select('id')
    .eq('user_id', userUuid)
    .eq('movie_id', movieId)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) {
    const err = new Error('Movie already in watchlist');
    err.statusCode = 409;
    throw err;
  }

  const { data, error } = await supabase
    .from(WATCHLIST_TABLE)
    .insert({
      user_id: userUuid,
      movie_id: movieId,
      movie_title: movieTitle,
      poster,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapRowToClient(data);
}

export async function removeWatchlistItem(userUuid, movieId) {
  assertSupabase();
  const { data, error } = await supabase
    .from(WATCHLIST_TABLE)
    .delete()
    .eq('user_id', userUuid)
    .eq('movie_id', Number(movieId))
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const err = new Error('Watchlist item not found');
    err.statusCode = 404;
    throw err;
  }
  return mapRowToClient(data);
}

export async function setWatchedWithRating(userUuid, movieId, { watched, rating, movie }) {
  assertSupabase();
  const id = Number(movieId);

  let { data: current, error: findError } = await supabase
    .from(WATCHLIST_TABLE)
    .select('*')
    .eq('user_id', userUuid)
    .eq('movie_id', id)
    .maybeSingle();

  if (findError) throw findError;

  if (!current && watched && movie) {
    await addWatchlistItem(userUuid, movie);
    const refetch = await supabase
      .from(WATCHLIST_TABLE)
      .select('*')
      .eq('user_id', userUuid)
      .eq('movie_id', id)
      .maybeSingle();
    if (refetch.error) throw refetch.error;
    current = refetch.data;
  }

  if (!current) {
    const err = new Error('Watchlist item not found');
    err.statusCode = 404;
    throw err;
  }

  const updates = { watched: !!watched };
  if (watched && rating != null) {
    updates.user_rating = clampRating(rating);
  }
  if (!watched) {
    updates.user_rating = null;
  }

  const { data, error } = await supabase
    .from(WATCHLIST_TABLE)
    .update(updates)
    .eq('id', current.id)
    .select('*')
    .single();

  if (error) throw error;
  return mapRowToClient(data);
}

function clampRating(v) {
  return Math.min(10, Math.max(0, Math.round(Number(v) * 10) / 10));
}

export async function toggleWatchlistField(userUuid, movieId, field) {
  assertSupabase();
  if (!['watched', 'liked'].includes(field)) {
    throw new Error('Invalid field');
  }

  const { data: current, error: findError } = await supabase
    .from(WATCHLIST_TABLE)
    .select('*')
    .eq('user_id', userUuid)
    .eq('movie_id', Number(movieId))
    .maybeSingle();

  if (findError) throw findError;
  if (!current) {
    const err = new Error('Watchlist item not found');
    err.statusCode = 404;
    throw err;
  }

  const { data, error } = await supabase
    .from(WATCHLIST_TABLE)
    .update({ [field]: !current[field] })
    .eq('id', current.id)
    .select('*')
    .single();

  if (error) throw error;
  return mapRowToClient(data);
}
