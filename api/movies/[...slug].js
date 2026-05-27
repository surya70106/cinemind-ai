import { handleCors } from '../_lib.js';

const TVMAZE_BASE = 'https://api.tvmaze.com';

function stripHtml(text = '') {
  return text.replace(/<[^>]+>/g, '');
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
    overview: show.summary ? stripHtml(show.summary) : '',
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

async function tvmaze(pathname, query = {}) {
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v)) v.forEach((item) => qs.append(k, String(item)));
    else qs.set(k, String(v));
  });
  const url = `${TVMAZE_BASE}/${pathname}${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`TVMaze error ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const parts = Array.isArray(req.query.slug) ? req.query.slug : [];
    const first = parts[0];

    if (!first) return res.status(400).json({ error: 'Missing route segment' });

    if (first === 'trending') {
      const data = await tvmaze('schedule');
      const seen = new Set();
      const results = [];
      for (const ep of data) {
        if (ep?.show && !seen.has(ep.show.id)) {
          seen.add(ep.show.id);
          const normalized = normalizeShow(ep.show);
          if (normalized) results.push(normalized);
        }
        if (results.length >= 20) break;
      }
      return res.status(200).json({ results });
    }

    if (first === 'popular' || first === 'top-rated' || first === 'hidden-gems') {
      const page = first === 'hidden-gems' ? 2 : 0;
      const shows = await tvmaze('shows', { page });
      let filtered = shows;

      if (first === 'top-rated') {
        filtered = shows.filter((s) => s.rating?.average && s.rating.average >= 7);
      } else if (first === 'hidden-gems') {
        filtered = shows.filter((s) => s.rating?.average && s.rating.average >= 7.5 && s.image);
      }

      const results = filtered
        .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
        .slice(0, 20)
        .map(normalizeShow);

      return res.status(200).json({ results });
    }

    if (first === 'search') {
      const q = String(req.query.q || '').trim();
      if (!q) return res.status(200).json({ results: [] });
      const matches = await tvmaze('search/shows', { q });
      return res.status(200).json({
        results: matches.map((m) => normalizeShow(m.show)).filter(Boolean),
      });
    }

    if (/^\d+$/.test(first)) {
      const id = Number(first);
      const data = await tvmaze(`shows/${id}`, { 'embed[]': ['cast', 'episodes'] });
      const show = normalizeShow(data);
      show.credits = {
        cast: (data._embedded?.cast || []).map((c) => ({
          id: c.person?.id,
          name: c.person?.name,
          character: c.character?.name || '',
          profile_path: c.person?.image?.medium || null,
        })),
      };
      return res.status(200).json(show);
    }

    return res.status(404).json({ error: 'Unknown movies route' });
  } catch (error) {
    console.error('Legacy movies API error:', error);
    return res.status(500).json({ error: 'Failed to fetch movie data' });
  }
}
