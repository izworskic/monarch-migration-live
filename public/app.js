const BASE = '/national-tools/monarch-migration-live';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = { map:null, selected:null, recentVisible:true, timingVisible:true, lakeVisible:true, westVisible:true, westernMonitoring:new Map() };

const FALL = [[49,'08-26'],[47,'09-01'],[45,'09-06'],[43,'09-11'],[41,'09-16'],[39,'09-22'],[37,'09-27'],[35,'10-02'],[33,'10-07'],[31,'10-12'],[29,'10-18'],[27,'10-23'],[25,'10-28'],[23,'11-04'],[21,'11-11'],[19.4,'11-18']];
const SPRING = [[49,'06-07'],[47,'05-30'],[45,'05-22'],[43,'05-14'],[41,'05-06'],[39,'04-28'],[37,'04-14'],[35,'04-02'],[33,'03-27'],[31,'03-22'],[29,'03-18'],[27,'03-15'],[25,'03-13']];
const GREAT_LAKES = [
  {name:'Peninsula Point, Michigan',lat:45.67,lng:-86.978,note:'Documented Great Lakes fall concentration / roost context.'},
  {name:'Lake Michigan shoreline corridor',lat:43.70,lng:-86.45,note:'Shoreline geography and weather can concentrate southbound migrants.'},
  {name:'South Bass Island, Ohio',lat:41.64,lng:-82.84,note:'Great Lakes crossing and roost context documented by observers.'}
];
const WESTERN = [
  {name:'Pacific Grove, California',lat:36.621,lng:-121.918,slug:'pacific-grove-ca',note:'Historic winter monarch sanctuary. Marker is not a live count.'},
  {name:'Pismo Beach, California',lat:35.121,lng:-120.626,slug:'pismo-beach-ca',note:'Historic winter butterfly grove. Marker is not a live count.'},
  {name:'Santa Cruz region, California',lat:36.974,lng:-122.03,note:'Western overwintering region. Marker is not evidence of current occupancy.'}
];

