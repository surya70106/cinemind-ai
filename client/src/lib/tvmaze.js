/**
 * TVMaze API — public, no API key required. Called directly from the browser (CORS enabled).
 */

const TVMAZE_BASE = 'https://api.tvmaze.com';

/** Simple in-memory cache to avoid hammering the API */
const _cache = new Map();

function buildQueryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function tvmazeFetch(path, query = {}) {
  const cleanPath = path.replace(/^\/+/, '');
  const url = `${TVMAZE_BASE}/${cleanPath}${buildQueryString(query)}`;
  const res = await fetch(url);

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
    first_air_date: show.premiered || '',
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

const HERO_SHOW_IDS = [63234, 555, 15299]; // Daredevil: Born Again, Avatar: The Last Airbender (2005), The Boys
const BLOOMBERG_BRIEF_ID = 84705;
const DAREDEVIL_BORN_AGAIN_ID = 63234;

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
    const filtered = shows.filter((show) => show?.id !== BLOOMBERG_BRIEF_ID);

    const hasDaredevil = filtered.some((show) => show?.id === DAREDEVIL_BORN_AGAIN_ID);
    if (!hasDaredevil) {
      try {
        const daredevil = normalizeShow(await tvmazeFetch(`shows/${DAREDEVIL_BORN_AGAIN_ID}`));
        if (daredevil) filtered.unshift(daredevil);
      } catch (err) {
        console.error('Failed to inject Daredevil: Born Again into trending:', err);
      }
    }

    return { results: filtered.slice(0, 20) };
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

/** Featured hero slides — first 3 shows with images from TVMaze page 1 */
export async function getFeaturedShows() {
  return cached('featured', async () => {
    const settled = await Promise.allSettled(HERO_SHOW_IDS.map((id) => tvmazeFetch(`shows/${id}`)));
    const picks = settled
      .filter((result) => result.status === 'fulfilled')
      .map((result) => normalizeShow(result.value))
      .filter(Boolean);
    return picks;
  });
}

export async function searchShows(query) {
  if (!query?.trim()) return { results: [] };
  const data = await tvmazeFetch('search/shows', { q: query.trim() });
  return { results: data.map(normalizeSearchResult).filter(Boolean) };
}

// ── Detail endpoints ───────────────────────────────────────

export async function getShowDetails(id) {
  const showId = String(id ?? '').trim();
  if (!showId || showId === 'undefined' || showId === 'null') {
    throw new Error('Invalid show id');
  }

  return cached(`show_${showId}`, async () => {
    const data = await tvmazeFetch(`shows/${showId}`, {
      'embed[]': ['cast', 'episodes'],
    });
    const show = normalizeShow(data);

    show.credits = {
      cast: (data._embedded?.cast || []).map((c) => ({
        id: c.person?.id,
        name: c.person?.name,
        character: c.character?.name || '',
        profile_path: c.person?.image?.medium || null,
      }))
        .filter((c) => Number.isFinite(c.id) && c.name),
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
  const personId = String(id ?? '').trim();
  if (!personId || personId === 'undefined' || personId === 'null') {
    throw new Error('Invalid person id');
  }

  return cached(`person_${personId}`, async () => {
    const [personRes, creditsRes, imagesRes] = await Promise.allSettled([
      tvmazeFetch(`people/${personId}`),
      tvmazeFetch(`people/${personId}/castcredits`, { embed: 'show' }),
      tvmazeFetch(`people/${personId}/images`),
    ]);

    if (personRes.status !== 'fulfilled' || !personRes.value?.id) {
      throw new Error('Person not found');
    }

    const person = personRes.value;
    const credits = creditsRes.status === 'fulfilled' ? creditsRes.value : [];
    const imgs = imagesRes.status === 'fulfilled' ? imagesRes.value : [];

    const castCredits = Array.isArray(credits)
      ? credits
          .map((c) => ({
            character: c._links?.character?.name || '',
            show: c._embedded?.show ? normalizeShow(c._embedded.show) : null,
          }))
          .filter((c) => c.show && Number.isFinite(c.show.id) && c.show.title)
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
