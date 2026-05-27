import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
const navLinks = [
  { to: '/profile?tab=bucket', label: 'Bucket List', requiresAuth: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleProtectedNav = (e, to, requiresAuth) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      navigate('/login', { state: { from: to } });
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        id="navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-surface/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/30'
            : 'py-4 bg-surface/80 backdrop-blur-xl border-b border-white/10'
        }`}
      >
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <div className="flex flex-col">
                <span className="font-display text-2xl md:text-[32px] tracking-tighter font-extrabold text-accent-green leading-none">
                  CINEMIND
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 h-px w-full bg-accent-green/90 rounded-full"
                />
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(({ to, label, requiresAuth }) => {
                const pathOnly = to.split('?')[0];
                const active =
                  location.pathname === pathOnly ||
                  (pathOnly === '/profile' && location.pathname === '/profile');
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={(e) => handleProtectedNav(e, to, requiresAuth)}
                    className={`relative text-[15px] transition-colors duration-200 ${
                      active
                        ? 'text-accent-green font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {label}
                    {active && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-0 right-0 h-[2px] bg-accent-green rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <div className="hidden md:block">
              <SearchBar />
            </div>

            {/* Auth */}
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="btn btn-icon bg-accent-green/15 border border-accent-green/30 text-accent-green hover:bg-accent-green/25"
                aria-label="Your profile"
                title="Profile"
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary rounded-full min-w-[118px]"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-surface-container border-l border-outline-variant/30 z-50 md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-5 border-b border-outline-variant/30">
                <span className="font-display text-xl font-extrabold text-accent-green tracking-tighter">
                  CINEMIND
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Search in drawer */}
              <div className="p-4 border-b border-outline-variant/20">
                <SearchBar mobile />
              </div>

              {/* Nav links */}
              <div className="flex flex-col py-2">
                {navLinks.map(({ to, label, requiresAuth }) => {
                  const pathOnly = to.split('?')[0];
                const active =
                  location.pathname === pathOnly ||
                  (pathOnly === '/profile' && location.pathname === '/profile');
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={(e) => {
                        handleProtectedNav(e, to, requiresAuth);
                        if (!requiresAuth || isAuthenticated) setMobileOpen(false);
                      }}
                      className={`px-5 py-3.5 text-sm font-medium transition-colors flex items-center gap-3 ${
                        active
                          ? 'text-accent-green bg-accent-green/5 border-r-2 border-accent-green'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {label === 'Discover' ? 'explore' : 'playlist_add_check'}
                      </span>
                      {label}
                    </Link>
                  );
                })}
              </div>

              {/* Bottom section */}
              <div className="mt-auto p-5 border-t border-outline-variant/20">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-accent-green/15 border border-accent-green/30 text-accent-green text-sm font-bold flex items-center justify-center">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                        <p className="text-xs text-text-muted truncate">View profile</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="btn btn-outline w-full border-accent-red/20 text-accent-red hover:bg-accent-red/10 hover:border-accent-red/40 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-primary w-full rounded-full"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
