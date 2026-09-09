import { sendJson, setPublicCache } from '../lib/http.js';
export default async function handler(req, res) {
  setPublicCache(res, 300, 900);
  sendJson(res, 200, {
    generatedAt: new Date().toISOString(),
    product: 'Monarch Migration Live',
    semantics: {
      observed: 'Directly reported occurrence records from licensed community-science sources.',
      modeled: 'Deterministic timing/flight estimate. Never a count of butterflies.',
      historical: 'Long-term baseline or occurrence index. Not a live condition.'
    },
    sources: [
      { id: 'inat', name: 'iNaturalist', role: 'recent observations', cadence: 'near-real-time', licensePolicy: 'CC0/CC BY records only' },
      { id: 'nws', name: 'National Weather Service', role: 'flight weather', cadence: 'hourly forecast', licensePolicy: 'U.S. government open data' },
      { id: 'gbif', name: 'GBIF', role: 'historical occurrence context', cadence: 'cached 6h', licensePolicy: 'CC0/CC BY only' },
      { id: 'monarchwatch', name: 'Monarch Watch', role: 'published migration phenology baseline', cadence: 'static reference', licensePolicy: 'derived timing parameters with source attribution' }
    ]
  });
}
