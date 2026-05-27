import { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import ShowGridItem from '../components/ShowGridItem';
import { useNavbarHeight } from '../hooks/useNavbarHeight';

const TABS = [
  { id: 'bucket', label: 'Bucket List', icon: 'playlist_add_check' },
  { id: 'watched', label: 'Watched', icon: 'visibility' },
  { id: 'favorites', label: 'Favorites', icon: 'favorite' },
];


export default function Profile() {
  const { user, logout } = useAuth();
  const { items, loading, openWatchRating, openEditRating, removeFromWatchlist } = useWatchlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const navH = useNavbarHeight();

  const activeTab = searchParams.get('tab') || 'bucket';
  const [confirmDelete, setConfirmDelete] = useState(null);

  const bucketList = useMemo(() => items.filter((m) => !m.watched), [items]);
  const watchedList = useMemo(() => items.filter((m) => m.watched), [items]);
  const favoritesList = useMemo(() => items.filter((m) => m.liked), [items]);

  const filtered =
    activeTab === 'watched'
      ? watchedList
      : activeTab === 'favorites'
        ? favoritesList
        : bucketList;

  const setTab = (id) => setSearchParams({ tab: id });

  const handleRemove = (movieId) => {
    if (confirmDelete === movieId) {
      removeFromWatchlist(movieId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(movieId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const emptyCopy = {
    bucket: {
      title: 'Your bucket list is empty',
      body: "Save shows you want to watch — then mark them watched when you're done.",
      cta: 'Discover shows',
    },
    watched: {
      title: 'Nothing watched yet',
      body: 'Mark a bucket list item as watched and rate it.',
      cta: 'Go to bucket list',
    },
    favorites: {
      title: 'No favorites yet',
      body: 'Tap the heart on any show to save it here.',
      cta: 'Browse home',
    },
  };

  const empty = emptyCopy[activeTab] || emptyCopy.bucket;
  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-16"
      /* Push entire page below the real navbar height */
      style={{ paddingTop: navH }}
    >
      {/* ── Profile Banner ─────────────────────────────────────── */}
      <div className="bg-surface-container border-b border-white/[0.06]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">

          {/* Main profile row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 pt-10 pb-8">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-accent-green/10 border-2 border-accent-green/50 shadow-lg shadow-accent-green/10 flex items-center justify-center">
                <span className="font-display text-4xl md:text-5xl font-black text-accent-green leading-none select-none">
                  {initial}
                </span>
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-accent-green border-2 border-surface-container" />
            </div>

            {/* Name + email + stats + sign-out */}
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-[28px] md:text-[34px] font-black text-text-primary leading-none tracking-tight">
                  {user?.name || 'Your profile'}
                </h1>
                <p className="text-sm text-text-muted mt-2 truncate">{user?.email}</p>

                {/* Stats */}
                <div className="flex items-center gap-6 md:gap-8 mt-5">
                  <Stat label="Bucket List" value={bucketList.length} />
                  <div className="w-px h-8 bg-white/10" />
                  <Stat label="Watched" value={watchedList.length} />
                  <div className="w-px h-8 bg-white/10" />
                  <Stat label="Favorites" value={favoritesList.length} />
                </div>
              </div>

              {/* Sign out */}
              <button
                type="button"
                onClick={() => { logout(); navigate('/'); }}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-text-muted text-xs font-semibold uppercase tracking-wider hover:bg-white/5 hover:text-text-primary hover:border-white/20 transition-all duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Sign out
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 overflow-x-auto hide-scrollbar border-t border-white/[0.06]">
            {TABS.map(({ id, label, icon }) => {
              const count =
                id === 'bucket' ? bucketList.length
                : id === 'watched' ? watchedList.length
                : favoritesList.length;
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 -mb-px cursor-pointer ${
                    active
                      ? 'border-accent-green text-text-primary'
                      : 'border-transparent text-text-muted hover:text-text-primary hover:border-white/20'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${active ? 'text-accent-green' : ''}`}>{icon}</span>
                  {label}
                  <span className={`text-[11px] font-mono ${active ? 'text-accent-green' : 'text-text-muted'}`}>({count})</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-8">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="poster-aspect skeleton rounded-xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4"
          >
            {filtered.map((movie) => (
              <ShowGridItem
                key={movie.id}
                movie={movie}
                onMarkWatched={openWatchRating}
                onEditRating={openEditRating}
                onRemove={removeFromWatchlist}
                confirmDelete={confirmDelete}
                onConfirmDeleteClick={handleRemove}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-6xl text-text-muted/30 mb-5 block">
              {activeTab === 'favorites' ? 'favorite' : 'movie'}
            </span>
            <h2 className="font-display text-xl font-bold text-text-primary mb-2">{empty.title}</h2>
            <p className="text-sm text-text-muted mb-8 max-w-xs mx-auto leading-relaxed">{empty.body}</p>
            <Link
              to={activeTab === 'bucket' ? '/discover' : activeTab === 'watched' ? '/profile?tab=bucket' : '/'}
              className="btn btn-primary px-8 py-3 rounded-full"
            >
              {empty.cta}
            </Link>
          </div>
        )}
      </div>
    </motion.main>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-mono text-2xl md:text-3xl font-black text-accent-green tabular-nums leading-none">{value}</p>
      <p className="text-[10px] text-text-muted uppercase tracking-[0.12em] mt-1.5">{label}</p>
    </div>
  );
}
