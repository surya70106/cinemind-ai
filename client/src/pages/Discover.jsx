import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { searchShows, getPopular, getTopRated, getTrending } from '../lib/tvmaze';
import MoodSelector from '../components/MoodSelector';
import GenreChips from '../components/GenreChips';
import MovieCard from '../components/MovieCard';
import { useNavbarHeight } from '../hooks/useNavbarHeight';

export default function Discover() {
  const [searchParams] = useSearchParams();
  const initialMood = searchParams.get('mood') || '';

  const [mood, setMood] = useState(initialMood);
  const [genres, setGenres] = useState([]);
  const [referenceMovie, setReferenceMovie] = useState('');
  const [actor, setActor] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMode, setSearchMode] = useState('mood'); // 'mood' or 'genre'

  useEffect(() => {
    if (initialMood) {
      setMood(initialMood);
      setSearchMode('mood');
      handleMoodDiscover(initialMood);
    }
  }, []);

  // Search by mood using Claude AI via Vercel serverless function
  const handleMoodDiscover = async (overrideMood) => {
    const selectedMood = overrideMood || mood;
    if (!selectedMood) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recommend',
          mood: selectedMood,
          genre: genres.join(', '),
          referenceMovie,
          actor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'AI request failed');
      setResults(data.data || data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Search by genre using TVMaze search
  const handleGenreDiscover = async () => {
    if (genres.length === 0) return;

    setLoading(true);
    setHasSearched(true);
    try {
      // Search for each genre and combine results
      const allResults = [];
      const seenIds = new Set();

      for (const genre of genres.slice(0, 3)) {
        const data = await searchShows(genre);
        const items = data?.results || [];
        if (Array.isArray(items)) {
          for (const item of items) {
            if (!seenIds.has(item.id)) {
              const showGenres = (item.genres || item.genre_names || []).map(g =>
                typeof g === 'string' ? g.toLowerCase() : (g.name || '').toLowerCase()
              );
              const matchesGenre = genres.some(sg => showGenres.includes(sg.toLowerCase()));
              if (matchesGenre || genres.length === 0) {
                seenIds.add(item.id);
                allResults.push(item);
              }
            }
          }
        }
      }

      // Also search popular + top-rated and filter by genre
      const listFetchers = [getPopular, getTopRated, getTrending];
      for (const fetcher of listFetchers) {
        try {
          const data = await fetcher();
          const items = data?.results || [];
          if (Array.isArray(items)) {
            for (const item of items) {
              if (!seenIds.has(item.id)) {
                const showGenres = (item.genres || item.genre_names || []).map(g =>
                  typeof g === 'string' ? g.toLowerCase() : (g.name || '').toLowerCase()
                );
                const matchesGenre = genres.some(sg => showGenres.includes(sg.toLowerCase()));
                if (matchesGenre) {
                  seenIds.add(item.id);
                  allResults.push(item);
                }
              }
            }
          }
        } catch {}
      }

      setResults(allResults.slice(0, 24));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = () => {
    if (mood) {
      handleMoodDiscover();
    } else if (genres.length > 0) {
      handleGenreDiscover();
    }
  };

  const handleGenreToggle = (genre) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const canSearch = mood || genres.length > 0;
  const hasActiveFilters = mood || genres.length > 0;

  const navH = useNavbarHeight();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-bg-primary pb-16"
      style={{ paddingTop: navH + 32 }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-accent-green text-3xl">explore</span>
            <h1 className="text-headline text-text-primary">Discover</h1>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed max-w-xl">
            Find your next favorite show by mood, genre, or both. Powered by AI recommendations.
          </p>
        </motion.div>

        {/* Active Filter Pills */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-6 flex-wrap"
            >
              <span className="text-text-muted text-xs mr-1">Active:</span>
              {mood && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/25 text-accent-green text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">mood</span>
                  {mood}
                  <button
                    onClick={() => setMood('')}
                    className="ml-1 p-0.5 rounded-full hover:bg-accent-green/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </motion.span>
              )}
              {genres.map(g => (
                <motion.span
                  key={g}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/25 text-accent-blue text-xs font-semibold"
                >
                  {g}
                  <button
                    onClick={() => handleGenreToggle(g)}
                    className="ml-1 p-0.5 rounded-full hover:bg-accent-blue/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="panel panel-body mb-10"
        >
          {/* Panel Header */}
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-accent-green text-xl">tune</span>
            <span className="text-label-caps text-accent-green tracking-[0.2em] uppercase">
              Filters
            </span>
          </div>

          {/* Mood Section */}
          <div className="mb-6">
            <label className="text-label-caps text-accent-green tracking-[0.2em] uppercase block mb-3">
              Select a Mood
            </label>
            <MoodSelector compact />
          </div>

          {/* Genre Section */}
          <div className="mb-6">
            <label className="text-label-caps text-accent-green tracking-[0.2em] uppercase block mb-3">
              Filter by Genre
            </label>
            <GenreChips selected={genres} onToggle={handleGenreToggle} />
          </div>

          {/* Text Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-label-caps text-accent-green tracking-[0.2em] uppercase block mb-2">
                Reference Show
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                  movie
                </span>
                <input
                  type="text"
                  value={referenceMovie}
                  onChange={(e) => setReferenceMovie(e.target.value)}
                  placeholder="e.g. Breaking Bad"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-label-caps text-accent-green tracking-[0.2em] uppercase block mb-2">
                Actor
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                  person
                </span>
                <input
                  type="text"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="e.g. Bryan Cranston"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Discover Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleDiscover}
              disabled={!canSearch || loading}
              className="inline-flex items-center gap-2 bg-accent-green-container hover:bg-accent-green text-bg-primary font-bold rounded-lg px-8 py-3 text-sm disabled:opacity-40 disabled:hover:bg-accent-green-container transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  Discovering...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    {mood ? 'auto_awesome' : 'search'}
                  </span>
                  {mood ? 'AI Discover' : 'Browse by Genre'}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
            {!canSearch && (
              <p className="text-xs text-text-muted flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">info</span>
                Select a mood or genre to get started.
              </p>
            )}
          </div>
        </motion.div>

        {/* Results */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-accent-green text-xl animate-spin">progress_activity</span>
              <span className="text-label-caps text-accent-green tracking-[0.2em] uppercase">Searching...</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="poster-aspect skeleton rounded-lg" />
              ))}
            </div>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-green text-xl">theaters</span>
                <span className="text-label-caps text-accent-green tracking-[0.2em] uppercase">
                  {results.length} {results.length === 1 ? 'Result' : 'Results'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {results.map((movie, i) => (
                <motion.div
                  key={movie.id || movie.title || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <MovieCard movie={movie} index={i} />
                  {movie.reason && (
                    <p className="text-[11px] text-text-muted italic mt-1.5 line-clamp-2 px-0.5 leading-relaxed">
                      {movie.reason}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : hasSearched ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-text-muted text-3xl">search_off</span>
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-2">No shows found</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Try a different mood or genre combination to discover something new.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-accent-green text-3xl">movie_filter</span>
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-2">Ready to discover?</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Pick a mood or select genres above, then click Discover to find your next binge.
            </p>
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
