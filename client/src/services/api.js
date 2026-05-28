import { supabase, assertSupabaseConfigured } from '../lib/supabase';

async function getAuthHeaders(extra = {}) {
  assertSupabaseConfigured();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = { 'Content-Type': 'application/json', ...extra };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function apiRequest(path, options = {}) {
  const headers = await getAuthHeaders(options.headers);
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error || payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload;
}

export const watchlistApi = {
  async list() {
    return apiRequest('/api/watchlist');
  },
  async add(movie) {
    return apiRequest('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({
        movie_id: Number(movie.id),
        movie_title: movie.title || movie.name || '',
        poster: movie.poster_path || '',
      }),
    });
  },
  async remove(movieId) {
    return apiRequest('/api/watchlist', {
      method: 'DELETE',
      body: JSON.stringify({ movie_id: Number(movieId) }),
    });
  },
  async update(movieId, updates) {
    return apiRequest('/api/watchlist', {
      method: 'PATCH',
      body: JSON.stringify({ movie_id: Number(movieId), ...updates }),
    });
  },
};
