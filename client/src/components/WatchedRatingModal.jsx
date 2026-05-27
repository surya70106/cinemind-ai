import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CircularRatingDial from './CircularRatingDial';
import { modalBackdropMotion, modalPanelMotion } from '../utils/motion';

export default function WatchedRatingModal({ movie, open, onClose, onConfirm, saving }) {
  const initial =
    movie?.user_rating ??
    (movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : 8);
  const [rating, setRating] = useState(initial);

  useEffect(() => {
    if (!movie) return;
    const v =
      movie.user_rating ??
      (movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : 8);
    setRating(v);
  }, [movie?.id, movie?.user_rating, movie?.vote_average]);

  if (!movie) return null;

  const title = movie.title || movie.name;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            {...modalBackdropMotion}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 z-[80]"
          />
          <motion.div
            {...modalPanelMotion}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[min(100%,380px)] mx-4"
          >
            <div className="panel shadow-2xl shadow-black/50 overflow-hidden relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant/30 text-text-muted hover:text-text-primary flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              <div className="panel-header pr-16">
                <div className="flex items-start gap-4">
                  {movie.poster_path && (
                    <img
                      src={movie.poster_path}
                      alt=""
                      className="w-14 h-20 rounded-lg object-cover flex-shrink-0 border border-white/10"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-label-caps text-accent-green mb-2 tracking-[0.18em]">
                      {movie.editMode ? 'Your rating' : 'You watched'}
                    </p>
                    <h2 className="font-display text-lg font-bold text-text-primary leading-snug line-clamp-2">
                      {title}
                    </h2>
                    <p className="text-sm text-text-muted mt-2">
                      {movie.editMode ? 'Drag to update your score' : 'How was it?'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-7 py-8 sm:px-8 flex justify-center">
                <CircularRatingDial
                  key={movie.id}
                  value={initial}
                  defaultValue={initial}
                  onChange={setRating}
                />
              </div>

              <div className="panel-footer flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="btn btn-surface flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(rating)}
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg animate-spin">
                        progress_activity
                      </span>
                      Saving
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">check</span>
                      {movie.editMode ? 'Save rating' : 'Mark watched'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
