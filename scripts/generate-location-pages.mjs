import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const parentPath=path.join(root,'public/index.html');
const locations=[
  {slug:'chicago-il',name:'Chicago, Illinois',short:'Chicago',lat:41.8781,lng:-87.6298,title:'Monarch Migration Chicago Today | Live Timing & Sightings',description:'See whether monarch migration is active around Chicago today with recent sightings, local migration timing, NWS flight weather and historical observation context.',intro:'Chicago sits on Lake Michigan, where shoreline geography and passing weather can shape how southbound monarchs move and concentrate.',why:'This page runs the live Monarch Migration engine for Chicago, combining recent licensed observations, local seasonal timing, NWS flight conditions and historical occurrence context.'},
  {slug:'peninsula-point-mi',name:'Peninsula Point, Michigan',short:'Peninsula Point',lat:45.67,lng:-86.978,title:'Peninsula Point Monarch Migration Today | Live Timing',description:'Check monarch migration conditions at Peninsula Point, Michigan with recent sightings, local timing, flight weather and Great Lakes concentration context.',intro:'Peninsula Point is a documented Great Lakes fall concentration and roost context area where the Lake Michigan shoreline can funnel southbound monarch movement.',why:'The live readout is anchored to Peninsula Point rather than a statewide average, so weather, observations and historical timing reflect this Lake Michigan migration location.'},
  {slug:'south-bass-island-oh',name:'South Bass Island, Ohio',short:'South Bass Island',lat:41.64,lng:-82.84,title:'South Bass Island Monarch Migration Today | Live Timing',description:'Check monarch migration conditions around South Bass Island and Lake Erie with recent sightings, local timing, flight weather and Great Lakes crossing context.',intro:'South Bass Island sits in a Lake Erie crossing corridor where islands and shorelines can provide stopover and roost context during fall migration.',why:'The page anchors the same live national engine to South Bass Island so the local weather, observations and migration phase are specific to the Lake Erie setting.'},
  {slug:'cape-may-nj',name:'Cape May, New Jersey',short:'Cape May',lat:38.9351,lng:-74.9060,title:'Cape May Monarch Migration Today | Live Timing & Sightings',description:'See today’s monarch migration signal for Cape May with recent sightings, fall timing, flight weather and historical local observation context.',intro:'Cape May is one of North America’s best-studied Atlantic Coast monarch migration funnels, with a long-running fall monitoring program and weather-sensitive migration pulses.',why:'This page adds the live local layer: recent licensed observations, current flight weather and the modeled seasonal migration window for Cape May.'},
  {slug:'austin-tx',name:'Austin, Texas',short:'Austin',lat:30.2672,lng:-97.7431,title:'Monarch Migration Austin Today | Live Timing & Sightings',description:'Track monarch migration around Austin today with recent sightings, local spring and fall timing, NWS flight weather and historical observation context.',intro:'Central Texas lies inside the major monarch passage between northern breeding grounds and Mexico, with both spring recolonization and fall southbound movement.',why:'The Austin readout combines the current observation signal with local migration timing and flight weather instead of relying on a fixed statewide migration date.'},
  {slug:'san-antonio-tx',name:'San Antonio, Texas',short:'San Antonio',lat:29.4241,lng:-98.4936,title:'Monarch Migration San Antonio Today | Live Timing & Sightings',description:'Track monarch migration around San Antonio today with recent sightings, local migration timing, NWS flight weather and historical observation context.',intro:'San Antonio sits near an important Texas migration pathway between Mexico and the central United States, making timing and weather especially useful during spring and fall movement.',why:'The local page runs the national engine at San Antonio’s coordinates so recent observations and flight conditions can show whether the seasonal wave is actually active now.'},
  {slug:'pacific-grove-ca',name:'Pacific Grove, California',short:'Pacific Grove',lat:36.621,lng:-121.918,title:'Pacific Grove Monarch Butterflies Today | Live Conditions & Timing',description:'Check monarch butterfly conditions around Pacific Grove with recent sightings, local weather, seasonal timing and western overwintering context.',intro:'Pacific Grove is one of California’s best-known publicly accessible western monarch overwintering destinations, with monarchs historically returning in autumn and winter.',why:'This page does not claim a sanctuary count. It uses the live Monarch Migration engine to show nearby licensed observations, local weather, seasonal context and historical occurrence records.'},
  {slug:'pismo-beach-ca',name:'Pismo Beach, California',short:'Pismo Beach',lat:35.121,lng:-120.626,title:'Pismo Beach Monarch Butterflies Today | Live Conditions & Timing',description:'Check monarch butterfly conditions near Pismo Beach with recent sightings, local weather, seasonal timing and western overwintering context.',intro:'Pismo State Beach is a major publicly accessible western monarch overwintering site, where sheltered coastal microclimate and seasonal arrival determine the viewing experience.',why:'The live page complements official grove counts rather than replacing them, showing nearby licensed observations, current weather, seasonal context and historical occurrence records.'}
];

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=v=>JSON.stringify(v).replace(/</g,'\\u003c');
let source=fs.readFileSync(parentPath,'utf8');
source=source.replace(/\n?<section[^>]*data-location-directory[\s\S]*?<\/section>\n?/i,'\n');
if(!source.includes('<title>')||!source.includes('rel="canonical"')||!source.includes('id="main"')) throw new Error('Monarch parent SEO shell not found');

