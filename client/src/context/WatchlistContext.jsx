import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { supabase, WATCHLIST_TABLE } from '../lib/supabase';
import { useAuth } from './AuthContext';
import WatchedRatingModal from '../components/WatchedRatingModal';

const WatchlistContext = createContext(null);

function mapRow(row) {
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

function toMovieEntry(movie, extra = {}) {
  return {
    id: movie.id,
    title: movie.title || movie.name,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    user_rating: null,
    watched: false,
    liked: false,
    added_at: new Date().toISOString(),
    ...extra,
  };
}

export function WatchlistProvider({ children }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingSaving, setRatingSaving] = useState(false);

  const guardAuth = useCallback(() => {
    if (isAuthenticated) return true;
    navigate('/login', { state: { from: window.location.pathname } });
    return false;
  }, [isAuthenticated, navigate]);

  // Fetch watchlist from Supabase whenever user changes
  useEffect(() => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(WATCHLIST_TABLE)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setItems((data || []).map(mapRow));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [user?.id]);

  const addToWatchlist = useCallback(async (movie) => {
    if (!guardAuth()) return;

    const entry = toMovieEntry(movie);
    setItems((prev) => {
      if (prev.some((m) => m.id === movie.id)) return prev;
      return [entry, ...prev];
    });

    try {
      const { error } = await supabase.from(WATCHLIST_TABLE).upsert({
        user_id: user.id,
        movie_id: Number(movie.id),
        movie_title: entry.title,
        poster: entry.poster_path || '',
      }, { onConflict: 'user_id,movie_id', ignoreDuplicates: true });
      if (error && error.code !== '23505') throw error;
    } catch {
      setItems((prev) => prev.filter((m) => m.id !== movie.id));
    }
  }, [guardAuth, user?.id]);

  const removeFromWatchlist = useCallback(async (movieId) => {
    if (!guardAuth()) return;

    const prev = items;
    setItems((curr) => curr.filter((m) => m.id !== movieId));

    try {
      const { error } = await supabase
        .from(WATCHLIST_TABLE)
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', Number(movieId));
      if (error) throw error;
    } catch {
      setItems(prev);
    }
  }, [guardAuth, items, user?.id]);

  const confirmWatchedWithRating = useCallback(async (movie, rating) => {
    if (!guardAuth()) return;
    setRatingSaving(true);

    setItems((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      const updated = { ...toMovieEntry(movie), watched: true, user_rating: rating };
      if (exists) return prev.map((m) => m.id === movie.id ? { ...m, ...updated } : m);
      return [updated, ...prev];
    });

    try {
      // Ensure row exists first
      await supabase.from(WATCHLIST_TABLE).upsert({
        user_id: user.id,
        movie_id: Number(movie.id),
        movie_title: movie.title || movie.name || '',
        poster: movie.poster_path || '',
      }, { onConflict: 'user_id,movie_id', ignoreDuplicates: true });

      // Then update watched + rating
      const { error } = await supabase
        .from(WATCHLIST_TABLE)
        .update({ watched: true, user_rating: rating })
        .eq('user_id', user.id)
        .eq('movie_id', Number(movie.id));
      if (error) throw error;
      setRatingModal(null);
    } catch {
      // Revert by refetching
      const { data } = await supabase
        .from(WATCHLIST_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setItems((data || []).map(mapRow));
    } finally {
      setRatingSaving(false);
    }
  }, [guardAuth, user?.id]);

  const openWatchRating = useCallback((movie) => {
    if (!guardAuth()) return;
    const existing = items.find((m) => m.id === movie.id);
    if (existing?.watched) return;
    setRatingModal({
      ...movie,
      id: movie.id,
      title: movie.title || movie.name,
      vote_average: movie.vote_average ?? existing?.vote_average,
      user_rating: existing?.user_rating,
      poster_path: movie.poster_path ?? existing?.poster_path,
      editMode: false,
    });
  }, [guardAuth, items]);

  const openEditRating = useCallback((movie) => {
    if (!guardAuth()) return;
    const existing = items.find((m) => m.id === movie.id) || movie;
    if (!existing?.watched) return;
    setRatingModal({
      ...existing,
      editMode: true,
    });
  }, [guardAuth, items]);

  const toggleLiked = useCallback(async (movieId) => {
    if (!guardAuth()) return;
    const item = items.find((m) => m.id === movieId);
    if (!item) return;

    setItems((curr) => curr.map((m) => m.id === movieId ? { ...m, liked: !m.liked } : m));

    const { error } = await supabase
      .from(WATCHLIST_TABLE)
      .update({ liked: !item.liked })
      .eq('user_id', user.id)
      .eq('movie_id', Number(movieId));

    if (error) {
      setItems((curr) => curr.map((m) => m.id === movieId ? { ...m, liked: item.liked } : m));
    }
  }, [guardAuth, items, user?.id]);

  const likeMovie = useCallback(async (movie) => {
    if (!guardAuth()) return;
    const existing = items.find((m) => m.id === movie.id);
    if (existing) {
      toggleLiked(movie.id);
      return;
    }
    await addToWatchlist(movie);
    // Small delay to let the row be created, then like it
    setTimeout(() => toggleLiked(movie.id), 300);
  }, [guardAuth, items, addToWatchlist, toggleLiked]);

  const watchMovie = useCallback((movie) => {
    const existing = items.find((m) => m.id === movie.id);
    if (existing?.watched) { openEditRating(existing); return; }
    openWatchRating(movie);
  }, [items, openWatchRating, openEditRating]);

  const isInWatchlist = useCallback((movieId) =>
    isAuthenticated && items.some((m) => m.id === movieId), [items, isAuthenticated]);

  const isLiked = useCallback((movieId) =>
    isAuthenticated && (items.find((m) => m.id === movieId)?.liked || false), [items, isAuthenticated]);

  const isWatched = useCallback((movieId) =>
    isAuthenticated && (items.find((m) => m.id === movieId)?.watched || false), [items, isAuthenticated]);

  const getUserRating = useCallback((movieId) =>
    items.find((m) => m.id === movieId)?.user_rating ?? null, [items]);

  return (
    <WatchlistContext.Provider value={{
      items, loading,
      addToWatchlist, removeFromWatchlist,
      toggleLiked, likeMovie, watchMovie,
      isInWatchlist, isLiked, isWatched, getUserRating,
      openWatchRating, openEditRating, guardAuth,
    }}>
      {children}
      <WatchedRatingModal
        movie={ratingModal}
        open={!!ratingModal}
        saving={ratingSaving}
        onClose={() => !ratingSaving && setRatingModal(null)}
        onConfirm={(rating) => confirmWatchedWithRating(ratingModal, rating)}
      />
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useWatchlist must be used within a WatchlistProvider');
  return context;
}

export default WatchlistContext;
