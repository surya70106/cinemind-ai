/**
 * TVMaze API — public, no API key required.
 * Production uses /api/tvmaze proxy (Vercel serverless) to avoid browser CORS/network issues.
 */

const TVMAZE_DIRECT = 'https://api.tvmaze.com';
const USE_PROXY = false;

/** Simple in-memory cache to avoid hammering the API */
const _cache = new Map();

async function tvmazeFetch(path, query = {}) {
  let res;
  const cleanPath = path.replace(/^\/+/, '');

  if (USE_PROXY) {
    const params = new URLSearchParams();
    params.set('path', cleanPath);
    Object.entries(query).forEach(([key, value]) => {
      if (value == null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    });
    res = await fetch(`/api/tvmaze?${params}`);
  } else {
    const qs = new URLSearchParams(query).toString();
    const url = `${TVMAZE_DIRECT}/${cleanPath}${qs ? `?${qs}` : ''}`;
    res = await fetch(url);
  }

  if (!res.ok) {
    throw new Error(`TVMaze request failed (${res.status}): ${path}`);
  }

  return res.json();
}

async function cached(key, fn, ttl = 30 * 60 * 1000) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;
  const data = await fn();
  _cache.set(key, { data, ts: Date.now() });
  return data;
}

function normalizeShow(show) {
  if (!show) return null;
  return {
    id: show.id,
    title: show.name,
    name: show.name,
    poster_path: show.image?.medium || show.image?.original || null,
    backdrop_path: show.image?.original || show.image?.medium || null,
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

function normalizeSearchResult(item) {
  return normalizeShow(item.show);
}

function sortByRating(shows, limit = 20) {
  const rated = shows
    .filter((s) => s.rating?.average)
    .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));

  const picked = rated.length > 0 ? rated : shows;
  return picked.slice(0, limit).map(normalizeShow);
}

// ── List endpoints ──────────────────────────────────────────

export async function getTrending() {
  return cached('trending', async () => {
    const data = await tvmazeFetch('schedule');
    const seen = new Set();
    const shows = [];
    for (const ep of data) {
      if (ep.show && !seen.has(ep.show.id)) {
        seen.add(ep.show.id);
        const normalized = normalizeShow(ep.show);
        if (normalized) shows.push(normalized);
      }
      if (shows.length >= 20) break;
    }
    return { results: shows };
  });
}

export async function getPopular(page = 1) {
  return cached(`popular_${page}`, async () => {
    const pageIndex = Math.max(0, Number(page) - 1);
    const data = await tvmazeFetch('shows', { page: String(pageIndex) });
    return { results: sortByRating(data) };
  });
}

export async function getTopRated(page = 1) {
  return cached(`top_rated_${page}`, async () => {
    const pageIndex = Math.max(0, Number(page) - 1);
    const data = await tvmazeFetch('shows', { page: String(pageIndex) });
    const sorted = data
      .filter((s) => s.rating?.average && s.rating.average >= 7)
      .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
      .slice(0, 20);
    const results = sorted.length > 0 ? sorted.map(normalizeShow) : sortByRating(data);
    return { results };
  });
}

export async function getHiddenGems() {
  return cached('hidden_gems', async () => {
    const data = await tvmazeFetch('shows', { page: '2' });
    const gems = data
      .filter((s) => s.rating?.average && s.rating.average >= 7.5 && s.image)
      .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
      .slice(0, 20);
    const results = gems.length > 0 ? gems.map(normalizeShow) : sortByRating(data.filter((s) => s.image));
    return { results };
  });
}

export async function searchShows(query) {
  if (!query?.trim()) return { results: [] };
  const data = await tvmazeFetch('search/shows', { q: query.trim() });
  return { results: data.map(normalizeSearchResult).filter(Boolean) };
}

// ── Detail endpoints ───────────────────────────────────────

export async function getShowDetails(id) {
  return cached(`show_${id}`, async () => {
    const data = await tvmazeFetch(`shows/${id}`, {
      'embed[]': ['cast', 'episodes'],
    });
    const show = normalizeShow(data);

    show.credits = {
      cast: (data._embedded?.cast || []).map((c) => ({
        id: c.person?.id,
        name: c.person?.name,
        character: c.character?.name || '',
        profile_path: c.person?.image?.medium || null,
      })),
    };

    show.videos = { results: [] };
    show.similar = { results: [] };

    return show;
  });
}

export async function getSimilarShows(id) {
  return cached(`similar_${id}`, async () => {
    try {
      const show = await tvmazeFetch(`shows/${id}`);
      const genre = show.genres?.[0];
      if (genre) {
        const searchResults = await tvmazeFetch('search/shows', { q: genre });
        const results = searchResults
          .map(normalizeSearchResult)
          .filter((s) => s && s.id !== Number(id))
          .slice(0, 12);
        return { results };
      }
    } catch (err) {
      console.error('getSimilarShows failed:', err);
    }
    return { results: [] };
  });
}

export async function getPersonDetails(id) {
  return cached(`person_${id}`, async () => {
    const [personRes, creditsRes, imagesRes] = await Promise.allSettled([
      tvmazeFetch(`people/${id}`),
      tvmazeFetch(`people/${id}/castcredits`, { embed: 'show' }),
      tvmazeFetch(`people/${id}/images`),
    ]);

    const person = personRes.status === 'fulfilled' ? personRes.value : {};
    const credits = creditsRes.status === 'fulfilled' ? creditsRes.value : [];
    const imgs = imagesRes.status === 'fulfilled' ? imagesRes.value : [];

    const castCredits = Array.isArray(credits)
      ? credits
          .map((c) => ({
            character: c._links?.character?.name || '',
            show: c._embedded?.show ? normalizeShow(c._embedded.show) : null,
          }))
          .filter((c) => c.show)
      : [];

    const images = Array.isArray(imgs)
      ? imgs
          .map((img) => ({
            id: img.id,
            type: img.type,
            medium: img.resolutions?.medium?.url || img.resolutions?.original?.url || null,
            original: img.resolutions?.original?.url || null,
          }))
          .filter((img) => img.medium || img.original)
      : [];

    return {
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
  });
}
