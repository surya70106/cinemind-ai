import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

const moods = [
  { emoji: '😂', label: 'Funny' },
  { emoji: '😢', label: 'Emotional' },
  { emoji: '❤️', label: 'Romantic' },
  { emoji: '🤯', label: 'Mind-blowing' },
  { emoji: '👻', label: 'Horror' },
  { emoji: '😊', label: 'Feel-good' },
  { emoji: '💥', label: 'Action' },
  { emoji: '🚀', label: 'Sci-fi' },
  { emoji: '🔪', label: 'Thriller' },
  { emoji: '🛋️', label: 'Comfort' },
  { emoji: '🏔️', label: 'Adventure' },
  { emoji: '😌', label: 'Chill' },
  { emoji: '🧠', label: 'Psychological' },
  { emoji: '🔍', label: 'Mystery' },
];

export default function MoodSelector({ compact = false }) {
  const navigate = useNavigate();

  const handleSelect = (mood) => {
    navigate(`/discover?mood=${encodeURIComponent(mood)}`);
  };

  return (
    <div
      className={`flex flex-wrap justify-center ${
        compact ? 'gap-2' : 'gap-3 max-w-3xl mx-auto'
      }`}
    >
      {moods.map(({ emoji, label }, i) => (
        <motion.button
          key={label}
          initial={{ opacity: 0, y: compact ? 6 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.035, duration: 0.35, ease: 'easeOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelect(label)}
          className={`flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-high/60 text-text-secondary cursor-pointer transition-all duration-200 hover:bg-surface-container-high hover:border-accent-green/50 hover:text-text-primary hover:shadow-[0_0_12px_rgba(67,254,109,0.15)] ${
            compact ? 'px-3 py-1.5 text-xs gap-1.5' : 'px-4 py-2 text-sm'
          }`}
        >
          <span className={compact ? 'text-sm' : 'text-lg'}>{emoji}</span>
          <span>{label}</span>
        </motion.button>
      ))}
    </div>
  );
}
