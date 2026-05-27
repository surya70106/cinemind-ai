import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { useWatchlist } from '../context/WatchlistContext';
import { modalBackdropMotion, modalPanelMotion } from '../utils/motion';

export default function MovieDetailModal({ movie, isOpen, onClose }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  if (!movie) return null;

  const inWatchlist = isInWatchlist(movie.id);
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average?.toFixed(1);
  const genres = movie.genres || [];
  const overview = movie.overview?.length > 250 ? movie.overview.slice(0, 250) + '...' : movie.overview;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            {...modalBackdropMotion}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 z-50"
          />
          <motion.div
            {...modalPanelMotion}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 w-full md:max-w-lg panel md:rounded-2xl rounded-t-2xl overflow-hidden max-h-[80vh]"
          >
            <div className="overflow-y-auto max-h-[80vh] relative">
              <button onClick={onClose} className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant/30 text-text-muted hover:text-text-primary flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="flex flex-col sm:flex-row gap-5 panel-body pt-12">
                <div className="flex-shrink-0 w-32 sm:w-36 mx-auto sm:mx-0">
                  {movie.poster_path ? (
                    <img src={movie.poster_path} alt={movie.title} className="w-full poster-aspect rounded-md object-cover" />
                  ) : (
                    <div className="w-full poster-aspect rounded-md bg-bg-card flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-bold text-text-primary mb-1">{movie.title}</h2>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {rating && <span className="font-mono text-sm text-accent-gold font-bold">⭐ {rating}</span>}
                    {year && <span className="font-mono text-xs text-text-muted">{year}</span>}
                  </div>

                  {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {genres.map((g) => (
                        <span key={g.id || g} className="px-2 py-0.5 rounded-sm text-[10px] border border-border text-text-muted">{g.name || g}</span>
                      ))}
                    </div>
                  )}

                  {overview && <p className="text-xs text-text-secondary leading-relaxed mb-3">{overview}</p>}

                  <div className="flex flex-wrap gap-2">
                    <Link to={`/movie/${movie.id}`} onClick={onClose} className="px-4 py-2 rounded-md bg-accent-green text-bg-primary text-xs font-bold hover:bg-accent-green/90 transition-colors">
                      View Details
                    </Link>
                    <button
                      onClick={() => inWatchlist ? removeFromWatchlist(movie.id) : addToWatchlist(movie)}
                      className={`px-4 py-2 rounded-md text-xs font-medium border transition-colors ${
                        inWatchlist ? 'border-accent-orange/30 text-accent-orange' : 'border-border text-text-muted hover:text-accent-orange hover:border-accent-orange/30'
                      }`}
                    >
                      {inWatchlist ? '♥ Liked' : '♡ Like'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
