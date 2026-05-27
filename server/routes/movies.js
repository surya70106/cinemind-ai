import { Router } from 'express';
import * as moviesController from '../controllers/moviesController.js';

const router = Router();

router.get('/trending', moviesController.getTrending);
router.get('/popular', moviesController.getPopular);
router.get('/top-rated', moviesController.getTopRated);
router.get('/upcoming', moviesController.getUpcoming);
router.get('/hidden-gems', moviesController.getHiddenGems);
router.get('/search', moviesController.searchMovies);
router.get('/person/:id', moviesController.getPersonDetails);
router.get('/:id', moviesController.getMovieDetails);
router.get('/:id/similar', moviesController.getSimilarMovies);
router.get('/:id/credits', moviesController.getCredits);
router.get('/:id/videos', moviesController.getVideos);

export default router;
