const BASE = '/national-tools/monarch-migration-live';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = { map:null, selected:null, recentVisible:true, timingVisible:true, lakeVisible:true, westVisible:true };

const FALL = [[49,'08-26'],[47,'09-01'],[45,'09-06'],[43,'09-11'],[41,'09-16'],[39,'09-22'],[37,'09-27'],[35,'10-02'],[33,'10-07'],[31,'10-12'],[29,'10-18'],[27,'10-23'],[25,'10-28'],[23,'11-04'],[21,'11-11'],[19.4,'11-18']];
const SPRING = [[49,'06-07'],[47,'05-30'],[45,'05-22'],[43,'05-14'],[41,'05-06'],[39,'04-28'],[37,'04-14'],[35,'04-02'],[33,'03-27'],[31,'03-22'],[29,'03-18'],[27,'03-15'],[25,'03-13']];
const GREAT_LAKES = [
  {name:'Peninsula Point, Michigan',lat:45.67,lng:-86.978,note:'Documented Great Lakes fall concentration / roost context.'},
  {name:'Lake Michigan shoreline corridor',lat:43.70,lng:-86.45,note:'Shoreline geography and weather can concentrate southbound migrants.'},
  {name:'South Bass Island, Ohio',lat:41.64,lng:-82.84,note:'Great Lakes crossing and roost context documented by observers.'}
];
const WESTERN = [
  {name:'Pacific Grove, California',lat:36.621,lng:-121.918},{name:'Pismo Beach, California',lat:35.121,lng:-120.626},{name:'Santa Cruz region, California',lat:36.974,lng:-122.03}
];

function api(path){ return `${BASE}${path}`; }
function fmtDate(iso){ if(!iso)return '—'; return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(iso)); }
function phaseText(v){ return String(v||'—').replaceAll('-',' '); }
function pulseWords(score){ if(score>=78)return 'Strong local migration signal'; if(score>=62)return 'Good movement signal'; if(score>=46)return 'Developing / mixed signal'; if(score>=28)return 'Light local signal'; return 'Little migration signal'; }
function flightWords(score){ if(score>=78)return 'Very favorable'; if(score>=62)return 'Favorable'; if(score>=45)return 'Mixed'; if(score>=28)return 'Poor'; return 'Very poor'; }
function safe(s){ return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

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
    map.addLayer({id:'west-circles',type:'circle',source:'west',paint:{'circle-radius':7,'circle-color':'#6d5b88','circle-stroke-color':'#fff','circle-stroke-width':2}});
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
  const html=`<div class="popup-type">${safe(p.kind||'CONTEXT')}</div><div class="popup-place">${safe(p.name||'Migration context')}</div><div class="popup-meta">${safe(p.note||'Known migration / overwintering context. Not a claim of live monarch presence.')}</div>`;
  new maplibregl.Popup({offset:10}).setLngLat(c).setHTML(html).addTo(state.map);
}

async function loadRecent(){
  try{
    const u=new URL(api('/api/sightings'),location.origin); Object.entries({days:14,limit:200,nelat:51,nelng:-65,swlat:24,swlng:-125}).forEach(([k,v])=>u.searchParams.set(k,v));
    const r=await fetch(u); const d=await r.json(); if(!r.ok)throw new Error();
    const features=(d.results||[]).map(x=>({type:'Feature',properties:{id:x.id,observedOn:x.observedOn,place:x.place||'',license:x.license,url:x.url},geometry:{type:'Point',coordinates:[x.lng,x.lat]}}));
    state.map?.getSource('recent')?.setData({type:'FeatureCollection',features});
    $('#mapCount').textContent=`${features.length.toLocaleString()} recent licensed records shown`;
    $('#mapLoading').style.display='none'; $('#freshnessTop').textContent=`Sightings fetched ${new Date(d.fetchedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`;
  }catch{$('#mapLoading').textContent='Recent sightings are temporarily unavailable. Timing and context layers remain available.';$('#freshnessTop').textContent='One live source degraded';}
}

function setLayer(name,visible){
  if(!state.map?.isStyleLoaded())return;
  const ids={recent:['recent-clusters','recent-cluster-count','recent-points'],timing:['timing-fill','timing-line'],greatlakes:['greatlakes-circles'],west:['west-circles']}[name]||[];
  ids.forEach(id=>state.map.getLayer(id)&&state.map.setLayoutProperty(id,'visibility',visible?'visible':'none'));
}

$$('.chip').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.layer;btn.classList.toggle('active');setLayer(name,btn.classList.contains('active'));}));

