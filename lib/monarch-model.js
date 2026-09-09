const FALL_TABLE = [
  [49, '08-26', -8, 4], [47, '09-01', -8, 4], [45, '09-06', -8, 4],
  [43, '09-11', -8, 4], [41, '09-16', -8, 4], [39, '09-22', -8, 4],
  [37, '09-27', -8, 4], [35, '10-02', -8, 4], [33, '10-07', -8, 4],
  [31, '10-12', -8, 4], [29, '10-18', -8, 4], [27, '10-23', -8, 4],
  [25, '10-28', -8, 4], [23, '11-04', -8, 4], [21, '11-11', -8, 4],
  [19.4, '11-18', -8, 4]
];

const SPRING_TABLE = [
  [49, '06-07'], [47, '05-30'], [45, '05-22'], [43, '05-14'], [41, '05-06'],
  [39, '04-28'], [37, '04-14'], [35, '04-02'], [33, '03-27'], [31, '03-22'],
  [29, '03-18'], [27, '03-15'], [25, '03-13']
];

const DAY = 86400000;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toRad = d => d * Math.PI / 180;
const toDeg = r => r * 180 / Math.PI;

function dateForMMDD(mmdd, year) {
  const [m, d] = mmdd.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, d, 12));
}

function interpolateDate(table, latitude, year) {
  const lat = clamp(latitude, table[table.length - 1][0], table[0][0]);
  let hi = table[0], lo = table[table.length - 1];
  for (let i = 0; i < table.length - 1; i++) {
    if (lat <= table[i][0] && lat >= table[i + 1][0]) {
      hi = table[i]; lo = table[i + 1]; break;
    }
  }
  const t = (hi[0] - lat) / Math.max(0.001, hi[0] - lo[0]);
  const a = dateForMMDD(hi[1], year).getTime();
  const b = dateForMMDD(lo[1], year).getTime();
  return new Date(a + (b - a) * t);
}

export function fallPeakForLatitude(latitude, year = new Date().getUTCFullYear()) {
  const midpoint = interpolateDate(FALL_TABLE, latitude, year);
  return {
    midpoint,
    peakStart: new Date(midpoint.getTime() - 8 * DAY),
    peakEnd: new Date(midpoint.getTime() + 4 * DAY),
    leadingEdgeStart: new Date(midpoint.getTime() - 18 * DAY),
    trailingEnd: new Date(midpoint.getTime() + 18 * DAY)
  };
}

export function springArrivalForLatitude(latitude, year = new Date().getUTCFullYear()) {
  return interpolateDate(SPRING_TABLE, latitude, year);
}

export function solarNoonAltitude(latitude, date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / DAY);
  const gamma = 2 * Math.PI / 365 * (day - 1);
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  return 90 - Math.abs(latitude - toDeg(decl));
}

export function southwardTailwindMph(windSpeedMph, windDirectionDeg) {
  return windSpeedMph * Math.cos(toRad(windDirectionDeg));
}

export function seasonPhase(latitude, date = new Date()) {
  const year = date.getUTCFullYear();
  const spring = springArrivalForLatitude(latitude, year);
  const fall = fallPeakForLatitude(latitude, year);
  const t = date.getTime();
  if (t < spring.getTime() - 30 * DAY) return 'pre-arrival';
  if (t < spring.getTime() + 21 * DAY) return 'spring-arrival';
  if (t < fall.leadingEdgeStart.getTime() - 28 * DAY) return 'breeding-season';
  if (t < fall.leadingEdgeStart.getTime()) return 'pre-migration';
  if (t <= fall.trailingEnd.getTime()) return 'fall-migration';
  return 'post-migration';
}

