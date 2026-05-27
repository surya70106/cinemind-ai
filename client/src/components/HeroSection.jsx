import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { getShowDetails } from '../lib/tvmaze';

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
    const fetchHeroShows = async () => {
      try {
        const ids = [555, 66, 431]; // Avatar, Big Bang Theory, Friends
        const results = await Promise.allSettled(ids.map((id) => getShowDetails(id)));
        const fetchedShows = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)
          .filter(Boolean);
        setShows(fetchedShows);
      } catch (err) {
        console.error('Failed to fetch hero shows:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeroShows();
  }, []);

  useEffect(() => {
    if (shows.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shows.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [shows.length]);

  const featured = shows[currentIndex] || null;

  const truncate = (str, max = 200) => {
    if (!str) return '';
    return str.length > max ? str.slice(0, max).replace(/\s+\S*$/, '') + '…' : str;
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Fallback gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-tertiary" />

      {/* Rotating Backdrops */}
      <AnimatePresence mode="popLayout">
        {shows.length > 0 && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={shows[currentIndex]?.backdrop_path}
              alt=""
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Scrim overlay */}
      <div className="hero-scrim absolute inset-0" />

      {/* Content — bottom-left aligned */}
      <div className="relative z-10 flex flex-col justify-end min-h-screen pb-24 w-full max-w-[1440px] mx-auto px-6 md:px-12">
        {featured && (
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
            {/* Badges row */}
            <motion.div
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center gap-3"
            >
              {/* FEATURED badge */}
              <span className="bg-accent-green/20 text-accent-green px-3 py-1 rounded text-metadata border border-accent-green/30 uppercase tracking-widest">
                Featured
              </span>

              {/* Star rating */}
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

              {/* Year */}
              {(featured.release_date || featured.first_air_date) && (
                <span className="text-text-muted text-sm font-mono">
                  {(featured.release_date || featured.first_air_date)?.slice(0, 4)}
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={staggerItem}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-display text-text-primary"
            >
              {featured.title || featured.name}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="text-text-secondary text-base md:text-lg max-w-2xl leading-relaxed"
            >
              {truncate(featured.overview)}
            </motion.p>

            {/* Buttons */}
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
                aria-label={`Explore ${featured.title || featured.name}`}
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
                aria-label={`More info about ${featured.title || featured.name}`}
              >
                <span className="material-symbols-outlined text-lg">info</span>
                <span className="text-label-caps text-text-primary">More Info</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
