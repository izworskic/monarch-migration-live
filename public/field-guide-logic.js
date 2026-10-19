// Client-only interpretive helpers. All verdicts are contextual guidance, not sighting forecasts.
const valid = value => typeof value === 'number' && Number.isFinite(value);
const dateText = iso => {
  if (!iso || !Number.isFinite(new Date(iso).getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', timeZone:'UTC' }).format(new Date(iso));
};

function timingText(data) {
  const t=data?.timing || {};
  if (data?.population === 'west') return 'Western seasonal context; no eastern latitude peak assigned';
  const a=dateText(t.fallPeakStart), b=dateText(t.fallPeakEnd);
  return a && b ? 'Typical fall peak: ' + a + '–' + b : 'Historical timing unavailable';
}

function observationText(data) {
  const records=data?.observationSummary?.recent7dRecords;
  if (!valid(records)) return 'Recent licensed records unavailable';
  if (records === 0) return 'No records in the last 7 days (not proof of absence)';
  return records + ' licensed observation record' + (records === 1 ? '' : 's') + ' in the last 7 days';
}

function weatherText(data) {
  const w=data?.weather || {};
  if (!valid(w.temperatureF)) return 'NWS weather unavailable';
  return Math.round(w.temperatureF) + '°F · ' +
    (valid(w.windSpeedMph) ? Math.round(w.windSpeedMph) + ' mph wind' : 'wind unavailable') +
    (w.shortForecast ? ' · ' + w.shortForecast : '');
}

export function assessMonarchOuting(data) {
  const model=data?.model || {};
  const phase=model.phase || 'unknown';
  const weatherScore=model.components?.flightConditions;
  const observations=observationText(data);
  const evidence=[
    {label:'Historical timing', value:timingText(data)},
    {label:'Reported sightings', value:observations},
    {label:'NWS conditions', value:weatherText(data)}
  ];
  const caveat='This is a planning interpretation, not an arrival prediction or a butterfly census. Reporting effort varies.';
  if (data?.population === 'west') {
    return {
      tone:'western', tag:'WESTERN MONITORING',
      title:'Check the official grove report before traveling',
      summary:'Western monarchs follow a different seasonal pattern. Recent regional records and local weather do not prove a California overwintering grove is occupied. Use the dated official counts below to plan a visit.',
      evidence, caveat:'No eastern-style migration score or assumed current sanctuary count. Check official monitoring and site access.'
    };
  }
  if (!valid(model.score) || !valid(weatherScore)) {
    return {
      tone:'unknown', tag:'LIVE SOURCES INCOMPLETE',
      title:'Use the seasonal window, not a live verdict',
      summary:'The observation or weather feed is incomplete. The historical season may help you plan, but there is not enough verified information for a current outing recommendation.',
      evidence, caveat
    };
  }
  const active=phase==='fall-migration' || phase==='spring-arrival';
  if (!active) {
    const upcoming=phase==='pre-migration' ? ' The typical local fall peak appears in the timing note below.' : '';
    return {
      tone:'plan', tag:'SEASONAL PLANNING',
      title:'Plan for the migration window',
      summary:'The local historical phase is ' + phase.replaceAll('-', ' ') + '. Even favorable weather alone cannot establish that a migration wave is moving through now.' + upcoming,
      evidence, caveat
    };
  }
  if (model.score >= 65 && weatherScore >= 55) {
    return {
      tone:'promising', tag:'PROMISING MODELED WINDOW',
      title:'A reasonable day for a local monarch watch',
      summary:'The historical season and reported conditions align for watching. Try a sheltered native-flower patch or a known migration corridor; a short local watch is more defensible than a long trip based on this index alone.',
      evidence, caveat
    };
  }
  if (model.score >= 45) {
    return {
      tone:'mixed', tag:'MIXED CONDITIONS',
      title:'Scout a nearby nectar patch',
      summary:'Some migration ingredients align, but the modeled signal is mixed. A local walk may be worthwhile; check the sightings layer and weather before making a special drive.',
      evidence, caveat
    };
  }
  return {
    tone:'plan', tag:'LOW MODELED SIGNAL',
    title:'Consider another local watch window',
    summary:'Today’s combined timing, observation and flight-weather index is low. Monarchs may still be present; use this as a reason to temper expectations, not proof of absence.',
    evidence, caveat
  };
}

export function seasonChapter(key, data) {
  const west=data?.population === 'west';
  const t=data?.timing || {};
  const chapters={
    spring:west
      ? ['Spring dispersal','As winter colonies break up, western monarchs disperse into breeding landscapes. Weather and regional habitat matter; the eastern latitude-arrival curve does not apply.','Western timing varies by coastal and inland region.']
      : ['Northbound, a generation at a time','The monarchs moving north in spring are a relay of generations. Watch for first adults near fresh milkweed, then for eggs and caterpillars as breeding gets underway.',dateText(t.springArrival) ? 'Historical local spring arrival: about ' + dateText(t.springArrival) : 'Choose a location for a spring arrival baseline.'],
    summer:west
      ? ['Summer breeding and nectar','Western monarchs breed across a broad landscape. Seek regionally native milkweed for caterpillars and continuous native nectar for adults.','Habitat quality is more useful than a national peak date.']
      : ['A summer of new generations','Milkweed is the only larval host-plant group for monarchs. Adults also need successive nectar sources while summer generations build.', 'Breeding observations and migration records describe different behaviors.'],
    fall:west
      ? ['Western movement toward the coast','In the West, fall movement is not an east-of-Rockies latitude wave. Coastal arrivals and inland movement require locally dated monitoring.', 'California groves usually begin their viewing season in fall; check official reports.']
      : ['The long southbound flight','A long-lived migratory generation moves south, feeding on asters, goldenrod and other late flowers. Wind, fronts and shorelines can create brief concentrations.',dateText(t.fallPeakStart) && dateText(t.fallPeakEnd) ? 'Typical fall peak near you: ' + dateText(t.fallPeakStart) + '–' + dateText(t.fallPeakEnd) + ' (modeled, not a guaranteed arrival).' : 'Choose a location for the modeled fall window.'],
    winter:west
      ? ['Winter coastal groves','Many western monarchs cluster in protected California coastal groves during the winter. An official dated sanctuary count, not a map marker, is evidence of surveyed occupancy.','See the official monitoring panel below for dated counts and verification.']
      : ['A forest winter in Mexico','Most eastern monarchs spend winter clustered at high-elevation forest sites in central Mexico. Winter colony area surveys are population indicators, not today’s flyway map.', 'Eastern overwintering is not a live local-sighting forecast.']
  };
  const [title,story,local]=chapters[key] || chapters.fall;
  return {title,story,local};
}

export function habitatAdvice(type, data) {
  const phase=data?.model?.phase || '';
  const fall=phase==='fall-migration' || phase==='pre-migration' || phase==='western-migration';
  const tips={
    shoreline:fall
      ? 'Watch protected edges, sunny openings and points of land. Headwinds can delay a crossing; a passing front can change what you see. A known corridor is not a confirmed active roost.'
      : 'Use sunny, wind-sheltered shoreline wildflowers and trails. Avoid interpreting a historic migration hotspot as evidence of butterflies here today.',
    meadow:'Walk slowly along flowering edges during warm, calmer daylight. Look for adults feeding and distinguish single sightings from a sustained directional flight.',
    garden:fall
      ? 'Look for nectar visits on locally native late-season blooms. New milkweed planted today cannot refuel this year’s southbound migration.'
      : 'Check native milkweed leaves for eggs and caterpillars, and keep several kinds of native flowers blooming through the season.'
  };
  return tips[type] || tips.meadow;
}