async function useLocation(lat,lng,label='Your location'){
  state.selected={lat,lng,label};
  $('#locationStatus').textContent=`Loading local migration intelligence for ${label}…`;
  $('#readoutPlace').textContent=label;
  if(state.map?.isStyleLoaded()){
    state.map.getSource('selected')?.setData(pointCollection([{lat,lng,name:label}],'Selected location'));
    state.map.flyTo({center:[lng,lat],zoom:6.2,essential:true});
  }
  const [contextResult,historyResult]=await Promise.allSettled([
    fetch(`${api('/api/context')}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);return d}),
    fetch(`${api('/api/history')}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=2.5`).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);return d})
  ]);
  if(contextResult.status==='fulfilled')renderContext(contextResult.value,label);else{$('#locationStatus').textContent='Local model could not load. The national map remains available.';}
  if(historyResult.status==='fulfilled')renderHistory(historyResult.value);else renderHistory({years:[]});
  try{localStorage.setItem('monarch-location',JSON.stringify({lat,lng,label}));}catch{}
}

function renderContext(d,label){
  const m=d.model||{}, obs=d.observationSummary||{}, w=d.weather||{};
  $('#pulseValue').textContent=m.score??'—';
  let pulseNote=pulseWords(m.score||0);
  try{
    const prior=JSON.parse(localStorage.getItem('monarch-last-readout')||'null');
    if(prior && Math.abs(prior.lat-d.location.lat)<0.08 && Math.abs(prior.lng-d.location.lng)<0.08 && Number.isFinite(prior.score)){
      const delta=(m.score??0)-prior.score;
      if(Math.abs(delta)>=2) pulseNote+=` · ${delta>0?'↑':'↓'} ${Math.abs(delta)} since last visit`;
      else pulseNote+=' · about steady since last visit';
    }
    localStorage.setItem('monarch-last-readout',JSON.stringify({lat:d.location.lat,lng:d.location.lng,score:m.score,at:d.generatedAt}));
  }catch{}
  $('#pulseWords').textContent=pulseNote;
  $('#phaseValue').textContent=phaseText(m.phase); $('#timingValue').textContent=`Fall peak: ${fmtDate(d.timing?.fallPeakStart)}–${fmtDate(d.timing?.fallPeakEnd)}`;
  $('#sightValue').textContent=obs.recent7dRecords==null?'—':`${obs.recent7dRecords} records`; $('#sightTrend').textContent=`7-day trend: ${m.observationTrend||'—'} · records ≠ butterfly count`;
  $('#flightValue').textContent=flightWords(m.components?.flightConditions||0); $('#weatherValue').textContent=w.temperatureF==null?'Weather source degraded':`${w.temperatureF}°F · ${w.windDirection||'—'} ${w.windSpeedMph||0} mph · ${w.shortForecast||''}`;
  $('#confidenceValue').textContent=m.confidence??'—'; $('#confidenceWords').textContent=(m.confidence>=75?'Good source coverage':m.confidence>=50?'Moderate source coverage':'Sparse or degraded data');
  $('#habitatAction').textContent=d.habitatAction||'Use locally native milkweed and nectar plants appropriate to your region.';
  const phase=phaseText(m.phase); const trend=m.observationTrend||'steady';
  let sentence=`At ${label}, the local signal is ${pulseWords(m.score||0).toLowerCase()}. `;
  if(m.phase==='fall-migration') sentence+=`You are inside the historical fall migration window, and recent observation reporting is ${trend}.`;
  else if(m.phase==='spring-arrival') sentence+=`You are near the historical spring arrival period; recent reports help tell whether this year's front is early or late.`;
  else if(m.phase==='pre-migration') sentence+=`The fall wave is approaching; the historical peak is ${fmtDate(d.timing?.fallPeakStart)}–${fmtDate(d.timing?.fallPeakEnd)}.`;
  else sentence+=`The current seasonal phase is ${phase}.`;
  $('#decisionSentence').textContent=sentence;
  $('#locationStatus').textContent=`${label} · ${d.population==='west'?'Western':'Eastern'} migration model · updated ${new Date(d.generatedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`;
  if(d.sourceState?.weather==='degraded'||d.sourceState?.observations==='degraded') $('#freshnessTop').textContent='Local readout has a degraded source';
  if(window.gtag)gtag('event','monarch_location_readout',{method:label==='Your location'?'device':'zip',population:d.population,phase:m.phase});
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
  try{const r=await fetch(`${api('/api/geocode')}?zip=${encodeURIComponent(zip)}`);const d=await r.json();if(!r.ok)throw new Error(d.error);await useLocation(d.lat,d.lng,d.name);}catch(err){$('#locationStatus').textContent=err.message||'ZIP lookup failed.';}
});

$$('.info').forEach(btn=>{btn.addEventListener('click',()=>alert(btn.dataset.tip));});

async function boot(){
  initBars(); await initMap();
  try{const saved=JSON.parse(localStorage.getItem('monarch-location')||'null');if(saved&&Number.isFinite(saved.lat)&&Number.isFinite(saved.lng))useLocation(saved.lat,saved.lng,saved.label||'Saved location');}catch{}
}
boot();
