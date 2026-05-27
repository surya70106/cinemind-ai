import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, mood, genre, language, referenceMovie, actor, message, history } = req.body;

  try {
    if (action === 'recommend') {
      const prompt = `You are a TV show and movie recommendation expert. Based on the following preferences, recommend exactly 8 shows/movies.

User Preferences:
- Mood: ${mood || 'Any'}
- Preferred Genre: ${genre || 'Any'}
- Language: ${language || 'Any'}
- Reference Show (something they liked): ${referenceMovie || 'None specified'}
- Favorite Actor: ${actor || 'None specified'}

Return ONLY a valid JSON array with exactly 8 objects. Each object must have:
- "title": show/movie title (string)
- "year": release year (number)
- "reason": why this fits their preferences (2 sentences, string)
- "genres": array of genre strings
- "rating": rating out of 10 (number)
- "mood_match": how well it matches the mood as a percentage string (e.g. "92%")

Return ONLY the JSON array, no other text, no markdown code fences.`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text.trim();
      let recommendations;
      try {
        recommendations = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse AI recommendations');
        }
      }

      return res.json({ success: true, results: recommendations, data: recommendations });
    }

    if (action === 'chat') {
      const systemPrompt = `You are CineMind AI, a friendly and knowledgeable TV show and movie recommendation assistant.

Your personality:
- Enthusiastic about movies and shows but not pretentious
- Give concise, helpful responses
- Discuss plot details, trivia, cast, directors, and themes
- When recommending, explain WHY someone might enjoy them
- Respect spoiler sensitivity and warn before plot reveals
- Compare shows/movies, suggest alternatives, create themed lists

Keep responses conversational and engaging. If asked about non-movie/show topics, gently steer back.`;

      const messages = [
        ...(history || []).map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message },
      ];

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      });

      return res.json({ success: true, response: response.content[0].text });
    }

    return res.status(400).json({ error: 'Unknown action. Use "recommend" or "chat".' });
  } catch (error) {
    console.error('AI handler error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
