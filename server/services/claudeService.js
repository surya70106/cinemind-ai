import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function getMoodRecommendations({ mood, genre, language, referenceMovie, actor }) {
  const prompt = `You are a movie recommendation expert. Based on the following preferences, recommend exactly 8 movies.

User Preferences:
- Mood: ${mood || 'Any'}
- Preferred Genre: ${genre || 'Any'}
- Language: ${language || 'Any'}
- Reference Movie (something they liked): ${referenceMovie || 'None specified'}
- Favorite Actor: ${actor || 'None specified'}

Return ONLY a valid JSON array with exactly 8 movie objects. Each object must have:
- "title": movie title (string)
- "year": release year (number)
- "reason": why this movie fits their preferences (2 sentences, string)
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

  // Try to extract JSON from the response
  let recommendations;
  try {
    recommendations = JSON.parse(text);
  } catch {
    // If direct parse fails, try to find JSON array in the text
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      recommendations = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse AI recommendations');
    }
  }

  return recommendations;
}

export async function chatWithAI(userMessage, conversationHistory = []) {
  const systemPrompt = `You are CineMind AI, a friendly and knowledgeable movie recommendation assistant. You have extensive knowledge about films across all genres, eras, and languages.

Your personality:
- Enthusiastic about movies but not pretentious
- You give concise, helpful responses
- You can discuss plot details, trivia, cast, directors, and themes
- When recommending movies, you explain WHY someone might enjoy them
- You respect spoiler sensitivity and warn before revealing plot details
- You can compare movies, suggest alternatives, and create themed movie lists

Keep responses conversational and engaging. If asked about non-movie topics, gently steer the conversation back to movies.`;

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}
