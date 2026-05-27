import { getMoodRecommendations, chatWithAI } from '../services/claudeService.js';
import { searchMovies } from '../services/tmdbService.js';

export async function recommend(req, res) {
  try {
    const { mood, genre, language, referenceMovie, actor } = req.body;

    const recommendations = await getMoodRecommendations({
      mood,
      genre,
      language,
      referenceMovie,
      actor,
    });

    // Enrich each recommendation with TVMaze show data
    const enrichedResults = await Promise.all(
      recommendations.map(async (rec) => {
        try {
          const searchResult = await searchMovies(rec.title);
          const match = searchResult.results?.[0];
          return {
            ...rec,
            poster_path: match?.poster_path || null,
            backdrop_path: match?.backdrop_path || null,
            id: match?.id || null,
          };
        } catch {
          return {
            ...rec,
            poster_path: null,
            backdrop_path: null,
            id: null,
          };
        }
      })
    );

    res.json({ success: true, data: enrichedResults });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function chat(req, res) {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const response = await chatWithAI(message, history);
    res.json({ success: true, data: { response } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
