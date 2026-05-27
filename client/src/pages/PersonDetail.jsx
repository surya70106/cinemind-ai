import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import { useNavbarHeight } from '../hooks/useNavbarHeight';



export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/movies/person/${id}`);
        setPerson(data.data || data);
      } catch {
        setError('Person not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPerson();
    window.scrollTo(0, 0);
  }, [id]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (!person?.images) return;
    setLightboxIndex((prev) => (prev + 1) % person.images.length);
  };

  const prevImage = () => {
    if (!person?.images) return;
    setLightboxIndex((prev) => (prev - 1 + person.images.length) % person.images.length);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, person]);

  if (loading) return <PersonSkeleton />;

  if (error || !person) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center pt-[52px]">
        <div className="text-center">
          <div className="text-5xl mb-3">👤</div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Not Found</h2>
          <p className="text-text-muted mb-5 text-sm">This person doesn't exist in our database.</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2 rounded-lg border border-outline-variant/30 text-text-primary text-sm hover:bg-surface-container-high transition-colors">
            ← Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  const age = person.birthday ? calculateAge(person.birthday, person.deathday) : null;
  const allImages = person.images || [];
  // Add main image to gallery if not already there
  const galleryImages = person.image_original
    ? [{ id: 'main', medium: person.image, original: person.image_original }, ...allImages]
    : allImages;

  const navH = useNavbarHeight();

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="min-h-screen" style={{ paddingTop: navH + 32 }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-text-muted text-xs hover:text-text-primary hover:bg-surface-container-high transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0 w-48 md:w-[220px] mx-auto md:mx-0"
          >
            {person.image ? (
              <div
                className="poster-card rounded-lg overflow-hidden shadow-xl shadow-black/50 cursor-pointer"
                onClick={() => openLightbox(0)}
              >
                <img src={person.image_original || person.image} alt={person.name} className="w-full object-cover" style={{ aspectRatio: '2/3' }} />
              </div>
            ) : (
              <div className="rounded-lg bg-surface-container-high flex items-center justify-center shadow-xl" style={{ aspectRatio: '2/3' }}>
                <span className="material-symbols-outlined text-text-muted text-5xl">person</span>
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 min-w-0"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
              {person.name}
            </h1>

            {/* Details grid */}
            <div className="space-y-2 mb-6">
              {person.birthday && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm w-20">Born</span>
                  <span className="text-text-primary text-sm">
                    {formatDate(person.birthday)}
                    {age !== null && !person.deathday && <span className="text-text-muted ml-1">({age} years old)</span>}
                  </span>
                </div>
              )}
              {person.deathday && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm w-20">Died</span>
                  <span className="text-text-primary text-sm">
                    {formatDate(person.deathday)}
                    {age !== null && <span className="text-text-muted ml-1">({age} years old)</span>}
                  </span>
                </div>
              )}
              {person.country && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm w-20">Country</span>
                  <span className="text-text-primary text-sm">{person.country}</span>
                </div>
              )}
              {person.gender && (
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm w-20">Gender</span>
                  <span className="text-text-primary text-sm">{person.gender}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 mb-6">
              <div className="px-4 py-3 rounded-lg bg-surface-container-high border border-outline-variant/30 text-center">
                <div className="text-xl font-bold text-accent-green font-mono">{person.castCredits?.length || 0}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wide mt-0.5">Shows</div>
              </div>
              <div className="px-4 py-3 rounded-lg bg-surface-container-high border border-outline-variant/30 text-center">
                <div className="text-xl font-bold text-accent-blue font-mono">{galleryImages.length}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wide mt-0.5">Photos</div>
              </div>
            </div>

            {person.url && (
              <a
                href={person.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant/30 text-sm text-accent-green hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-sm">link</span> TVMaze Profile
              </a>
            )}
          </motion.div>
        </div>

        {/* Photo Gallery */}
        {galleryImages.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="section-header mb-4">Photos</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {galleryImages.map((img, i) => (
                <motion.div
                  key={img.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openLightbox(i)}
                  className="poster-card rounded-lg overflow-hidden cursor-pointer bg-surface-container-high"
                  style={{ aspectRatio: '2/3' }}
                >
                  <img
                    src={img.medium || img.original}
                    alt={`${person.name} photo`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Known For / Cast Credits */}
        {person.castCredits?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-header mb-4">Known For</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {person.castCredits.map((credit, i) => (
                <Link
                  key={`${credit.show.id}-${i}`}
                  to={`/movie/${credit.show.id}`}
                  className="group"
                >
                  <div className="poster-card poster-aspect rounded-lg overflow-hidden bg-surface-container-high">
                    {credit.show.poster_path ? (
                      <img
                        src={credit.show.poster_path}
                        alt={credit.show.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-container">
                        <span className="material-symbols-outlined text-text-muted text-2xl">movie</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 px-0.5">
                    <p className="text-xs text-text-secondary truncate">{credit.show.title}</p>
                    {credit.character && (
                      <p className="text-[10px] text-text-muted truncate italic">as {credit.character}</p>
                    )}
                    {credit.show.vote_average > 0 && (
                      <span className="star-rating text-[10px]">
                        {'★'.repeat(Math.round((credit.show.vote_average / 10) * 5))}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        <div className="h-12" />
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && galleryImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/60 text-sm font-mono z-10">
              {lightboxIndex + 1} / {galleryImages.length}
            </div>

            {/* Image */}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              src={galleryImages[lightboxIndex].original || galleryImages[lightboxIndex].medium}
              alt={person.name}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Nav arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function PersonSkeleton() {
  return (
    <div className="min-h-screen pt-28">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-12">
        <div className="skeleton h-8 w-20 rounded mb-6" />
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10">
          <div className="flex-shrink-0 w-48 md:w-[220px] mx-auto md:mx-0">
            <div className="skeleton rounded-lg" style={{ aspectRatio: '2/3' }} />
          </div>
          <div className="flex-1 space-y-4 pt-2">
            <div className="skeleton h-10 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-4 w-1/4 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="flex gap-4">
              <div className="skeleton h-16 w-20 rounded-lg" />
              <div className="skeleton h-16 w-20 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="skeleton h-5 w-16 rounded mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton rounded-md" style={{ aspectRatio: '2/3' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function calculateAge(birthday, deathday) {
  try {
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}
