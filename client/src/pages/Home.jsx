import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getTrending, getPopular, getHiddenGems } from '../lib/tvmaze';
import HeroSection from '../components/HeroSection';
import MovieCarousel from '../components/MovieCarousel';

const sections = [
  { key: 'trending', title: 'New & Trending', fetcher: getTrending },
  { key: 'popular', title: 'Popular This Month', fetcher: getPopular },
  { key: 'hiddenGems', title: 'Hidden Gems', fetcher: getHiddenGems },
];

export default function Home() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    sections.forEach(({ key, fetcher }) => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      fetcher()
        .then((result) => {
          const d = result?.results || result;
          setData((prev) => ({ ...prev, [key]: Array.isArray(d) ? d : [] }));
        })
        .catch((err) => {
          console.error(`Failed to load ${key}:`, err);
          setData((prev) => ({ ...prev, [key]: [] }));
        })
        .finally(() => setLoading((prev) => ({ ...prev, [key]: false })));
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <HeroSection />

      <main className="relative z-20 -mt-16 space-y-16 pb-16">
        {sections.map(({ key, title }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[1440px] mx-auto px-6 md:px-12"
          >
            <MovieCarousel
              title={title}
              movies={data[key] || []}
              loading={loading[key]}
            />
          </motion.div>
        ))}
      </main>
    </motion.div>
  );
}
