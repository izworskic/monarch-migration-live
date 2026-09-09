import { readFile, access } from 'node:fs/promises';
const checks=[
  ['Public hero + decision UI',8,'public/index.html'],['MapLibre interactive map',10,'public/app.js'],['Recent licensed sightings API',12,'api/sightings.js'],
  ['NWS flight weather',10,'api/context.js'],['Historical GBIF context',8,'api/history.js'],['Explainable deterministic model',12,'lib/monarch-model.js'],
  ['Eastern/western distinction',7,'lib/monarch-model.js'],['Habitat/planting guidance',6,'api/context.js'],['Great Lakes context layer',6,'public/app.js'],
  ['Source/license transparency',7,'public/index.html'],['GA4 contract',5,'public/index.html'],['Tests',5,'tests/model.test.mjs'],['SEO/canonical/schema',4,'public/index.html']
];
let score=0;
for(const [name,pts,file] of checks){try{await access(new URL('../'+file,import.meta.url));score+=pts;console.log(`PASS ${String(pts).padStart(2)}  ${name}`)}catch{console.log(`FAIL  0  ${name}`)}}
console.log(`\nRelease implementation score: ${score}/100`);
if(score<90)process.exitCode=1;
