/**
 * TVMaze API — public, no API key required.
 * All poster_path / backdrop_path are full URLs, use them directly in <img src={...} />.
 */

const BASE = 'https://api.tvmaze.com';

/** Simple in-memory cache to avoid hammering the API */
const _cache = new Map();
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

function normalizeSearchResult(item) {
  return normalizeShow(item.show);
}

// ── List endpoints ──────────────────────────────────────────

export async function getTrending() {
  return cached('trending', async () => {
    const res = await fetch(`${BASE}/schedule`);
    const data = await res.json();
    const seen = new Set();
    const shows = [];
    for (const ep of data) {
      if (ep.show && !seen.has(ep.show.id)) {
        seen.add(ep.show.id);
        shows.push(normalizeShow(ep.show));
      }
      if (shows.length >= 20) break;
    }
    return { results: shows };
  });
}

export async function getPopular(page = 1) {
  return cached(`popular_${page}`, async () => {
    const pageIndex = Math.max(0, Number(page) - 1);
    const res = await fetch(`${BASE}/shows?page=${pageIndex}`);
    const data = await res.json();
    const sorted = data
      .filter((s) => s.rating?.average)
      .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
      .slice(0, 20);
    return { results: sorted.map(normalizeShow) };
  });
}

export async function getTopRated(page = 1) {
  return cached(`top_rated_${page}`, async () => {
    const pageIndex = Math.max(0, Number(page) - 1);
    const res = await fetch(`${BASE}/shows?page=${pageIndex}`);
    const data = await res.json();
    const sorted = data
      .filter((s) => s.rating?.average && s.rating.average >= 7)
      .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
      .slice(0, 20);
    return { results: sorted.map(normalizeShow) };
  });
}

export async function getHiddenGems() {
  return cached('hidden_gems', async () => {
    const res = await fetch(`${BASE}/shows?page=2`);
    const data = await res.json();
    const gems = data
      .filter((s) => s.rating?.average && s.rating.average >= 7.5 && s.image)
      .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
      .slice(0, 20);
    return { results: gems.map(normalizeShow) };
  });
}

export async function searchShows(query) {
  if (!query?.trim()) return { results: [] };
  const res = await fetch(`${BASE}/search/shows?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return { results: data.map(normalizeSearchResult).filter(Boolean) };
}

// ── Detail endpoints ───────────────────────────────────────

export async function getShowDetails(id) {
  return cached(`show_${id}`, async () => {
    const res = await fetch(`${BASE}/shows/${id}?embed[]=cast&embed[]=episodes`);
    const data = await res.json();
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
      const res = await fetch(`${BASE}/shows/${id}`);
      const show = await res.json();
      const genre = show.genres?.[0];
      if (genre) {
        const sRes = await fetch(`${BASE}/search/shows?q=${encodeURIComponent(genre)}`);
        const searchResults = await sRes.json();
        const results = searchResults
          .map(normalizeSearchResult)
          .filter((s) => s && s.id !== Number(id))
          .slice(0, 12);
        return { results };
      }
    } catch {}
    return { results: [] };
  });
}

export async function getPersonDetails(id) {
  return cached(`person_${id}`, async () => {
    const [personRes, creditsRes, imagesRes] = await Promise.allSettled([
      fetch(`${BASE}/people/${id}`).then((r) => r.json()),
      fetch(`${BASE}/people/${id}/castcredits?embed=show`).then((r) => r.json()),
      fetch(`${BASE}/people/${id}/images`).then((r) => r.json()),
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
