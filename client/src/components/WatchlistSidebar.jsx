import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { useWatchlist } from '../context/WatchlistContext';

export default function WatchlistSidebar({ isOpen, onClose }) {
  const { items, openWatchRating, removeFromWatchlist } = useWatchlist();
  const navigate = useNavigate();
  const bucket = items.filter((m) => !m.watched);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[360px] bg-surface-container border-l border-outline-variant/30 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-text-primary">Bucket List</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-green/10 text-accent-green">
                  {bucket.length}
                </span>
              </div>
              <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {bucket.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <span className="material-symbols-outlined text-text-muted text-3xl mb-2">playlist_add_check</span>
                  <p className="text-sm text-text-primary mb-1">Bucket list is empty</p>
                  <Link
                    to="/discover"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-accent-green-container hover:bg-accent-green text-bg-primary text-xs font-bold transition-colors mt-4"
                  >
                    Discover
                  </Link>
                </div>
              ) : (
                <div className="py-1">
                  {bucket.map((movie) => (
                    <motion.div
                      key={movie.id}
                      layout
                      className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-container-high transition-colors cursor-pointer group"
                      onClick={() => {
                        navigate(`/movie/${movie.id}`);
                        onClose();
                      }}
                    >
                      {movie.poster_path ? (
                        <img
                          src={movie.poster_path}
                          alt={movie.title}
                          className="w-8 h-12 rounded-sm object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-12 rounded-sm bg-surface-container-high flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-text-muted text-sm">movie</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-text-primary">{movie.title}</p>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWatchRating(movie);
                          }}
                          className="p-1 rounded text-text-muted hover:text-accent-green transition-colors"
                          title="Mark watched"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(movie.id);
                          }}
                          className="p-1 rounded text-text-muted hover:text-accent-red transition-colors"
                          title="Remove"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-3 py-3 border-t border-outline-variant/30">
              <Link
                to="/profile"
                onClick={onClose}
                className="block w-full text-center py-2 rounded-lg border border-outline-variant/30 text-xs text-accent-green hover:bg-surface-container-high transition-colors"
              >
                Open profile →
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
