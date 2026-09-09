import { fetchJson, sendJson, setPublicCache } from '../lib/http.js';

export default async function handler(req, res) {
  setPublicCache(res, 2592000, 604800);
  const zip = String(req.query?.zip || '').trim();
  if (!/^\d{5}$/.test(zip)) return sendJson(res, 400, { error: 'Enter a 5-digit U.S. ZIP code.' });
  try {
    const data = await fetchJson(`https://api.zippopotam.us/us/${zip}`);
    const place = data.places?.[0];
    if (!place) return sendJson(res, 404, { error: 'ZIP code not found.' });
    sendJson(res, 200, {
      zip,
      name: `${place['place name']}, ${place['state abbreviation']}`,
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      source: 'Zippopotam.us'
    });
  } catch {
    sendJson(res, 502, { error: 'Location lookup is temporarily unavailable.' });
  }
}
