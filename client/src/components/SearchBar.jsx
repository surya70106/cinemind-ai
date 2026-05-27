import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { searchShows } from '../lib/tvmaze';

export default function SearchBar({ mobile = false }) {
  const [expanded, setExpanded] = useState(mobile);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
        if (!mobile) setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobile]);

  // Debounced search
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults(null);
      setShowResults(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchShows(query);
        const items = data?.results || [];
        setResults(Array.isArray(items) ? items.slice(0, 6) : []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      if (!mobile) setExpanded(false);
    }
    if (e.key === 'Enter' && results?.length > 0) {
      navigate(`/movie/${results[0].id}`);
      setShowResults(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence mode="wait">
        {!expanded && !mobile ? (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 bg-surface-container-high rounded-full px-4 py-2 border border-outline-variant/30 hover:border-accent-green/30 transition-colors"
          >
            <span className="material-symbols-outlined text-text-muted text-xl">search</span>
            <span className="text-text-muted text-sm">Search films...</span>
          </motion.button>
        ) : (
          <motion.div
            key="input"
            initial={{ width: mobile ? '100%' : 120, opacity: 0.5 }}
            animate={{ width: mobile ? '100%' : 280, opacity: 1 }}
            exit={{ width: 120, opacity: 0.5 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center bg-surface-container-high rounded-full px-4 py-2 border border-outline-variant/30 focus-within:border-accent-green/50 transition-colors"
          >
            <span className="material-symbols-outlined text-text-muted text-xl mr-2">search</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && results && setShowResults(true)}
              placeholder="Search films..."
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-text-primary placeholder:text-text-muted/50 w-full"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin ml-2 flex-shrink-0" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full mt-2 w-full min-w-[320px] bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            {results.map((item, i) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(`/movie/${item.id}`);
                  setShowResults(false);
                  setQuery('');
                  if (!mobile) setExpanded(false);
                }}
                className="flex items-center gap-3 w-full p-3 hover:bg-surface-container-high transition-colors text-left"
              >
                {item.poster_path ? (
                  <img
                    src={item.poster_path}
                    alt={item.title}
                    className="w-10 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 rounded-lg bg-bg-elevated flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-text-muted text-sm">movie</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary truncate">{item.title}</p>
                  <p className="text-metadata text-text-muted mt-0.5">
                    {item.release_date?.slice(0, 4)} {item.genre_names?.[0] && `• ${item.genre_names[0]}`}
                  </p>
                </div>
                {item.vote_average > 0 && (
                  <div className="flex items-center gap-1 text-accent-green flex-shrink-0">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-metadata">{item.vote_average.toFixed(1)}</span>
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
