const probes=[
  ['NWS','https://api.weather.gov/points/43.6,-84.7'],
  ['iNaturalist','https://api.inaturalist.org/v1/observations?taxon_id=48662&per_page=1&license=cc0,cc-by'],
  ['GBIF','https://api.gbif.org/v1/species/match?name=Danaus%20plexippus']
];
for(const [name,url] of probes){
  try{const r=await fetch(url,{headers:{'User-Agent':'MonarchMigrationLive/0.1 (chrisizworski.com)'}});console.log(`${r.ok?'PASS':'FAIL'} ${name} ${r.status}`)}catch(e){console.log(`FAIL ${name} ${e.message}`)}
}
