import { useState, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useWatchlist } from '../context/WatchlistContext';

export default function MovieCard({ movie, index = 0 }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { likeMovie, isLiked, isWatched, getUserRating } = useWatchlist();

  const liked = isLiked(movie.id);
  const watched = isWatched(movie.id);
  const myRating = getUserRating(movie.id);
  const year = movie.release_date?.slice(0, 4);
  const genre =
    movie.genre_names?.[0] ||
    (Array.isArray(movie.genres) ? movie.genres[0]?.name || movie.genres[0] : null);
  const hasPoster = movie.poster_path && !imageError;

  const handleLike = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      likeMovie(movie);
    },
    [movie, likeMovie]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
    >
      <Link to={`/movie/${movie.id}`} className="group relative flex flex-col gap-3">
        {/* Poster container */}
        <div className="poster-aspect overflow-hidden rounded-xl bg-surface-container-high relative">
          {/* Skeleton loader */}
          {!imageLoaded && hasPoster && (
            <div className="absolute inset-0 skeleton" />
          )}

          {/* Poster image */}
          {hasPoster ? (
            <img
              src={movie.poster_path}
              alt={movie.title}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } transition-opacity`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            /* Placeholder when no poster */
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-surface-container p-4">
              <span className="material-symbols-outlined text-4xl text-text-muted">movie</span>
              <p className="text-xs text-text-muted text-center line-clamp-2">{movie.title}</p>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent pointer-events-none" />

          {/* Favorite button — visible on hover */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-300 z-10 ${
              liked
                ? 'opacity-100 text-accent-red'
                : 'opacity-0 group-hover:opacity-100 text-white/80 hover:text-accent-red'
            }`}
          >
            <span className={liked ? 'material-symbols-filled text-xl' : 'material-symbols-outlined text-xl'}>
              favorite
            </span>
          </motion.button>

          {/* Watched overlay — visible on hover */}
          <div
            className={`absolute inset-x-0 bottom-0 p-3 flex flex-col gap-2 transition-all duration-300 z-10 ${
              watched
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
            }`}
          >
            {watched && (
              <>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-green rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-metadata text-white/70 text-[10px]">WATCHED</span>
                  {myRating != null && (
                    <span className="font-mono text-sm font-bold text-accent-green tabular-nums">
                      {myRating.toFixed(1)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title & metadata below poster */}
        <div className="flex flex-col gap-1 px-0.5">
          <p className="text-title font-display text-sm leading-snug line-clamp-2 group-hover:text-accent-green transition-colors duration-300">
            {movie.title}
          </p>
          <span className="text-metadata text-text-muted text-[11px]">
            {year}
            {year && genre ? ' • ' : ''}
            {genre}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