function timingScore(latitude, date) {
  const phase = seasonPhase(latitude, date);
  if (phase === 'fall-migration') {
    const { midpoint, trailingEnd, leadingEdgeStart } = fallPeakForLatitude(latitude, date.getUTCFullYear());
    const d = Math.abs(date - midpoint) / DAY;
    const peak = Math.exp(-0.5 * Math.pow(d / 7.5, 2)) * 100;
    const floor = (date >= leadingEdgeStart && date <= trailingEnd) ? 35 : 0;
    return Math.max(floor, peak);
  }
  if (phase === 'spring-arrival') {
    const arrival = springArrivalForLatitude(latitude, date.getUTCFullYear());
    const d = Math.abs(date - arrival) / DAY;
    return Math.exp(-0.5 * Math.pow(d / 11, 2)) * 80;
  }
  if (phase === 'breeding-season') return 28;
  if (phase === 'pre-migration') return 38;
  return 8;
}

export function migrationPulse({
  latitude,
  date = new Date(),
  recentSightings = 0,
  previousSightings = 0,
  temperatureF = null,
  windSpeedMph = null,
  windDirectionDeg = null,
  precipProbability = null,
  sourceFreshnessMinutes = 0,
  population = 'east'
}) {
  const phase = seasonPhase(latitude, date);
  const timing = timingScore(latitude, date);
  const liveBase = recentSightings <= 0 ? 0 : clamp(28 + Math.log10(recentSightings + 1) * 26, 0, 100);
  const trendRatio = previousSightings > 0 ? recentSightings / previousSightings : (recentSightings > 0 ? 1.25 : 0.7);
  const trend = clamp(50 + (trendRatio - 1) * 45, 0, 100);
  const sightings = clamp(liveBase * 0.75 + trend * 0.25, 0, 100);

  let flight = 50;
  if (temperatureF != null) {
    if (temperatureF < 50) flight -= 35;
    else if (temperatureF < 58) flight -= 18;
    else if (temperatureF <= 82) flight += 18;
    else if (temperatureF > 92) flight -= 8;
  }
  if (precipProbability != null) flight -= clamp(precipProbability, 0, 100) * 0.25;

  let tailwind = 50;
  if (windSpeedMph != null && windDirectionDeg != null && phase === 'fall-migration') {
    const south = southwardTailwindMph(windSpeedMph, windDirectionDeg);
    tailwind = clamp(50 + south * 3.2, 10, 95);
    if (windSpeedMph > 25) tailwind -= 12;
  }
  if (phase !== 'fall-migration') tailwind = 50;
  flight = clamp((flight * 0.6) + (tailwind * 0.4), 0, 100);

  const weights = population === 'west'
    ? { sightings: 0.48, timing: 0.22, flight: 0.25, freshness: 0.05 }
    : { sightings: 0.40, timing: 0.30, flight: 0.25, freshness: 0.05 };
  const freshness = clamp(100 - Math.max(0, sourceFreshnessMinutes - 15) * 0.7, 25, 100);
  const score = Math.round(
    sightings * weights.sightings + timing * weights.timing + flight * weights.flight + freshness * weights.freshness
  );

  const sparse = recentSightings < 3;
  const stale = sourceFreshnessMinutes > 180;
  let confidence = 88;
  if (sparse) confidence -= 22;
  if (stale) confidence -= 25;
  if (population === 'west') confidence -= 8;
  confidence = clamp(confidence, 25, 95);

  return {
    score,
    confidence: Math.round(confidence),
    phase,
    components: {
      liveObservations: Math.round(sightings),
      historicalTiming: Math.round(timing),
      flightConditions: Math.round(flight),
      freshness: Math.round(freshness)
    },
    observationTrend: trendRatio >= 1.2 ? 'rising' : trendRatio <= 0.8 ? 'falling' : 'steady',
    solarNoonAltitude: Number(solarNoonAltitude(latitude, date).toFixed(1))
  };
}

export function formatLocalWindow(latitude, date = new Date()) {
  const fall = fallPeakForLatitude(latitude, date.getUTCFullYear());
  const spring = springArrivalForLatitude(latitude, date.getUTCFullYear());
  return {
    springArrival: spring.toISOString(),
    fallLeadingEdge: fall.leadingEdgeStart.toISOString(),
    fallPeakStart: fall.peakStart.toISOString(),
    fallMidpoint: fall.midpoint.toISOString(),
    fallPeakEnd: fall.peakEnd.toISOString(),
    fallTrailingEnd: fall.trailingEnd.toISOString()
  };
}
