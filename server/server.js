import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import moviesRoutes from './routes/movies.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Mount routes
app.use('/api/movies', moviesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CineMind API is running' });
});

// Global error handler
app.use(errorHandler);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will start without database connectivity');
  });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CineMind server running on port ${PORT}`);
});

export default app;
