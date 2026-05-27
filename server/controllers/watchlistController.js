import Watchlist from '../models/Watchlist.js';

function mapRow(doc) {
  return {
    id: doc.movieId,
    title: doc.title,
    poster_path: doc.posterPath,
    watched: doc.watched ?? false,
    liked: doc.liked ?? false,
    user_rating: doc.rating ?? null,
    added_at: doc.addedAt,
    rowId: doc._id,
  };
}

export async function getWatchlist(req, res) {
  try {
    const items = await Watchlist.find({ user: req.user.userId }).sort({ addedAt: -1 });
    const mapped = items.map(mapRow);
    res.json({ success: true, watchlist: mapped, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function addToWatchlist(req, res) {
  try {
    const movieId = Number(req.body.movieId ?? req.body.movie_id ?? req.body.id);
    if (!movieId) return res.status(400).json({ success: false, message: 'movieId is required' });

    // Upsert — if already exists return it, otherwise create
    let item = await Watchlist.findOne({ user: req.user.userId, movieId });
    if (!item) {
      item = await Watchlist.create({
        user: req.user.userId,
        movieId,
        title: req.body.title || req.body.movie_title || '',
        posterPath: req.body.posterPath ?? req.body.poster ?? '',
      });
    }

    res.status(201).json({ success: true, data: mapRow(item) });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key — already in watchlist, that's fine
      const item = await Watchlist.findOne({ user: req.user.userId, movieId: Number(req.body.movieId) });
      return res.json({ success: true, data: item ? mapRow(item) : null });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleWatched(req, res) {
  try {
    const movieId = Number(req.params.movieId);
    const { rating, watched } = req.body;

    let item = await Watchlist.findOne({ user: req.user.userId, movieId });

    // Auto-create if not in watchlist yet (e.g. marking watched from detail page)
    if (!item) {
      item = await Watchlist.create({
        user: req.user.userId,
        movieId,
        title: req.body.title || '',
        posterPath: req.body.posterPath ?? req.body.poster ?? '',
        watched: watched !== undefined ? !!watched : true,
        rating: rating !== undefined ? Number(rating) : undefined,
        watchedAt: watched !== false ? new Date() : undefined,
      });
      return res.json({ success: true, data: mapRow(item) });
    }

    const setWatched = watched !== undefined ? !!watched : !item.watched;
    item.watched = setWatched;
    if (setWatched) {
      item.watchedAt = new Date();
      if (rating !== undefined) item.rating = Number(rating);
    } else {
      item.watchedAt = undefined;
      item.rating = undefined;
    }
    await item.save();

    res.json({ success: true, data: mapRow(item) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleLiked(req, res) {
  try {
    const movieId = Number(req.params.id || req.params.movieId);
    const item = await Watchlist.findOne({ user: req.user.userId, movieId });
    if (!item) return res.status(404).json({ success: false, message: 'Watchlist item not found' });

    item.liked = !item.liked;
    await item.save();
    res.json({ success: true, data: mapRow(item) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function removeFromWatchlist(req, res) {
  try {
    const movieId = Number(req.params.movieId);
    await Watchlist.deleteOne({ user: req.user.userId, movieId });
    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
