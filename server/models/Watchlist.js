import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  movieId: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
  },
  posterPath: {
    type: String,
  },
  rating: {
    type: Number,
  },
  genres: {
    type: [String],
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  watched: {
    type: Boolean,
    default: false,
  },
  liked: {
    type: Boolean,
    default: false,
  },
  watchedAt: {
    type: Date,
  },
});

// Compound index to prevent duplicate movies per user
watchlistSchema.index({ user: 1, movieId: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

export default Watchlist;
