import { Router } from 'express';
import * as watchlistController from '../controllers/watchlistController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// All watchlist routes require authentication
router.use(authMiddleware);

router.get('/', watchlistController.getWatchlist);
router.post('/', watchlistController.addToWatchlist);
router.post('/add', watchlistController.addToWatchlist);
router.patch('/:movieId/watched', watchlistController.toggleWatched);
router.patch('/:movieId/toggle', watchlistController.toggleWatched);
router.patch('/:movieId/like', watchlistController.toggleLiked);
router.delete('/:movieId', watchlistController.removeFromWatchlist);

export default router;