function api(path){ return `${BASE}${path}`; }
function fmtDate(iso){ if(!iso)return '—'; return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(iso)); }
function phaseText(v){ return String(v||'—').replaceAll('-',' '); }
function pulseWords(score){ if(score>=78)return 'Strong local migration signal'; if(score>=62)return 'Good movement signal'; if(score>=46)return 'Developing / mixed signal'; if(score>=28)return 'Light local signal'; return 'Little migration signal'; }
function flightWords(score){ if(score>=78)return 'Very favorable'; if(score>=62)return 'Favorable'; if(score>=45)return 'Mixed'; if(score>=28)return 'Poor'; return 'Very poor'; }
function safe(s){ return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

async function readJsonResponse(response, label='Request'){
  const text=await response.text();
  let data=null;
  try{ data=text ? JSON.parse(text) : {}; }
  catch{
    const preview=text.trim().slice(0,120);
    throw new Error(`${label} returned a non-JSON server response${preview?`: ${preview}`:''}`);
  }
  if(!response.ok) throw new Error(data?.error || `${label} failed (${response.status})`);
  return data;
}

function initBars(){
  const vals=[2.48,6.05,2.83,2.10,2.84,2.21,.90,1.79,2.93], max=6.05;
  $('#eastBars').innerHTML=vals.map((v,i)=>`<i style="height:${Math.max(8,v/max*100)}%" title="${2017+i}: ${v} ha"></i>`).join('');
}

function timingLatitude(table, now=new Date()){
  const y=now.getUTCFullYear(); const t=Date.UTC(y,now.getUTCMonth(),now.getUTCDate(),12);
  const rows=table.map(([lat,md])=>{const [m,d]=md.split('-').map(Number);return {lat,t:Date.UTC(y,m-1,d,12)}});
  if(t<rows[0].t-18*864e5 || t>rows.at(-1).t+18*864e5)return null;
  for(let i=0;i<rows.length-1;i++){
    const a=rows[i],b=rows[i+1];
    if(t>=a.t && t<=b.t){const f=(t-a.t)/(b.t-a.t);return a.lat+(b.lat-a.lat)*f;}
  }
  return t<rows[0].t?rows[0].lat:rows.at(-1).lat;
}
function timingGeoJSON(){
  const m=new Date().getUTCMonth()+1;
  const table=(m>=8&&m<=11)?FALL:(m>=3&&m<=6)?SPRING:null;
  const center=table?timingLatitude(table):null;
  if(center==null)return {type:'FeatureCollection',features:[]};
  const half=(table===FALL?2.2:2.8);
  return {type:'FeatureCollection',features:[{type:'Feature',properties:{kind:table===FALL?'Fall migration timing band':'Spring arrival timing band'},geometry:{type:'Polygon',coordinates:[[[-105,center-half],[-65,center-half],[-65,center+half],[-105,center+half],[-105,center-half]]]}}]};
}

function pointCollection(rows, kind){return {type:'FeatureCollection',features:rows.map(r=>({type:'Feature',properties:{...r,kind},geometry:{type:'Point',coordinates:[r.lng,r.lat]}}))};}

// Keep Pacific Grove and Pismo Beach visible in the default continental view,
// including narrow mobile viewports. Location pages switch to their site after load.
const CONTINENTAL_BOUNDS=[[-124.8,24.0],[-66.5,49.8]];
function focusSelectedOnMap({animate=true}={}){
  const map=state.map, loc=state.selected;
  if(!map?.isStyleLoaded()||!loc||!map.getSource('selected'))return false;
  map.getSource('selected').setData(pointCollection([loc],'Selected location'));
  const target={center:[loc.lng,loc.lat],zoom:6.2,essential:animate};
  if(animate)map.flyTo(target);else map.jumpTo(target);
  return true;
}

async function initMap(){
  if(!window.maplibregl){$('#mapLoading').textContent='Map library failed to load.';return;}
  const map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/liberty',center:[-96.3,39.4],zoom:3.2,minZoom:2,maxZoom:14,attributionControl:true});
  state.map=map;
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
  map.on('load',async()=>{
    map.addSource('timing',{type:'geojson',data:timingGeoJSON()});
    map.addLayer({id:'timing-fill',type:'fill',source:'timing',paint:{'fill-color':'#e98029','fill-opacity':.15}});
    map.addLayer({id:'timing-line',type:'line',source:'timing',paint:{'line-color':'#c95818','line-width':2,'line-dasharray':[3,2]}});
    map.addSource('greatlakes',{type:'geojson',data:pointCollection(GREAT_LAKES,'Great Lakes context')});
    map.addLayer({id:'greatlakes-circles',type:'circle',source:'greatlakes',paint:{'circle-radius':7,'circle-color':'#3e7a8c','circle-stroke-color':'#fff','circle-stroke-width':2}});
    map.addSource('west',{type:'geojson',data:pointCollection(WESTERN,'Western overwintering context')});
    map.addLayer({id:'west-circles',type:'circle',source:'west',paint:{'circle-radius':8,'circle-color':'#6d5b88','circle-stroke-color':'#fff','circle-stroke-width':2}});
    map.addLayer({id:'west-labels',type:'symbol',source:'west',minzoom:2,layout:{'text-field':['coalesce',['get','name'],''],'text-size':11,'text-offset':[0,1.5],'text-anchor':'top','text-max-width':12,'text-optional':true},paint:{'text-color':'#342a52','text-halo-color':'#ffffff','text-halo-width':1.7}});
    map.addSource('recent',{type:'geojson',data:{type:'FeatureCollection',features:[]},cluster:true,clusterRadius:34,clusterMaxZoom:8});
    map.addLayer({id:'recent-clusters',type:'circle',source:'recent',filter:['has','point_count'],paint:{'circle-color':'#e66f1b','circle-radius':['step',['get','point_count'],14,20,20,75,27],'circle-opacity':.9,'circle-stroke-color':'#fff','circle-stroke-width':2}});
    map.addLayer({id:'recent-cluster-count',type:'symbol',source:'recent',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-size':11},paint:{'text-color':'#fff'}});
    map.addLayer({id:'recent-points',type:'circle',source:'recent',filter:['!',['has','point_count']],paint:{'circle-color':'#e66f1b','circle-radius':6,'circle-stroke-color':'#fff','circle-stroke-width':2}});
    map.addSource('selected',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    map.addLayer({id:'selected-point',type:'circle',source:'selected',paint:{'circle-radius':10,'circle-color':'#152d25','circle-stroke-color':'#f6b56b','circle-stroke-width':4}});

    map.on('click','recent-clusters',e=>{const f=map.queryRenderedFeatures(e.point,{layers:['recent-clusters']})[0];const id=f?.properties?.cluster_id;map.getSource('recent').getClusterExpansionZoom(id,(err,z)=>{if(!err)map.easeTo({center:f.geometry.coordinates,zoom:z})});});
    map.on('click','recent-points',e=>showPopup(e.features?.[0]));
    map.on('click','greatlakes-circles',e=>showContextPopup(e.features?.[0]));
    map.on('click','west-circles',e=>showContextPopup(e.features?.[0]));
    ['recent-clusters','recent-points','greatlakes-circles','west-circles'].forEach(id=>{map.on('mouseenter',id,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',id,()=>map.getCanvas().style.cursor='');});
    if(!focusSelectedOnMap({animate:false})){
      map.fitBounds(CONTINENTAL_BOUNDS,{padding:{top:30,bottom:42,left:30,right:30},duration:0,maxZoom:3.5});
    }
    await loadRecent();
  });
}

function showPopup(feature){
  if(!feature)return; const p=feature.properties||{}; const c=feature.geometry.coordinates;
  const html=`<div class="popup-type">OBSERVED</div><div class="popup-place">${safe(p.place||'Monarch observation')}</div><div class="popup-meta">Observed ${safe(p.observedOn||'date unavailable')} · ${safe(p.license||'licensed record')}</div><div class="popup-meta" style="margin-top:6px"><a href="${safe(p.url)}" target="_blank" rel="noopener">Open source record ↗</a></div>`;
  new maplibregl.Popup({offset:10}).setLngLat(c).setHTML(html).addTo(state.map);
}
function showContextPopup(feature){
  if(!feature)return; const p=feature.properties||{}; const c=feature.geometry.coordinates;
  const guide=p.slug?`<div class="popup-meta" style="margin-top:8px"><a href="${BASE}/${encodeURIComponent(p.slug)}">Open local viewing guide →</a></div>`:'';
  const site=p.slug?state.westernMonitoring.get(p.slug):null;
  const current=site?.current?.state==='DATED_COUNT'?`Official dated count: <strong>${Number(site.current.count).toLocaleString()} monarchs</strong> (${safe(displaySurveyDate(site.current.observedOn))})`:'No verified current-season count';
  const previous=site?.previousSurvey?`Last published 2025 mid-season survey: ${Number(site.previousSurvey.count).toLocaleString()} (not today). `:'';
  const detail=p.slug?`<div class="popup-meta" style="margin-top:7px">${current}. ${previous}</div>`:'';
  const html=`<div class="popup-type">${safe(p.kind||'CONTEXT')}</div><div class="popup-place">${safe(p.name||'Migration context')}</div><div class="popup-meta">${safe(p.note||'Known migration / overwintering context. Not a claim of live monarch presence.')}</div>${detail}${guide}`;
  new maplibregl.Popup({offset:10}).setLngLat(c).setHTML(html).addTo(state.map);
}

function displaySurveyDate(iso){
  if(!iso||!/\d{4}-\d\d-\d\d/.test(iso))return 'date unavailable';
  const d=new Date(iso+'T12:00:00Z');
  return Number.isNaN(d.getTime())?'date unavailable':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(d);
}
function westernReportText(site){
  const report=site.officialReport||{};
  if(site.sourceState==='UNAVAILABLE')return 'The museum report could not be retrieved at this check. The older published survey below is still available.';
  if(report.state==='STALE_NOT_STARTED_REPORT')return `Museum update ${displaySurveyDate(report.date)}: the season had not begun at that time. This report is older than two weeks, so it does not establish whether monarchs have arrived today.`;
  if(report.state==='NOT_STARTED_REPORTED')return `Museum update ${displaySurveyDate(report.date)}: the sanctuary season had not begun as of that report. Check again before visiting.`;
  if(report.state==='COUNT_REPORTED')return `Museum report date: ${displaySurveyDate(report.date)}. Counts describe a monitored survey, not a continuously live census.`;
  if(report.state==='SEASONAL_REFERENCE')return 'California State Parks publishes the November–February viewing season, but does not provide a verified current grove count in this feed.';
  return `Official report ${report.date?displaySurveyDate(report.date):'date unconfirmed'}: no current-season count has been verified.`;
}
function monitoringCard(site){
  const current=site.current||{},historical=site.previousSurvey||{};
  const hasCurrent=current.state==='DATED_COUNT'&&Number.isSafeInteger(current.count)&&current.observedOn;
  const status=hasCurrent?`Dated official count: ${Number(current.count).toLocaleString()} monarchs · ${displaySurveyDate(current.observedOn)}`:'Current-season count not verified';
  return `<article class="western-monitoring-card" data-site="${safe(site.id)}">
      <h4>${safe(site.name)}</h4>
      <span class="western-status ${hasCurrent?'western-count-reported':''}">${safe(status)}</span>
      <p>${safe(westernReportText(site))}</p>
      <p>Source: <a href="${safe(site.officialSource.url)}" rel="noopener" target="_blank">${safe(site.officialSource.name)} — latest monitoring</a>.</p>
      <p class="western-old-count"><strong>Previous-season reference:</strong> ${Number(historical.count).toLocaleString()} monarchs, ${safe(historical.survey)}, ${safe(historical.observedWindow)}, published ${safe(displaySurveyDate(historical.publishedOn))}. <a rel="noopener" target="_blank" href="${safe(historical.sourceUrl)}">${safe(historical.sourceName)} report</a>. <em>This is not the current count.</em></p>
    </article>`;
}
async function loadOfficialMonitoring(){
  const el=$('#westernMonitoringCards'),summary=$('#westernMonitoringStatus');
  if(!el||!summary)return;
  try{
    const r=await fetch(api('/api/overwintering'));
    const data=await readJsonResponse(r,'Official western sanctuary monitoring');
    if(!Array.isArray(data.sites)||data.sites.length!==2)throw Error('Monitoring source returned unexpected site coverage');
    state.westernMonitoring=new Map(data.sites.map(s=>[s.id,s]));
    el.innerHTML=data.sites.map(monitoringCard).join('');
    const pg=state.westernMonitoring.get('pacific-grove-ca');
    summary.textContent=pg?.sourceState==='FETCHED'
      ?'Pacific Grove Museum checked. Site reports and survey years are dated individually; counts are not continuously live.'
      :'Pacific Grove Museum temporarily unavailable; previously published Xerces survey data remains dated and distinct.';
  }catch{
    summary.textContent='Current official monitoring feed unavailable. Historical 2025 survey counts shown above are not current-season counts. Follow the official source links.';
  }
}

async function loadRecent(){
  // A single nationwide 200-record cap can hide California observations.
  // The separate western sample does not claim to be an exhaustive census.
  const queries=[
    {label:'national',bbox:{nelat:51,nelng:-65,swlat:24,swlng:-125}},
    {label:'western',bbox:{nelat:51,nelng:-105,swlat:24,swlng:-125}}
  ];
  const requests=queries.map(async sample=>{
    const u=new URL(api('/api/sightings'),location.origin);
    Object.entries({days:14,limit:200,...sample.bbox}).forEach(([k,v])=>u.searchParams.set(k,v));
    const r=await fetch(u);
    return readJsonResponse(r,'Sightings: '+sample.label);
  });
  const outcome=await Promise.allSettled(requests);
  const good=outcome.filter(x=>x.status==='fulfilled').map(x=>x.value);
  if(!good.length){
    $('#mapLoading').textContent='Recent sightings are temporarily unavailable. Timing and context layers remain available.';
    $('#freshnessTop').textContent='Observation source degraded';
    return;
  }
  const byId=new Map();
  for(const data of good)for(const row of data.results||[]){
    if(row.id!=null && Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng)))
      byId.set(String(row.id),row);
  }
  const features=[...byId.values()].map(x=>({
    type:'Feature',
    properties:{id:x.id,observedOn:x.observedOn,place:x.place||'',license:x.license,url:x.url},
    geometry:{type:'Point',coordinates:[x.lng,x.lat]}
  }));
  state.map?.getSource('recent')?.setData({type:'FeatureCollection',features});
  const degraded=good.length!==queries.length;
  $('#mapCount').textContent=`${features.length.toLocaleString()} sampled licensed sightings (national + western coverage); not a complete count`;
  $('#mapLoading').style.display='none';
  $('#freshnessTop').textContent=degraded?'Western or national observation sample unavailable':`Sightings fetched ${new Date(good[0].fetchedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`;
}

function setLayer(name,visible){
  if(!state.map?.isStyleLoaded())return;
  const ids={recent:['recent-clusters','recent-cluster-count','recent-points'],timing:['timing-fill','timing-line'],greatlakes:['greatlakes-circles'],west:['west-circles','west-labels']}[name]||[];
  ids.forEach(id=>state.map.getLayer(id)&&state.map.setLayoutProperty(id,'visibility',visible?'visible':'none'));
}

$$('.chip').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.layer;btn.classList.toggle('active');setLayer(name,btn.classList.contains('active'));}));

const DAY_MS=86400000;
function dateForLat(table, latitude, year){
  const lat=Math.max(table.at(-1)[0],Math.min(table[0][0],latitude));
  let hi=table[0],lo=table.at(-1);
  for(let i=0;i<table.length-1;i++){
    if(lat<=table[i][0]&&lat>=table[i+1][0]){hi=table[i];lo=table[i+1];break;}
  }
  const parse=([,md])=>{const [m,d]=md.split('-').map(Number);return Date.UTC(year,m-1,d,12)};
  const f=(hi[0]-lat)/Math.max(.001,hi[0]-lo[0]);
  return new Date(parse(hi)+(parse(lo)-parse(hi))*f);
}
function fallbackHabitat(phase){
  if(phase==='pre-arrival'||phase==='spring-arrival')return 'Prioritize native milkweed establishment and early-to-midseason nectar continuity before breeding activity builds.';
  if(phase==='breeding-season')return 'Keep native milkweed and pesticide-free nectar resources available; avoid cutting all milkweed at once.';
  if(phase==='pre-migration'||phase==='fall-migration')return 'Prioritize abundant late-blooming native nectar sources. Migrants need refueling habitat more than new milkweed establishment now.';
  return 'Plan next season’s native milkweed and nectar sequence using local frost and planting windows.';
}
function buildTimingFallback(lat,lng){
  const now=new Date(),year=now.getUTCFullYear(),t=now.getTime();
  const population=lng < -105?'west':'east';
  const coastal=population==='west'&&lng<=-119&&lat>=32&&lat<=41;
  const md=(now.getUTCMonth()+1)*100+now.getUTCDate();
  let phase='post-migration',timing={springArrival:null,fallPeakStart:null,fallPeakEnd:null};
  if(population==='west'){
    phase=coastal?(md>=1010&&md<=1114?'western-arrival':md>=1115||md<=215?'western-overwintering':md>=216&&md<=315?'western-departure':'western-summer')
      :md>=901&&md<=1115?'western-migration':'western-seasonal';
    timing={...timing,westernArrivalTypical:'Mid-October to mid-November',westernPeakTypical:'November through January'};
  }else{
    const spring=dateForLat(SPRING,lat,year),mid=dateForLat(FALL,lat,year);
    const leading=new Date(mid.getTime()-18*DAY_MS),peakStart=new Date(mid.getTime()-8*DAY_MS);
    const peakEnd=new Date(mid.getTime()+4*DAY_MS),trailing=new Date(mid.getTime()+18*DAY_MS);
    if(t<spring.getTime()-30*DAY_MS)phase='pre-arrival';
    else if(t<spring.getTime()+21*DAY_MS)phase='spring-arrival';
    else if(t<leading.getTime()-28*DAY_MS)phase='breeding-season';
    else if(t<leading.getTime())phase='pre-migration';
    else if(t<=trailing.getTime())phase='fall-migration';
    timing={springArrival:spring.toISOString(),fallLeadingEdge:leading.toISOString(),fallPeakStart:peakStart.toISOString(),fallMidpoint:mid.toISOString(),fallPeakEnd:peakEnd.toISOString(),fallTrailingEnd:trailing.toISOString()};
  }
  return {
    generatedAt:now.toISOString(),fallback:true,location:{lat,lng},population,
    sourceState:{weather:'degraded',observations:'degraded'},
    observationSummary:{recent7dRecords:null,previous7dRecords:null,unit:'unavailable',warning:'Live observation service unavailable.'},
    weather:{temperatureF:null,windSpeedMph:null,windDirection:null,windDirectionDeg:null,precipProbability:null,shortForecast:null,forecastTime:null},
    model:{score:null,confidence:null,phase,quality:'source-unavailable',
      scoreUnavailableReason:'Live context is unavailable; no numerical pulse or confidence score can be verified.',
      components:{liveObservations:null,historicalTiming:null,flightConditions:null,freshness:null},
      observationTrend:'unavailable',label:'Migration Pulse'},
    timing,habitatAction:fallbackHabitat(phase)
  };
}

async function useLocation(lat,lng,label='Your location'){
  state.selected={lat,lng,label};
  $('#locationStatus').textContent=`Loading local migration intelligence for ${label}…`;
  $('#readoutPlace').textContent=label;
  // If map style has not loaded, initMap() applies this selected location on load.
  focusSelectedOnMap();
  const [contextResult,historyResult]=await Promise.allSettled([
    fetch(`${api('/api/context')}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`).then(r=>readJsonResponse(r,'Local migration context')),
    fetch(`${api('/api/history')}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=2.5`).then(r=>readJsonResponse(r,'Historical context'))
  ]);
  if(contextResult.status==='fulfilled')renderContext(contextResult.value,label);else renderContext(buildTimingFallback(lat,lng),label);
  if(historyResult.status==='fulfilled')renderHistory(historyResult.value);else renderHistory({years:[]});
  try{localStorage.setItem('monarch-location',JSON.stringify({lat,lng,label}));}catch{}
}

function renderContext(d,label){
  const m=d.model||{},obs=d.observationSummary||{},w=d.weather||{};
  const west=d.population==='west',hasScore=Number.isFinite(m.score),hasConfidence=Number.isFinite(m.confidence);
  $('#pulseLabel').textContent=west?'Western migration':'Migration Pulse';
  $('#flightLabel').textContent=west?'Grove weather':'Flight conditions';
  $('#confidenceLabel').textContent=west?'Count verification':'Data coverage';
  $('#pulseValue').textContent=hasScore?m.score:'—';
  $('#pulseUnit').style.display=hasScore?'':'none';
  $('#confidenceUnit').style.display=hasConfidence?'':'none';
  $('#confidenceValue').textContent=hasConfidence?m.confidence:'—';
  let note=west?'No eastern-style score; check official counts':
    hasScore?pulseWords(m.score):'Score unavailable — live source incomplete';
  if(hasScore){
    try{
      const prior=JSON.parse(localStorage.getItem('monarch-last-readout')||'null');
      if(prior && Math.abs(prior.lat-d.location.lat)<0.08 && Math.abs(prior.lng-d.location.lng)<0.08 && Number.isFinite(prior.score)){
        const delta=m.score-prior.score;
        note+=Math.abs(delta)>=2?` · ${delta>0?'↑':'↓'} ${Math.abs(delta)} vs last visit`:' · approximately steady vs last visit';
      }
      localStorage.setItem('monarch-last-readout',JSON.stringify({lat:d.location.lat,lng:d.location.lng,score:m.score,at:d.generatedAt}));
    }catch{}
  }
  $('#pulseWords').textContent=note;
  $('#phaseValue').textContent=phaseText(m.phase);
  $('#timingValue').textContent=west?
    'Western winter sites: arrivals usually mid-Oct; peak Nov–Jan'
    :d.timing?.fallPeakStart&&d.timing?.fallPeakEnd?`Typical fall peak: ${fmtDate(d.timing.fallPeakStart)}–${fmtDate(d.timing.fallPeakEnd)}`:'Historical fall timing unavailable';
  $('#sightValue').textContent=Number.isFinite(obs.recent7dRecords)?`${obs.recent7dRecords} records`:'—';
  const trendMessages={
    'no-reports':'No sightings reported in either week; absence is not established',
    'new-reports':'Reports this week, none in prior week',
    'rising':'More observation records than prior week',
    'falling':'Fewer observation records than prior week',
    'steady':'Similar reporting to prior week',
    'unavailable':'Recent observations unavailable'
  };
  $('#sightTrend').textContent=`${trendMessages[m.observationTrend]||'Trend not established'} · ${west?'Not a sanctuary count':'~50 km search half-width'}`;
  if(west){
    $('#flightValue').textContent=w.temperatureF==null?'Unavailable':'Local forecast';
  }else{
    $('#flightValue').textContent=Number.isFinite(m.components?.flightConditions)?flightWords(m.components.flightConditions):'Unavailable';
  }
  $('#weatherValue').textContent=w.temperatureF==null?'Weather source unavailable':
    `${w.temperatureF}°F · ${w.windDirection||'wind unknown'} ${Number.isFinite(w.windSpeedMph)?w.windSpeedMph:'—'} mph · ${w.shortForecast||''}`;
  $('#confidenceWords').textContent=west?'On-site presence requires dated sanctuary monitoring':
    !hasConfidence?'Incomplete live-source coverage':
    m.confidence>=75?'Stronger observation coverage (heuristic)':m.confidence>=50?'Limited observation coverage (heuristic)':'Sparse reporting; not a statistical probability';
  $('#habitatAction').textContent=d.habitatAction||'Use native nectar and host plants suited to your location.';
  const phase=phaseText(m.phase);
  let sentence='';
  if(west){
    sentence=`${label} follows the western monarch seasonal cycle (${phase}), not the eastern north-to-south timing model. Local sightings and weather do not confirm that butterflies are inside an overwintering grove; check the dated official monitoring panel below.`;
  }else if(!hasScore){
    sentence=`The live migration score for ${label} is unavailable because an observation or weather source could not be verified. The ${phase} phase is historical context only—not evidence that butterflies are present today.`;
  }else{
    sentence=`At ${label}, the modeled eastern migration signal is ${pulseWords(m.score).toLowerCase()}. `;
    if(m.phase==='fall-migration')sentence+=`This is the historical fall migration window. ${trendMessages[m.observationTrend]||'Recent observations are uncertain'}.`;
    else if(m.phase==='spring-arrival')sentence+='This is near the typical spring arrival period; observation coverage may be sparse.';
    else if(m.phase==='pre-migration')sentence+=`The historical fall peak is ${fmtDate(d.timing?.fallPeakStart)}–${fmtDate(d.timing?.fallPeakEnd)}.`;
    else sentence+=`The seasonal phase is ${phase}. `;
    sentence+='Records are not counts of individual butterflies.';
  }
  $('#decisionSentence').textContent=sentence;
  $('#locationStatus').textContent=d.fallback?`${label} · historical context only · live feeds unavailable`:
    `${label} · ${west?'Western seasonal':'Eastern migration'} readout · checked ${new Date(d.generatedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`;
  if(d.fallback)$('#freshnessTop').textContent='Live local feeds unavailable; no migration score';
  else if(d.sourceState?.weather==='degraded'||d.sourceState?.observations==='degraded')$('#freshnessTop').textContent='Local readout has unavailable source(s)';
  if(window.gtag)gtag('event','monarch_location_readout',{method:label==='Your location'?'device':'location-page-or-zip',population:d.population,phase:m.phase,quality:m.quality||'unknown'});
}

function renderHistory(d){
  const el=$('#historyChart'), rows=(d.years||[]).filter(x=>x.records>0); if(!rows.length){el.innerHTML='<div class="empty-chart">Historical occurrence service is unavailable or no licensed records were returned for this area.</div>';return;}
  const max=Math.max(...rows.map(x=>x.records));
  el.innerHTML=rows.map(x=>`<div class="history-bar" style="height:${Math.max(7,(x.records/max)*170)}px" data-label="${x.year}: ${x.records.toLocaleString()} records" aria-label="${x.year}, ${x.records} records"></div>`).join('');
}

$('#geoButton').addEventListener('click',()=>{
  if(!navigator.geolocation){$('#locationStatus').textContent='This browser does not provide location. Enter a ZIP code instead.';return;}
  $('#locationStatus').textContent='Requesting your device location…';
  navigator.geolocation.getCurrentPosition(p=>useLocation(p.coords.latitude,p.coords.longitude,'Your location'),()=>{$('#locationStatus').textContent='Location was not shared. Enter a ZIP code instead.';},{enableHighAccuracy:false,timeout:9000,maximumAge:3600000});
});

$('#zipForm').addEventListener('submit',async e=>{
  e.preventDefault(); const zip=$('#zipInput').value.trim(); if(!/^\d{5}$/.test(zip)){$('#locationStatus').textContent='Enter a valid 5-digit ZIP code.';return;}
  $('#locationStatus').textContent='Looking up ZIP code…';
  try{
    let d;
    try{const r=await fetch(`${api('/api/geocode')}?zip=${encodeURIComponent(zip)}`);d=await readJsonResponse(r,'ZIP lookup');}
    catch{
      const r=await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
      const z=await readJsonResponse(r,'ZIP lookup'); const place=z.places?.[0];
      if(!place)throw new Error('ZIP code not found.');
      d={lat:Number(place.latitude),lng:Number(place.longitude),name:`${place['place name']}, ${place['state abbreviation']}`};
    }
    await useLocation(d.lat,d.lng,d.name);
  }catch(err){$('#locationStatus').textContent=err.message||'ZIP lookup failed.';}
});

$$('.info').forEach(btn=>{btn.addEventListener('click',()=>alert(btn.dataset.tip));});

async function boot(){
  initBars(); await initMap();
  loadOfficialMonitoring();
  try{const saved=JSON.parse(localStorage.getItem('monarch-location')||'null');if(saved&&Number.isFinite(saved.lat)&&Number.isFinite(saved.lng))useLocation(saved.lat,saved.lng,saved.label||'Saved location');}catch{}
}
boot();