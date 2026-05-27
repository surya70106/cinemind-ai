import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Generic fetcher hook — returns { data, loading, error, refetch }
 */
function useFetch(url, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result } = await api.get(url);
      const d = result.data?.results || result.data || result.results || result;
      setData(Array.isArray(d) ? d : d);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate && url) {
      fetch();
    }
  }, [fetch, immediate, url]);

  return { data, loading, error, refetch: fetch };
}

export function useTrending() {
  return useFetch('/movies/trending');
}

export function usePopular() {
  return useFetch('/movies/popular');
}

export function useTopRated() {
  return useFetch('/movies/top-rated');
}

export function useUpcoming() {
  return useFetch('/movies/upcoming');
}

export function useHiddenGems() {
  return useFetch('/movies/hidden-gems');
}

export function useMovieDetails(id) {
  return useFetch(id ? `/movies/${id}` : null, !!id);
}

export function useSearchMovies(query) {
  return useFetch(query ? `/movies/search?q=${encodeURIComponent(query)}` : null, !!query);
}

/**
 * Imperative search function for components that need manual control
 */
export function useMovieSearch() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: result } = await api.get(`/movies/search?q=${encodeURIComponent(query)}`);
      const d = result.data?.results || result.data || result.results || result;
      setData(Array.isArray(d) ? d : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, search, clear };
}
