import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useNavbarHeight } from '../hooks/useNavbarHeight';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, isAuthenticated } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const navH = useNavbarHeight();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-4 pb-16"
      style={{ paddingTop: navH + 32 }}
    >
      <div className="w-full max-w-sm">
        <div className="panel shadow-xl shadow-black/30 panel-body">
          <div className="mb-8">
            <h1 className="font-display text-headline text-text-primary leading-none">CINEMIND</h1>
            <p className="text-text-secondary text-sm mt-3">
              {isLogin ? 'Sign in to pick up where you left off.' : 'Create your account to start discovering.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label="Authentication tabs"
            className="flex gap-2 mb-8 bg-surface-container-high rounded-xl p-1.5 border border-outline-variant/30"
          >
            <button
              role="tab"
              aria-selected={isLogin}
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-3 px-3 rounded-lg text-sm font-bold transition-colors ${
                isLogin
                  ? 'bg-accent-green-container text-bg-primary shadow-lg shadow-accent-green/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-container transition-colors'
              }`}
            >
              Sign In
            </button>
            <button
              role="tab"
              aria-selected={!isLogin}
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-3 px-3 rounded-lg text-sm font-bold transition-colors ${
                !isLogin
                  ? 'bg-accent-green-container text-bg-primary shadow-lg shadow-accent-green/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-container transition-colors'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs text-text-muted font-semibold" htmlFor="name">
                  Username
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. skywalker"
                  required={!isLogin}
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-green/50 transition-colors"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-text-muted font-semibold" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg bg-bg-card border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-muted font-semibold" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-bg-card border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/30 rounded-lg p-3"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-12 rounded-xl"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  {isLogin ? 'Signing in...' : 'Creating...'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">
                    {isLogin ? 'login' : 'person_add'}
                  </span>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </motion.main>
  );
}
