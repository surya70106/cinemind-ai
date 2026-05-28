import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import MovieCard from './MovieCard';

/* ─── Scroll hook ─── */
function useHorizontalScroll(movies) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    update();
    return () => el.removeEventListener('scroll', update);
  }, [movies, update]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 220; // approx card width + gap
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return { scrollRef, canScrollLeft, canScrollRight, scroll };
}

/* ─── Section header ─── */
function SectionHeader({ title, subtitle, scrollControls }) {
  return (
    <div className="flex items-end justify-between mb-5 sm:mb-8">
      <div className="flex flex-col gap-2">
        {subtitle && (
          <span className="text-label-caps text-accent-green tracking-[0.2em] uppercase">
            {subtitle}
          </span>
        )}
        <h2 className="text-headline">{title}</h2>
      </div>
      {scrollControls && (
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scrollControls.scroll('left')}
            disabled={!scrollControls.canScrollLeft}
            className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-accent-green hover:text-bg-primary hover:border-accent-green disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary disabled:hover:border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            onClick={() => scrollControls.scroll('right')}
            disabled={!scrollControls.canScrollRight}
            className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-accent-green hover:text-bg-primary hover:border-accent-green disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary disabled:hover:border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton helpers ─── */
function DefaultSkeleton() {
  return Array.from({ length: 8 }).map((_, i) => (
    <div
      key={i}
      className="w-[124px] sm:w-[160px] md:w-[180px] lg:w-[200px] poster-aspect skeleton rounded-xl flex-shrink-0"
    />
  ));
}

function GridSkeleton() {
  return Array.from({ length: 10 }).map((_, i) => (
    <div key={i} className="flex flex-col gap-3">
      <div className="poster-aspect skeleton rounded-xl" />
      <div className="flex flex-col gap-2 px-0.5">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-1/2 skeleton rounded" />
      </div>
    </div>
  ));
}

function GlassSkeleton() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="min-w-[400px] flex-shrink-0 glass-card">
      <div className="glass-card-inner flex gap-5">
        <div className="w-32 h-44 skeleton rounded-lg flex-shrink-0" />
        <div className="flex flex-col gap-3 flex-1">
          <div className="h-4 w-16 skeleton rounded" />
          <div className="h-5 w-3/4 skeleton rounded" />
          <div className="h-3 w-full skeleton rounded" />
          <div className="h-3 w-2/3 skeleton rounded" />
        </div>
      </div>
    </div>
  ));
}

/* ═══════════════════════════════════════════════
   DEFAULT VARIANT — Horizontal scroll, large cards
   ═══════════════════════════════════════════════ */
function DefaultCarousel({ title, subtitle, movies, loading }) {
  const controls = useHorizontalScroll(movies);

  return (
    <section className="py-6 sm:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeader title={title} subtitle={subtitle} scrollControls={controls} />
      </div>
      <div
        ref={controls.scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-4 sm:pb-8 px-4 sm:px-6 lg:px-10"
      >
        {loading ? (
          <DefaultSkeleton />
        ) : (
          movies.map((movie, i) => (
            <div
              key={movie.id}
              className="w-[124px] sm:w-[160px] md:w-[180px] lg:w-[200px] flex-shrink-0"
            >
              <MovieCard movie={movie} index={i} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   GRID VARIANT — 5-column responsive grid
   ═══════════════════════════════════════════════ */
function GridCarousel({ title, subtitle, movies, loading }) {
  return (
    <section className="py-12">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {loading ? (
            <GridSkeleton />
          ) : (
            movies.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   GLASS VARIANT — Horizontal glass cards (hidden gems)
   ═══════════════════════════════════════════════ */
function GlassCarousel({ title, subtitle, movies, loading }) {
  const controls = useHorizontalScroll(movies);

  return (
    <section className="bg-bg-secondary py-20 border-y border-outline-variant/10">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <SectionHeader title={title} subtitle={subtitle} scrollControls={controls} />
      </div>
      <div
        ref={controls.scrollRef}
        className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 px-6 lg:px-10"
      >
        {loading ? (
          <GlassSkeleton />
        ) : (
          movies.map((movie, i) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="min-w-[400px] flex-shrink-0"
            >
              <div className="glass-card">
                <div className="glass-card-inner flex gap-5">
                  {/* Poster thumbnail */}
                  <div className="w-32 h-44 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
                    {movie.poster_path ? (
                      <img
                        src={movie.poster_path}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-text-muted">movie</span>
                      </div>
                    )}
                  </div>
                  {/* Text info */}
                  <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
                    {/* Rating badge */}
                    {movie.vote_average > 0 && (
                      <span className="text-accent-coral text-metadata border border-accent-coral/30 rounded px-2 py-0.5 self-start">
                        ★ {movie.vote_average?.toFixed(1)}
                      </span>
                    )}
                    <p className="text-title text-text-primary line-clamp-2">{movie.title}</p>
                    {movie.overview && (
                      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{movie.overview}</p>
                    )}
                    <Link
                      to={`/movie/${movie.id}`}
                      className="group/link inline-flex items-center gap-1 text-accent-green text-metadata mt-1 hover:gap-2 transition-all duration-300"
                    >
                      VIEW DETAILS
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}

/* ─── Main Export ─── */
export default function MovieCarousel({
  title,
  subtitle,
  movies = [],
  loading = false,
  variant = 'default',
}) {
  switch (variant) {
    case 'grid':
      return <GridCarousel title={title} subtitle={subtitle} movies={movies} loading={loading} />;
    case 'glass':
      return <GlassCarousel title={title} subtitle={subtitle} movies={movies} loading={loading} />;
    default:
      return <DefaultCarousel title={title} subtitle={subtitle} movies={movies} loading={loading} />;
  }
}
