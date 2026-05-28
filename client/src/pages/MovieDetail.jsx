import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { getShowDetails, getSimilarShows } from '../lib/tvmaze';
import { useWatchlist } from '../context/WatchlistContext';
import MovieCarousel from '../components/MovieCarousel';

function renderStars(rating) {
  if (!rating) return null;
  const stars = Math.round((rating / 10) * 5 * 2) / 2;
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  return (
    <span className="star-rating text-lg tracking-tight">
      {'★'.repeat(full)}{half ? '½' : ''}
    </span>
  );
}

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isInWatchlist, isLiked, isWatched, getUserRating, addToWatchlist, removeFromWatchlist, likeMovie, watchMovie } = useWatchlist();
  const myRating = getUserRating(Number(id));

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setMovie(null);
      setError('Show not found');
      setLoading(false);
      return;
    }

    const fetchMovie = async () => {
      setLoading(true);
      setError(null);
      try {
        const movieData = await getShowDetails(id);
        if (!movieData?.id) {
          throw new Error('Show not found');
        }
        setMovie(movieData);

        try {
          const simData = await getSimilarShows(id);
          const simResults = simData?.results || [];
          setSimilar(Array.isArray(simResults) ? simResults : []);
        } catch {
          setSimilar([]);
        }
      } catch {
        setError('Show not found');
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <MovieDetailSkeleton />;

  if (error || !movie) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-text-muted mb-3 block">movie</span>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Not Found</h2>
          <p className="text-text-muted mb-5 text-sm">This show doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-outline-variant/30 text-text-primary text-sm hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  const year = movie.release_date?.slice(0, 4);
  const cast = movie.credits?.cast?.slice(0, 12) || [];
  const network = movie.network || '';

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="min-h-screen">
      {/* Backdrop */}
      <div className="relative h-[50vh] overflow-hidden">
        {movie.backdrop_path ? (
          <img src={movie.backdrop_path} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-container" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/40" />

        {/* Back button */}
        <div className="absolute top-16 left-4 sm:left-8 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-primary/60 border border-outline-variant/30 text-text-primary text-xs hover:bg-bg-primary/80 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* LEFT — Poster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0 w-44 md:w-[230px] mx-auto md:mx-0"
          >
            {movie.poster_path ? (
              <div className="poster-card rounded-lg overflow-hidden shadow-xl shadow-black/50">
                <img src={movie.poster_path} alt={movie.title} className="w-full poster-aspect object-cover" />
              </div>
            ) : (
              <div className="poster-aspect rounded-lg bg-surface-container-high flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined text-5xl text-text-muted">movie</span>
              </div>
            )}

            {/* Network badge */}
            {network && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/30 text-xs text-text-muted text-center">
                <span className="material-symbols-outlined text-[14px] mr-1 align-middle">live_tv</span>
                {network}
              </div>
            )}

            {movie.officialSite && (
              <a
                href={movie.officialSite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 mt-2 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/30 text-xs text-accent-blue text-center hover:bg-surface-bright transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">link</span>
                Official Site
              </a>
            )}
          </motion.div>

          {/* RIGHT — Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 min-w-0 pt-2"
          >
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary leading-tight">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-text-muted italic text-sm mt-1">{movie.tagline}</p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap mt-3 mb-4">
              {year && <span className="font-mono text-sm text-text-secondary">{year}</span>}
              {movie.runtime && <span className="text-sm text-text-muted">{movie.runtime} min</span>}
              {movie.status && (
                <span className="text-metadata px-2 py-0.5 bg-surface-container-high rounded-md border border-outline-variant/30">
                  {movie.status}
                </span>
              )}
              <div className="flex items-center gap-1">
                {renderStars(movie.vote_average)}
              </div>
            </div>

            {/* Genres */}
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {movie.genres.map((g) => (
                  <span
                    key={g.id || g.name || g}
                    className="text-metadata px-3 py-1 rounded-full border border-outline-variant/30 text-text-muted"
                  >
                    {g.name || g}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <p className="text-sm text-text-secondary leading-relaxed mb-5 max-w-xl">
                {movie.overview}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1 mb-6">
              {/* Watch */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => watchMovie(movie)}
                className={`flex flex-col items-center gap-1 px-5 py-3 rounded-lg border transition-colors ${
                  isWatched(movie.id)
                    ? 'border-accent-green/30 text-accent-green bg-accent-green/5'
                    : 'border-outline-variant/30 text-text-muted hover:text-accent-green hover:border-accent-green/30'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">visibility</span>
                <span className="text-[10px] uppercase tracking-wide">
                  {isWatched(movie.id) ? 'Edit rating' : 'Watched'}
                </span>
              </motion.button>

              {/* Like */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => likeMovie(movie)}
                className={`flex flex-col items-center gap-1 px-5 py-3 rounded-lg border transition-colors ${
                  isLiked(movie.id)
                    ? 'border-accent-orange/30 text-accent-orange bg-accent-orange/5'
                    : 'border-outline-variant/30 text-text-muted hover:text-accent-orange hover:border-accent-orange/30'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isLiked(movie.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  favorite
                </span>
                <span className="text-[10px] uppercase tracking-wide">{isLiked(movie.id) ? 'Liked' : 'Like'}</span>
              </motion.button>

              {/* Watchlist */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => isInWatchlist(movie.id) ? removeFromWatchlist(movie.id) : addToWatchlist(movie)}
                className={`flex flex-col items-center gap-1 px-5 py-3 rounded-lg border transition-colors ${
                  isInWatchlist(movie.id)
                    ? 'border-accent-blue/30 text-accent-blue bg-accent-blue/5'
                    : 'border-outline-variant/30 text-text-muted hover:text-accent-blue hover:border-accent-blue/30'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
                <span className="text-[10px] uppercase tracking-wide">{isInWatchlist(movie.id) ? 'In list' : 'Bucket list'}</span>
              </motion.button>
            </div>

            {/* Ratings */}
            <div className="mb-2 flex flex-wrap gap-6">
              <div>
                <span className="section-header">TMDB</span>
                <div className="mt-1">{renderStars(movie.vote_average)}</div>
              </div>
              {isWatched(movie.id) && myRating != null && (
                <div>
                  <span className="section-header">Your score</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-accent-green tabular-nums">
                    {myRating.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10"
          >
            <h2 className="section-header mb-4">Cast</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {cast.map((person) => (
                <Link
                  key={person.id}
                  to={`/person/${person.id}`}
                  className="flex-shrink-0 text-center w-18 md:w-22 group cursor-pointer"
                >
                  {person.profile_path ? (
                    <img
                      src={person.profile_path}
                      alt={person.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover mx-auto mb-1.5 border-2 border-outline-variant/30 group-hover:border-accent-green transition-colors duration-200"
                    />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-1.5 border-2 border-outline-variant/30 group-hover:border-accent-green transition-colors duration-200">
                      <span className="material-symbols-outlined text-text-muted text-lg">person</span>
                    </div>
                  )}
                  <p className="text-[10px] text-text-primary font-medium truncate group-hover:text-accent-green transition-colors">{person.name}</p>
                  <p className="text-[9px] text-text-muted truncate">{person.character}</p>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-10 -mx-4 sm:-mx-6">
            <MovieCarousel title="Similar Shows" movies={similar} loading={false} />
          </div>
        )}

        <div className="h-12" />
      </div>
    </motion.main>
  );
}

function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="relative h-[50vh] skeleton" />
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="flex-shrink-0 w-44 md:w-[230px] mx-auto md:mx-0">
            <div className="poster-aspect skeleton rounded-lg" />
          </div>
          <div className="flex-1 pt-2 space-y-3">
            <div className="skeleton h-9 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="flex gap-2">
              <div className="skeleton h-7 w-14 rounded-full" />
              <div className="skeleton h-7 w-14 rounded-full" />
              <div className="skeleton h-7 w-18 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-3.5 w-full rounded" />
              <div className="skeleton h-3.5 w-full rounded" />
              <div className="skeleton h-3.5 w-2/3 rounded" />
            </div>
            <div className="flex gap-1">
              <div className="skeleton h-16 w-20 rounded-lg" />
              <div className="skeleton h-16 w-20 rounded-lg" />
              <div className="skeleton h-16 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
