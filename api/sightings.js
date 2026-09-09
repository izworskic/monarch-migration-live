import { fetchJson, numberParam, sendJson, setPublicCache } from '../lib/http.js';
import { normalizeINatLicense } from '../lib/licenses.js';

const MONARCH_TAXON_ID = '48662';

function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  setPublicCache(res, 900, 3600);
  try {
    const q = req.query || {};
    const days = numberParam(q.days, 14, 1, 60);
    const perPage = numberParam(q.limit, 200, 1, 200);
    const params = new URLSearchParams({
      taxon_id: MONARCH_TAXON_ID,
      quality_grade: 'research',
      verifiable: 'true',
      d1: isoDaysAgo(days),
      order_by: 'observed_on',
      order: 'desc',
      per_page: String(perPage),
      license: 'cc0,cc-by'
    });

    for (const key of ['nelat','nelng','swlat','swlng']) {
      if (q[key] !== undefined && Number.isFinite(Number(q[key]))) params.set(key, String(Number(q[key])));
    }

    const url = `https://api.inaturalist.org/v1/observations?${params}`;
    const data = await fetchJson(url);
    const results = (data.results || []).flatMap(obs => {
      const coords = obs.geojson?.coordinates;
      const license = normalizeINatLicense(obs.license_code || '');
      if (!Array.isArray(coords) || coords.length < 2) return [];
      if (!['cc0','cc-by'].includes(license)) return [];
      return [{
        id: obs.id,
        observedOn: obs.observed_on,
        createdAt: obs.created_at,
        lat: coords[1],
        lng: coords[0],
        place: obs.place_guess || null,
        positionalAccuracyM: obs.positional_accuracy ?? null,
        license,
        url: `https://www.inaturalist.org/observations/${obs.id}`
      }];
    });

    sendJson(res, 200, {
      source: 'iNaturalist',
      sourceType: 'observed',
      licensePolicy: 'Only observation records licensed CC0 or CC BY are returned. Photos are not republished.',
      fetchedAt: new Date().toISOString(),
      windowDays: days,
      totalAvailable: data.total_results ?? null,
      returned: results.length,
      results
    });
  } catch (error) {
    sendJson(res, 502, {
      source: 'iNaturalist',
      sourceType: 'observed',
      degraded: true,
      fetchedAt: new Date().toISOString(),
      error: 'Live observation source is temporarily unavailable.'
    });
  }
}
