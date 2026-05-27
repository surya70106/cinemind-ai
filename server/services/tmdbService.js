import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 1800 }); // 30-minute cache

const TVMAZE_BASE = 'https://api.tvmaze.com';

/**
 * Normalize a TVMaze show object into our standard format
 * Maps TVMaze fields → the same field names the frontend expects
 * poster_path and backdrop_path are FULL URLs (not fragments)
 */
function normalizeShow(show) {
  if (!show) return null;
  return {
    id: show.id,
    title: show.name,
    name: show.name,
    poster_path: show.image?.medium || null,
    backdrop_path: show.image?.original || null,
    vote_average: show.rating?.average || 0,
    release_date: show.premiered || '',
    overview: show.summary ? show.summary.replace(/<[^>]+>/g, '') : '',
    genres: (show.genres || []).map((g) => ({ id: g, name: g })),
    genre_names: show.genres || [],
    language: show.language || '',
    status: show.status || '',
    runtime: show.runtime || null,
    type: show.type || '',
    network: show.network?.name || show.webChannel?.name || '',
    officialSite: show.officialSite || '',
  };
}

/**
 * Normalize a search result { score, show } into our standard format
 */
function normalizeSearchResult(item) {
  return normalizeShow(item.show);
}

// ─── List endpoints ─────────────────────────────────────────

export async function getTrending() {
  const cacheKey = 'trending';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Use the schedule endpoint for "trending today"
  const { data } = await axios.get(`${TVMAZE_BASE}/schedule`);
  // Deduplicate by show id and normalize
  const seen = new Set();
  const shows = [];
  for (const episode of data) {
    if (episode.show && !seen.has(episode.show.id)) {
      seen.add(episode.show.id);
      shows.push(normalizeShow(episode.show));
    }
    if (shows.length >= 20) break;
  }
  const result = { results: shows };
  cache.set(cacheKey, result);
  return result;
}

export async function getPopular(page = 1) {
  const cacheKey = `popular_${page}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // TVMaze shows index — page 0 contains IDs 1-250 (most established shows)
  const pageIndex = Math.max(0, Number(page) - 1);
  const { data } = await axios.get(`${TVMAZE_BASE}/shows?page=${pageIndex}`);
  // Sort by rating descending, take top 20
  const sorted = data
    .filter((s) => s.rating?.average)
    .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
    .slice(0, 20);
  const result = { results: sorted.map(normalizeShow) };
  cache.set(cacheKey, result);
  return result;
}

export async function getTopRated(page = 1) {
  const cacheKey = `top_rated_${page}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch a range of shows and pick the highest rated
  const pageIndex = Math.max(0, Number(page) - 1);
  const { data } = await axios.get(`${TVMAZE_BASE}/shows?page=${pageIndex}`);
  const sorted = data
    .filter((s) => s.rating?.average && s.rating.average >= 7)
    .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
    .slice(0, 20);
  const result = { results: sorted.map(normalizeShow) };
  cache.set(cacheKey, result);
  return result;
}

