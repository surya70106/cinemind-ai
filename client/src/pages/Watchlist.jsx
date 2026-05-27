import { Navigate } from 'react-router';

/** Legacy route — profile holds bucket list, watched, and favorites */
export default function Watchlist() {
  return <Navigate to="/profile?tab=bucket" replace />;
}
