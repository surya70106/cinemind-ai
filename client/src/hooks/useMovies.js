import { useState, useEffect, useCallback } from 'react';
import {
  getTrending,
  getPopular,
  getTopRated,
  getHiddenGems,
  getShowDetails,
  searchShows,
} from '../lib/tvmaze';

/**
 * Generic fetcher hook — returns { data, loading, error, refetch }
 */
function useFetch(fetcher, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!fetcher) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      const d = result?.results || result;
      setData(Array.isArray(d) ? d : d);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (immediate && fetcher) {
      fetch();
    }
  }, [fetch, immediate, fetcher]);

  return { data, loading, error, refetch: fetch };
}

export function useTrending() {
  return useFetch(getTrending);
}

export function usePopular() {
  return useFetch(getPopular);
}

export function useTopRated() {
  return useFetch(getTopRated);
}

export function useUpcoming() {
  return useFetch(getTrending);
}

export function useHiddenGems() {
  return useFetch(getHiddenGems);
}

export function useMovieDetails(id) {
  return useFetch(id ? () => getShowDetails(id) : null, !!id);
}

export function useSearchMovies(query) {
  return useFetch(query ? () => searchShows(query) : null, !!query);
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
      const result = await searchShows(query);
      const d = result?.results || result;
      setData(Array.isArray(d) ? d : []);
    } catch (err) {
      setError(err.message);
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
