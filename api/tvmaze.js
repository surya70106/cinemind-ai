import { handleCors } from './_lib.js';

const TVMAZE_BASE = 'https://api.tvmaze.com';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const path = String(req.query.path || '').replace(/^\/+/, '');
  if (!path) {
    return res.status(400).json({ error: 'Missing path query parameter' });
  }

  const { path: _path, ...rest } = req.query;
  const query = new URLSearchParams();
  Object.entries(rest).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, String(v)));
    } else {
      query.append(key, String(value));
    }
  });

  const url = `${TVMAZE_BASE}/${path}${query.toString() ? `?${query}` : ''}`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    const text = await upstream.text();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    if (!upstream.ok) {
      return res.status(upstream.status).send(text);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text);
  } catch (error) {
    console.error('TVMaze proxy error:', error);
    return res.status(502).json({ error: 'Failed to reach TVMaze API' });
  }
}
