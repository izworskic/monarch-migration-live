import { fetchJson, numberParam, sendJson, setPublicCache } from '../lib/http.js';

export default async function handler(req, res) {
  setPublicCache(res, 21600, 86400);
  try {
    const q = req.query || {};
    const lat = numberParam(q.lat, 39.5, -90, 90);
    const lng = numberParam(q.lng, -98.5, -180, 180);
    const radius = numberParam(q.radius, 2.5, 0.25, 10);
    const minYear = numberParam(q.minYear, new Date().getUTCFullYear() - 15, 1900, new Date().getUTCFullYear());
    const match = await fetchJson('https://api.gbif.org/v1/species/match?name=Danaus%20plexippus');
    const taxonKey = match.usageKey;
    if (!taxonKey) throw new Error('GBIF taxon resolution failed');

    const params = new URLSearchParams({
      taxon_key: String(taxonKey),
      decimal_latitude: `${Math.max(-90, lat-radius)},${Math.min(90, lat+radius)}`,
      decimal_longitude: `${Math.max(-180, lng-radius)},${Math.min(180, lng+radius)}`,
      year: `${minYear},${new Date().getUTCFullYear()}`,
      occurrence_status: 'PRESENT',
      limit: '0',
      facet: 'year',
      facet_limit: '100'
    });
    params.append('license', 'CC0_1_0');
    params.append('license', 'CC_BY_4_0');

    const data = await fetchJson(`https://api.gbif.org/v1/occurrence/search?${params}`);
    const yearFacet = (data.facets || []).find(f => f.field === 'YEAR' || f.field === 'year');
    const years = (yearFacet?.counts || []).map(row => ({ year: Number(row.name), records: row.count })).sort((a,b)=>a.year-b.year);
    sendJson(res, 200, {
      source: 'GBIF',
      sourceType: 'historical-observation-index',
      licensePolicy: 'Query limited to CC0 and CC BY occurrence records.',
      fetchedAt: new Date().toISOString(),
      taxonKey,
      area: { lat, lng, radiusDegrees: radius },
      years,
      caveat: 'Occurrence totals are influenced by observer effort and platform coverage. Use them as timing/observation context, not as population estimates.'
    });
  } catch {
    sendJson(res, 502, {
      source: 'GBIF',
      sourceType: 'historical-observation-index',
      degraded: true,
      fetchedAt: new Date().toISOString(),
      years: [],
      caveat: 'Historical occurrence service is temporarily unavailable.'
    });
  }
}
