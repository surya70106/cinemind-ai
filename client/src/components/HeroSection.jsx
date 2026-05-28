import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { getFeaturedShows } from '../lib/tvmaze';

const ROTATE_MS = 5000;

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HeroSection() {
  const navigate = useNavigate();
  const [shows, setShows] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const featured = await getFeaturedShows();
        if (!cancelled) setShows(featured);
      } catch (err) {
        console.error('Failed to fetch hero shows:', err);
        if (!cancelled) setShows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const goTo = useCallback(
    (index) => {
      if (shows.length === 0) return;
      setCurrentIndex(((index % shows.length) + shows.length) % shows.length);
    },
    [shows.length]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (shows.length <= 1) return;
    const timer = setInterval(goNext, ROTATE_MS);
    return () => clearInterval(timer);
  }, [shows.length, goNext]);

  const featured = shows[currentIndex] || null;

  const truncate = (str, max = 200) => {
    if (!str) return '';
    return str.length > max ? str.slice(0, max).replace(/\s+\S*$/, '') + '…' : str;
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-tertiary" />

      <AnimatePresence mode="popLayout">
        {featured?.backdrop_path && (
          <motion.div
            key={featured.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={featured.backdrop_path}
              alt=""
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hero-scrim absolute inset-0" />

      {/* Prev / next */}
      {shows.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-black/60 transition-colors"
            aria-label="Previous featured show"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-black/60 transition-colors"
            aria-label="Next featured show"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </>
      )}

      <div className="relative z-10 flex flex-col justify-end min-h-[70vh] md:min-h-screen pb-28 md:pb-32 w-full max-w-[1440px] mx-auto px-6 md:px-12">
        {loading && (
          <div className="max-w-3xl space-y-4 animate-pulse">
            <div className="h-6 w-24 rounded bg-white/10" />
            <div className="h-12 w-2/3 rounded bg-white/10" />
            <div className="h-20 w-full rounded bg-white/10" />
          </div>
        )}

        {!loading && featured && (
          <motion.div
            key={featured.id}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
            className="max-w-3xl space-y-4"
          >
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="bg-accent-green/20 text-accent-green px-3 py-1 rounded text-metadata border border-accent-green/30 uppercase tracking-widest">
                Featured
              </span>

              {featured.vote_average > 0 && (
                <span className="flex items-center gap-1 text-accent-green">
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                  >
                    star
                  </span>
                  <span className="font-mono text-sm font-medium">
                    {featured.vote_average.toFixed(1)}
                  </span>
                </span>
              )}

              {featured.release_date && (
                <span className="text-text-muted text-sm font-mono">
                  {featured.release_date.slice(0, 4)}
                </span>
              )}
            </motion.div>

            <motion.h1
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-display text-text-primary"
            >
              {featured.title}
            </motion.h1>

            <motion.p
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="text-text-secondary text-base md:text-lg max-w-2xl leading-relaxed"
            >
              {truncate(featured.overview)}
            </motion.p>

            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap gap-3 pt-4"
            >
              <motion.button
                onClick={() => navigate(`/movie/${featured.id}`)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary h-11 px-7 min-w-[170px] rounded-lg"
                aria-label={`Explore ${featured.title}`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
                <span className="text-label-caps text-bg-primary">Explore</span>
              </motion.button>

              <motion.button
                onClick={() => navigate(`/movie/${featured.id}`)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-surface h-11 px-6 rounded-lg"
                aria-label={`More info about ${featured.title}`}
              >
                <span className="material-symbols-outlined text-lg">info</span>
                <span className="text-label-caps text-text-primary">More Info</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Dot indicators */}
      {shows.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {shows.map((show, i) => (
            <button
              key={show.id}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-8 bg-accent-green' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === currentIndex ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
