import { Link } from 'react-router';
import { motion } from 'motion/react';

export default function ShowGridItem({
  movie,
  onMarkWatched,
  onEditRating,
  onRemove,
  confirmDelete,
  onConfirmDeleteClick,
}) {
  const watched = movie.watched;
  const liked = movie.liked;

  return (
    <motion.div layout className="group">
      <Link to={`/movie/${movie.id}`} className="block">
        <div
          className={`poster-card poster-aspect relative bg-surface-container-high ${
            watched ? 'opacity-70' : ''
          }`}
        >
          {movie.poster_path ? (
            <img
              src={movie.poster_path}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container">
              <span className="material-symbols-outlined text-text-muted text-3xl">movie</span>
            </div>
          )}
          {watched && movie.user_rating != null && (
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/85 text-accent-green text-[10px] font-mono font-bold tabular-nums">
              {Number(movie.user_rating).toFixed(1)}
            </span>
          )}
          {liked && !watched && (
            <span className="absolute top-1.5 left-1.5 material-symbols-outlined text-accent-orange text-base drop-shadow">
              favorite
            </span>
          )}
        </div>
      </Link>

      <div className="mt-2 px-0.5">
        <p
          className={`text-xs truncate leading-snug ${
            watched ? 'text-text-muted line-through decoration-text-muted/60' : 'text-text-primary'
          }`}
        >
          {movie.title}
        </p>
        <div className="flex items-center justify-end gap-0.5 mt-1 min-h-[22px] opacity-0 group-hover:opacity-100 transition-opacity">
          {!watched ? (
            <>
              <button
                type="button"
                onClick={() => onMarkWatched(movie)}
                className="p-1 rounded text-text-muted hover:text-accent-green transition-colors"
                title="Mark as watched"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>
              <button
                type="button"
                onClick={() => onConfirmDeleteClick(movie.id)}
                className={`p-1 rounded transition-colors ${
                  confirmDelete === movie.id
                    ? 'text-accent-red'
                    : 'text-text-muted hover:text-accent-red'
                }`}
                title="Remove from bucket list"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onEditRating(movie)}
              className="p-1 rounded text-text-muted hover:text-accent-green transition-colors"
              title="Edit your rating"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
