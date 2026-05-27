import { motion } from 'motion/react';

const genres = [
  'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-fi', 'Thriller', 'Animation',
  'Family', 'History', 'Music', 'War', 'Western', 'Supernatural',
];

export default function GenreChips({ selected = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => {
        const isSelected = selected.includes(genre);
        return (
          <motion.button
            key={genre}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onToggle(genre)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
              isSelected
                ? 'border-accent-green/50 text-accent-green bg-accent-green/10'
                : 'border-outline-variant/30 text-text-muted hover:text-text-primary hover:border-accent-green/30 bg-surface-container-high/60'
            }`}
          >
            {genre}
          </motion.button>
        );
      })}
    </div>
  );
}
