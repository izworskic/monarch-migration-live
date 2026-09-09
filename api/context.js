import { fetchJson, numberParam, sendJson, setPublicCache } from '../lib/http.js';
import { formatLocalWindow, migrationPulse, seasonPhase } from '../lib/monarch-model.js';

const DIR = { N:0,NNE:22.5,NE:45,ENE:67.5,E:90,ESE:112.5,SE:135,SSE:157.5,S:180,SSW:202.5,SW:225,WSW:247.5,W:270,WNW:292.5,NW:315,NNW:337.5 };
const daysAgo = n => new Date(Date.now() - n*86400000).toISOString().slice(0,10);
const miles = text => Number(String(text || '').match(/[\d.]+/)?.[0] || 0);

async function countINat(lat, lng, d1, d2) {
  const radius = 1.75;
  const p = new URLSearchParams({
    taxon_id:'48662', quality_grade:'research', verifiable:'true',
    d1, d2, per_page:'1', license:'cc0,cc-by',
    nelat:String(Math.min(90,lat+radius)), nelng:String(Math.min(180,lng+radius)),
    swlat:String(Math.max(-90,lat-radius)), swlng:String(Math.max(-180,lng-radius))
  });
  const data = await fetchJson(`https://api.inaturalist.org/v1/observations?${p}`);
  return data.total_results || 0;
}

async function nwsWeather(lat, lng) {
  const points = await fetchJson(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`);
  const hourlyUrl = points.properties?.forecastHourly;
  if (!hourlyUrl) throw new Error('No hourly forecast');
  const hourly = await fetchJson(hourlyUrl);
  const first = hourly.properties?.periods?.[0] || {};
  return {
    temperatureF: first.temperature ?? null,
    windSpeedMph: miles(first.windSpeed),
    windDirection: first.windDirection || null,
    windDirectionDeg: DIR[first.windDirection] ?? null,
    precipProbability: first.probabilityOfPrecipitation?.value ?? null,
    shortForecast: first.shortForecast || null,
    forecastTime: first.startTime || null,
    sourceUpdatedAt: hourly.properties?.updateTime || null
  };
}

function habitatAction(phase) {
  if (phase === 'pre-arrival' || phase === 'spring-arrival') return 'Prioritize native milkweed establishment and early-to-midseason nectar continuity before breeding activity builds.';
  if (phase === 'breeding-season') return 'Keep native milkweed and pesticide-free nectar resources available; avoid cutting all milkweed at once.';
  if (phase === 'pre-migration' || phase === 'fall-migration') return 'Prioritize abundant late-blooming native nectar sources. Migrants need refueling habitat more than new milkweed establishment now.';
  return 'Plan next season’s native milkweed and nectar sequence using local frost and planting windows.';
}

export default async function handler(req, res) {
  setPublicCache(res, 900, 3600);
  const q = req.query || {};
  const lat = numberParam(q.lat, 43.6, 19, 55);
  const lng = numberParam(q.lng, -84.7, -130, -60);
  const requestedPopulation = ['east','west'].includes(q.population) ? q.population : null;
  const population = requestedPopulation || (lng < -105 ? 'west' : 'east');
  const now = new Date();
  const today = now.toISOString().slice(0,10);

  const sourceState = { weather:'live', observations:'live' };
  let weather = { temperatureF:null, windSpeedMph:null, windDirection:null, windDirectionDeg:null, precipProbability:null, shortForecast:null, forecastTime:null };
  let recentSightings = 0, previousSightings = 0;

  const [weatherResult, recentResult, prevResult] = await Promise.allSettled([
    nwsWeather(lat,lng),
    countINat(lat,lng,daysAgo(7),today),
    countINat(lat,lng,daysAgo(14),daysAgo(7))
  ]);
  if (weatherResult.status === 'fulfilled') weather = weatherResult.value; else sourceState.weather = 'degraded';
  if (recentResult.status === 'fulfilled') recentSightings = recentResult.value; else sourceState.observations = 'degraded';
  if (prevResult.status === 'fulfilled') previousSightings = prevResult.value; else sourceState.observations = 'degraded';

  const pulse = migrationPulse({
    latitude:lat, date:now, recentSightings, previousSightings,
    temperatureF:weather.temperatureF, windSpeedMph:weather.windSpeedMph,
    windDirectionDeg:weather.windDirectionDeg, precipProbability:weather.precipProbability,
    sourceFreshnessMinutes: sourceState.observations === 'live' ? 15 : 300,
    population
  });
  const phase = seasonPhase(lat, now);
  const windows = formatLocalWindow(lat, now);

  sendJson(res, 200, {
    generatedAt: now.toISOString(),
    location: { lat, lng },
    population,
    sourceState,
    observationSummary: {
      recent7dRecords: recentSightings,
      previous7dRecords: previousSightings,
      unit: 'licensed iNaturalist observation records',
      warning: 'Observation records are not individual butterfly counts.'
    },
    weather,
    model: {
      ...pulse,
      label: 'Migration Pulse',
      semantics: 'Modeled 0–100 local migration activity/flight-opportunity index; not a population count.'
    },
    timing: windows,
    habitatAction: habitatAction(phase),
    links: {
      planting: 'https://chrisizworski.com/national-tools/planting',
      journeyNorth: 'https://journeynorth.org/monarchs',
      monarchWatch: 'https://monarchwatch.org/tagging/'
    }
  });
}
