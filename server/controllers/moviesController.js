import * as tmdbService from '../services/tmdbService.js';

export async function getTrending(req, res) {
  try {
    const data = await tmdbService.getTrending();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getPopular(req, res) {
  try {
    const { page } = req.query;
    const data = await tmdbService.getPopular(page);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTopRated(req, res) {
  try {
    const { page } = req.query;
    const data = await tmdbService.getTopRated(page);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUpcoming(req, res) {
  try {
    const { page } = req.query;
    const data = await tmdbService.getUpcoming(page);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getHiddenGems(req, res) {
  try {
    const data = await tmdbService.getHiddenGems();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function searchMovies(req, res) {
  try {
    const { q, page } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    const data = await tmdbService.searchMovies(q, page);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMovieDetails(req, res) {
  try {
    const { id } = req.params;
    const data = await tmdbService.getMovieDetails(id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getSimilarMovies(req, res) {
  try {
    const { id } = req.params;
    const data = await tmdbService.getSimilarMovies(id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCredits(req, res) {
  try {
    const { id } = req.params;
    const data = await tmdbService.getCredits(id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getVideos(req, res) {
  try {
    const { id } = req.params;
    const data = await tmdbService.getVideos(id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getPersonDetails(req, res) {
  try {
    const { id } = req.params;
    const data = await tmdbService.getPersonDetails(id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
