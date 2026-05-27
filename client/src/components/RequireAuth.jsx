import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [loading, isAuthenticated, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <span className="material-symbols-outlined text-accent-green text-3xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return children;
}