for(const loc of locations){
  const canonical=`https://chrisizworski.com/national-tools/monarch-migration-live/${loc.slug}`;
  const faq=[
    {q:`Are monarchs migrating through ${loc.short} today?`,a:`The live readout combines recent licensed monarch observations near ${loc.short}, the historical seasonal migration window and current flight weather. The Migration Pulse is a planning index, not a butterfly count.`},
    {q:`When is monarch migration strongest around ${loc.short}?`,a:'Migration timing varies by latitude, season and weather. This page shows the local historical timing window and updates the decision with current observations and National Weather Service conditions.'},
    {q:`Are the sightings on this page a monarch population count?`,a:'No. Recent sightings are licensed community-science occurrence records. Observation effort varies, so records are kept separate from the modeled Migration Pulse and from formal population surveys.'}
  ];
  let h=source;
  h=h.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(loc.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i,`<meta name="description" content="${esc(loc.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i,`<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i,`<meta property="og:title" content="${esc(loc.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i,`<meta property="og:description" content="${esc(loc.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/i,`<meta property="og:url" content="${canonical}" />`)
    .replace(/<h1>MONARCH<br><span>MIGRATION LIVE<\/span><\/h1>/i,`<h1>MONARCHS IN<br><span>${esc(loc.short.toUpperCase())}</span></h1>`);
  if(!/meta name="robots"/i.test(h)) h=h.replace('</head>','  <meta name="robots" content="index,follow,max-image-preview:large" />\n</head>');
  const schema={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':`${canonical}#page`,url:canonical,name:loc.title,description:loc.description,isPartOf:{'@id':'https://chrisizworski.com/national-tools/monarch-migration-live#app'}},
    {'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:[
      {'@type':'ListItem',position:1,name:'U.S. Outdoor Tools',item:'https://chrisizworski.com/national-tools/'},
      {'@type':'ListItem',position:2,name:'Monarch Migration Live',item:'https://chrisizworski.com/national-tools/monarch-migration-live'},
      {'@type':'ListItem',position:3,name:loc.name,item:canonical}
    ]},
    {'@type':'FAQPage','@id':`${canonical}#faq`,mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))}
  ]};
  h=h.replace('</head>',`  <script type="application/ld+json" data-location-seo>${json(schema)}</script>\n</head>`);
  const siblings=locations.filter(x=>x.slug!==loc.slug).slice(0,6).map(x=>`<a href="/national-tools/monarch-migration-live/${x.slug}">${esc(x.short)}</a>`).join(' · ');
  const panel=`\n  <section class="section-pad" data-seo-location="${esc(loc.slug)}"><div class="story-card" style="max-width:1180px;margin:0 auto"><span class="kicker">LOCAL MIGRATION DECISION</span><h2>${esc(loc.name)} monarch migration</h2><p>${esc(loc.intro)}</p><p>${esc(loc.why)}</p><p class="fine">Nearby migration pages: ${siblings}</p><p><a class="text-link" href="/national-tools/monarch-migration-live">Check another location →</a></p></div></section>\n`;
  h=h.replace(/(<section class="decision-strip")/i,`${panel}$1`);
  const preset=`<script data-location-preset>try{localStorage.setItem('monarch-location',JSON.stringify(${json({lat:loc.lat,lng:loc.lng,label:loc.name})}))}catch{}</script>\n`;
  h=h.replace('<script type="module" src="/national-tools/monarch-migration-live/app.js',`${preset}<script type="module" src="/national-tools/monarch-migration-live/app.js`);
  const out=path.join(root,`public/${loc.slug}/index.html`);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,h);
  const built=fs.readFileSync(out,'utf8');
  for(const needle of[canonical,`data-seo-location="${loc.slug}"`,'data-location-preset','FAQPage',loc.name]) if(!built.includes(needle)) throw new Error(`Monarch SEO build failed for ${loc.slug}: ${needle}`);
  if(/<meta name="robots"[^>]*noindex/i.test(built)) throw new Error(`Monarch child became noindex: ${loc.slug}`);
}

const directory=`\n  <section class="section-pad" data-location-directory><div class="section-heading"><div><span class="kicker">LOCAL MONARCH PAGES</span><h2>Monarch migration by location</h2><p>Open a location with its local migration timing, recent observations, flight weather and historical context already selected.</p></div></div><div class="education-grid">${locations.map(loc=>`<article><span>LIVE</span><h3><a href="/national-tools/monarch-migration-live/${loc.slug}">${esc(loc.name)}</a></h3><p>${esc(loc.description)}</p></article>`).join('')}</div></section>\n`;
fs.writeFileSync(parentPath,source.replace('</main>',`${directory}</main>`));
const urls=['https://chrisizworski.com/national-tools/monarch-migration-live',...locations.map(x=>`https://chrisizworski.com/national-tools/monarch-migration-live/${x.slug}`)];
fs.writeFileSync(path.join(root,'public/sitemap-locations.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u}</loc><changefreq>daily</changefreq></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated and verified ${locations.length} Monarch location pages.`);
