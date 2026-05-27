import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../services/api';
import HeroSection from '../components/HeroSection';
import MovieCarousel from '../components/MovieCarousel';

const sections = [
  { key: 'trending', title: 'New & Trending', endpoint: '/movies/trending' },
  { key: 'popular', title: 'Popular This Month', endpoint: '/movies/popular' },
  { key: 'hiddenGems', title: 'Hidden Gems', endpoint: '/movies/hidden-gems' },
];

export default function Home() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    sections.forEach(({ key, endpoint }) => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      api
        .get(endpoint)
        .then(({ data: result }) => {
          setData((prev) => {
            const d = result.data?.results || result.data || result.results || result;
            return { ...prev, [key]: Array.isArray(d) ? d : [] };
          });
        })
        .catch(() => {})
        .finally(() => {
          setLoading((prev) => ({ ...prev, [key]: false }));
        });
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Full viewport hero */}
      <HeroSection />

      {/* Main content — overlaps hero bottom */}
      <main className="relative z-20 -mt-16 space-y-16 pb-16">
        {/* Movie Carousels */}
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