export async function getUpcoming(page = 1) {
  const cacheKey = `upcoming_${page}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Use schedule for upcoming shows
  const { data } = await axios.get(`${TVMAZE_BASE}/schedule`);
  const seen = new Set();
  const shows = [];
  for (const episode of data) {
    if (episode.show && !seen.has(episode.show.id)) {
      seen.add(episode.show.id);
      shows.push(normalizeShow(episode.show));
    }
  }
  // Take a different slice than trending
  const result = { results: shows.slice(10, 30) };
  cache.set(cacheKey, result);
  return result;
}

export async function getHiddenGems() {
  const cacheKey = 'hidden_gems';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch page 2-3 of shows (less well-known) with good ratings
  const { data } = await axios.get(`${TVMAZE_BASE}/shows?page=2`);
  const gems = data
    .filter((s) => s.rating?.average && s.rating.average >= 7.5 && s.image)
    .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
    .slice(0, 20);
  const result = { results: gems.map(normalizeShow) };
  cache.set(cacheKey, result);
  return result;
}

// ─── Search ─────────────────────────────────────────────────

export async function searchMovies(query, page = 1) {
  if (!query) return { results: [] };
  const { data } = await axios.get(`${TVMAZE_BASE}/search/shows`, {
    params: { q: query },
  });
  const results = data.map(normalizeSearchResult).filter(Boolean);
  return { results };
}

// ─── Detail endpoints ───────────────────────────────────────

export async function getMovieDetails(id) {
  const cacheKey = `show_${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch show with embedded cast and episodes
  const { data } = await axios.get(`${TVMAZE_BASE}/shows/${id}`, {
    params: { embed: ['cast', 'episodes'] },
  });

  const show = normalizeShow(data);

  // Attach embedded data
  show.credits = {
    cast: (data._embedded?.cast || []).map((c) => ({
      id: c.person?.id,
      name: c.person?.name,
      character: c.character?.name || '',
      profile_path: c.person?.image?.medium || null,
    })),
  };

  show.videos = {
    results: [], // TVMaze doesn't provide videos
  };

  show.similar = {
    results: [], // Will be fetched separately if needed
  };

  const result = show;
  cache.set(cacheKey, result);
  return result;
}

export async function getSimilarMovies(id) {
  const cacheKey = `similar_${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Get the show's genres, then search for shows with similar names
  try {
    const { data: show } = await axios.get(`${TVMAZE_BASE}/shows/${id}`);
    const genre = show.genres?.[0];
    if (genre) {
      const { data: searchResults } = await axios.get(`${TVMAZE_BASE}/search/shows`, {
        params: { q: genre },
      });
      const results = searchResults
        .map(normalizeSearchResult)
        .filter((s) => s && s.id !== Number(id))
        .slice(0, 12);
      const result = { results };
      cache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    // fallback
  }
  const result = { results: [] };
  cache.set(cacheKey, result);
  return result;
}

export async function getCredits(id) {
  const cacheKey = `credits_${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get(`${TVMAZE_BASE}/shows/${id}/cast`);
  const result = {
    cast: data.map((c) => ({
      id: c.person?.id,
      name: c.person?.name,
      character: c.character?.name || '',
      profile_path: c.person?.image?.medium || null,
    })),
  };
  cache.set(cacheKey, result);
  return result;
}

export async function getVideos(id) {
  // TVMaze doesn't have a videos endpoint
  return { results: [] };
}

export async function getProviders(id) {
  // TVMaze doesn't have a providers endpoint
  // But we can return the network/webchannel info from show details
  try {
    const { data } = await axios.get(`${TVMAZE_BASE}/shows/${id}`);
    return {
      network: data.network?.name || data.webChannel?.name || null,
      officialSite: data.officialSite || null,
    };
  } catch {
    return { network: null, officialSite: null };
  }
}

export async function getGenres() {
  // TVMaze doesn't have a genres endpoint, return static list
  const genres = [
    'Action', 'Adventure', 'Anime', 'Comedy', 'Crime', 'Drama',
    'Espionage', 'Family', 'Fantasy', 'History', 'Horror', 'Legal',
    'Medical', 'Music', 'Mystery', 'Romance', 'Science-Fiction',
    'Sports', 'Supernatural', 'Thriller', 'War', 'Western',
  ];
  return { genres: genres.map((name, i) => ({ id: i + 1, name })) };
}

// ─── Person / Cast endpoints ────────────────────────────────

export async function getPersonDetails(id) {
  const cacheKey = `person_${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch person info
  const { data: person } = await axios.get(`${TVMAZE_BASE}/people/${id}`);

  // Fetch their cast credits (shows they've been in)
  let castCredits = [];
  try {
    const { data: credits } = await axios.get(`${TVMAZE_BASE}/people/${id}/castcredits`, {
      params: { embed: 'show' },
    });
    castCredits = (credits || []).map((c) => ({
      character: c._links?.character?.name || '',
      show: c._embedded?.show ? normalizeShow(c._embedded.show) : null,
    })).filter((c) => c.show);
  } catch {}

  // Fetch their images
  let images = [];
  try {
    const { data: imgs } = await axios.get(`${TVMAZE_BASE}/people/${id}/images`);
    images = (imgs || []).map((img) => ({
      id: img.id,
      type: img.type,
      main: img.main,
      medium: img.resolutions?.medium?.url || img.resolutions?.original?.url || null,
      original: img.resolutions?.original?.url || null,
    })).filter((img) => img.medium || img.original);
  } catch {}

  const result = {
    id: person.id,
    name: person.name,
    image: person.image?.medium || null,
    image_original: person.image?.original || null,
    birthday: person.birthday || null,
    deathday: person.deathday || null,
    gender: person.gender || null,
    country: person.country?.name || null,
    url: person.url || null,
    castCredits,
    images,
  };

  cache.set(cacheKey, result);
  return result;
}
