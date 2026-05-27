import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import api from '../services/api';
import { useAuth } from './AuthContext';
import WatchedRatingModal from '../components/WatchedRatingModal';

const WatchlistContext = createContext(null);

function toMovieEntry(movie, extra = {}) {
  return {
    id: movie.id,
    title: movie.title || movie.name,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    user_rating: movie.user_rating ?? null,
    watched: false,
    liked: false,
    added_at: new Date().toISOString(),
    ...extra,
  };
}

export function WatchlistProvider({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingSaving, setRatingSaving] = useState(false);

  const guardAuth = useCallback(() => {
    if (isAuthenticated) return true;
    navigate('/login', { state: { from: window.location.pathname } });
    return false;
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
          const { data } = await api.get('/watchlist');
          setItems(data.watchlist || data.data || []);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [isAuthenticated]);

  const unwatchMovie = useCallback(
    async (movieId) => {
      if (!guardAuth()) return;

      setItems((current) =>
        current.map((m) =>
          m.id === movieId ? { ...m, watched: false, user_rating: null } : m
        )
      );

      try {
        await api.patch(`/watchlist/${movieId}/watched`, { watched: false });
      } catch {
        const { data } = await api.get('/watchlist');
        setItems(data.watchlist || data.data || []);
      }
    },
    [guardAuth]
  );

  const confirmWatchedWithRating = useCallback(
    async (movie, rating) => {
      if (!guardAuth()) return;

      setRatingSaving(true);
      const entry = toMovieEntry(movie, { watched: true, liked: false, user_rating: rating });

      setItems((prev) => {
        const exists = prev.some((m) => m.id === movie.id);
        if (exists) {
          return prev.map((m) => (m.id === movie.id ? { ...m, ...entry } : m));
        }
        return [...prev, entry];
      });

      try {
        await api.patch(`/watchlist/${movie.id}/watched`, {
          watched: true,
          rating,
          title: entry.title,
          posterPath: entry.poster_path,
        });
        setRatingModal(null);
      } catch {
        const { data } = await api.get('/watchlist');
        setItems(data.watchlist || data.data || []);
      } finally {
        setRatingSaving(false);
      }
    },
    [guardAuth]
  );

  const openWatchRating = useCallback(
    (movie) => {
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
    },
    [guardAuth, items]
  );

  const openEditRating = useCallback(
    (movie) => {
      if (!guardAuth()) return;
      const existing = items.find((m) => m.id === movie.id) || movie;
      if (!existing?.watched) return;

      setRatingModal({
        ...existing,
        id: existing.id,
        title: existing.title || existing.name,
        poster_path: existing.poster_path,
        user_rating: existing.user_rating,
        editMode: true,
      });
    },
    [guardAuth, items]
  );

  const addToWatchlist = useCallback(
    async (movie) => {
      if (!guardAuth()) return;

      const entry = toMovieEntry(movie);

      setItems((prev) => {
        if (prev.some((m) => m.id === movie.id)) return prev;
        return [...prev, entry];
      });

      try {
        await api.post('/watchlist/add', {
          movieId: movie.id,
          title: entry.title,
          posterPath: entry.poster_path,
        });
      } catch {
        setItems((prev) => prev.filter((m) => m.id !== movie.id));
      }
    },
    [guardAuth]
  );

  const removeFromWatchlist = useCallback(
    async (movieId) => {
      if (!guardAuth()) return;

      const prev = items;
      setItems((current) => current.filter((m) => m.id !== movieId));

      try {
        await api.delete(`/watchlist/${movieId}`);
      } catch {
        setItems(prev);
      }
    },
    [guardAuth, items]
  );

  const toggleWatched = useCallback(
    (movieId) => {
      if (!guardAuth()) return;
      const item = items.find((m) => m.id === movieId);
      if (item?.watched) {
        openEditRating(item);
        return;
      }
      openWatchRating(item || { id: movieId, title: 'Show' });
    },
    [guardAuth, items, openWatchRating, openEditRating]
  );

  const toggleLiked = useCallback(
    async (movieId) => {
      if (!guardAuth()) return;

      setItems((current) =>
        current.map((m) => (m.id === movieId ? { ...m, liked: !m.liked } : m))
      );

      try {
        await api.patch(`/watchlist/${movieId}/like`);
      } catch {
        setItems((current) =>
          current.map((m) => (m.id === movieId ? { ...m, liked: !m.liked } : m))
        );
      }
    },
    [guardAuth]
  );

  const likeMovie = useCallback(
    async (movie) => {
      if (!guardAuth()) return;

      const existing = items.find((m) => m.id === movie.id);
      if (existing) {
        toggleLiked(movie.id);
        return;
      }

      const entry = toMovieEntry(movie, { liked: true });
      setItems((prev) => [...prev, entry]);

      try {
        await api.post('/watchlist/add', {
          movieId: movie.id,
          title: entry.title,
          posterPath: entry.poster_path,
        });
        await api.patch(`/watchlist/${movie.id}/like`);
      } catch {
        setItems((prev) => prev.filter((m) => m.id !== movie.id));
      }
    },
    [guardAuth, items, toggleLiked]
  );

  const watchMovie = useCallback(
    (movie) => {
      const existing = items.find((m) => m.id === movie.id);
      if (existing?.watched) {
        openEditRating(existing);
        return;
      }
      openWatchRating(movie);
    },
    [items, openWatchRating, openEditRating]
  );

  const isInWatchlist = useCallback(
    (movieId) => isAuthenticated && items.some((m) => m.id === movieId),
    [items, isAuthenticated]
  );

  const isLiked = useCallback(
    (movieId) => (isAuthenticated && items.find((m) => m.id === movieId)?.liked) || false,
    [items, isAuthenticated]
  );

  const isWatched = useCallback(
    (movieId) => (isAuthenticated && items.find((m) => m.id === movieId)?.watched) || false,
    [items, isAuthenticated]
  );

  const getUserRating = useCallback(
    (movieId) => {
      const item = items.find((m) => m.id === movieId);
      return item?.user_rating ?? null;
    },
    [items]
  );

  const value = {
    items,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    toggleLiked,
    likeMovie,
    watchMovie,
    isInWatchlist,
    isLiked,
    isWatched,
    getUserRating,
    openEditRating,
    openWatchRating,
    guardAuth,
  };

  return (
    <WatchlistContext.Provider value={value}>
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
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

export default WatchlistContext;
