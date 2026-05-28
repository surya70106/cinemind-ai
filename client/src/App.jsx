import { useLocation } from 'react-router';
import { Routes, Route } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { WatchlistProvider } from './context/WatchlistContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIChatBox from './components/AIChatBox';
import Home from './pages/Home';
import Discover from './pages/Discover';
import MovieDetail from './pages/MovieDetail';
import PersonDetail from './pages/PersonDetail';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <WatchlistProvider>
        <div className="min-h-screen bg-bg-primary text-text-primary">
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/show/:id" element={<MovieDetail />} />
              <Route path="/person/:id" element={<PersonDetail />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<Login />} />
            </Routes>
          </AnimatePresence>
          <Footer />
          <AIChatBox />
        </div>
      </WatchlistProvider>
    </AuthProvider>
  );
}
