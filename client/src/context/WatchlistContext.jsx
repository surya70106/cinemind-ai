import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import WatchedRatingModal from '../components/WatchedRatingModal';
import { watchlistApi } from '../services/api';

const WatchlistContext = createContext(null);

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
        const payload = await watchlistApi.list();
        setItems(payload?.results || []);
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
      await watchlistApi.add(entry);
    } catch {
      setItems((prev) => prev.filter((m) => m.id !== movie.id));
    }
  }, [guardAuth, user?.id]);

  const removeFromWatchlist = useCallback(async (movieId) => {
    if (!guardAuth()) return;

    const prev = items;
    setItems((curr) => curr.filter((m) => m.id !== movieId));

    try {
      await watchlistApi.remove(movieId);
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
      await watchlistApi.add(movie);
      await watchlistApi.update(movie.id, { watched: true, user_rating: rating });
      setRatingModal(null);
    } catch {
      const payload = await watchlistApi.list().catch(() => ({ results: [] }));
      setItems(payload.results || []);
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

    try {
      await watchlistApi.update(movieId, { liked: !item.liked });
    } catch {
      setItems((curr) => curr.map((m) => m.id === movieId ? { ...m, liked: item.liked } : m));
    }
  }, [guardAuth, items]);

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
