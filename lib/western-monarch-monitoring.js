// Published site monitoring only. A historical survey is NEVER a current sanctuary count.
// All rights remain with the original monitoring organizations. No photos or full reports are republished.
export const XERCES_REPORT='https://www.xerces.org/press/western-monarch-numbers-remain-at-historic-low';
export const PACIFIC_GROVE_REPORT='https://www.pgmuseum.org/monarchs';
export const PISMO_GUIDE='https://www.parks.ca.gov/?page_id=30273';
const DAY=86400000;
const BASE_SITES=[
  {
    id:'pacific-grove-ca',name:'Pacific Grove Monarch Sanctuary',lat:36.621,lng:-121.918,
    officialSource:{name:'Pacific Grove Museum of Natural History',url:PACIFIC_GROVE_REPORT},
    visitorSource:{name:'Pacific Grove Museum of Natural History',url:PACIFIC_GROVE_REPORT},
    usualSeason:'Mid-October through February; peak November–January',
    previousSurvey:{count:188,season:'2025–26',survey:'Western Monarch Count — 2025 mid-season',observedWindow:'Late November–early December 2025',publishedOn:'2026-01-29',sourceName:'Xerces Society',sourceUrl:XERCES_REPORT}
  },
  {
    id:'pismo-beach-ca',name:'Pismo State Beach Monarch Butterfly Grove',lat:35.121,lng:-120.626,
    officialSource:{name:'California State Parks',url:PISMO_GUIDE},
    visitorSource:{name:'California State Parks',url:PISMO_GUIDE},
    usualSeason:'November through February',
    previousSurvey:{count:471,season:'2025–26',survey:'Western Monarch Count — 2025 mid-season',observedWindow:'Late November–early December 2025',publishedOn:'2026-01-29',sourceName:'Xerces Society',sourceUrl:XERCES_REPORT}
  }
];

function cleanHtml(html){
  return String(html||'')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)))
    .replace(/&(?:nbsp|#xA0);/gi,' ')
    .replace(/&amp;/gi,'&').replace(/&rsquo;|&#8217;/gi,'’')
    .replace(/\s+/g,' ').trim();
}
function parseReportDate(raw,now){
  if(!raw)return null;
  const m=String(raw).match(/(?:last\s+updated|updated\s+on|as\s+of)\s*:?[\s]*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
  if(!m)return null;
  const year=Number(m[3])<100?2000+Number(m[3]):Number(m[3]);
  const month=Number(m[1]),day=Number(m[2]);
  const iso=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const t=Date.parse(iso+'T12:00:00Z');
  if(!Number.isFinite(t)||new Date(t).getUTCDate()!==day||new Date(t).getUTCMonth()+1!==month||t>now.getTime()+DAY)return null;
  return iso;
}
function ageDays(date,now){
  return date?Math.max(0,Math.floor((now.getTime()-Date.parse(date+'T12:00:00Z'))/DAY)):null;
}
// Trust only a count with an explicit CURRENT/LATEST dated label in the sanctuary status area.
// Historical numbers elsewhere in a museum page must never be promoted to live counts.
function extractPublishedCurrentCount(text){
  const prefix=text.split(/(?:About the Sanctuary|Where Can I See Monarchs\?)/i)[0].slice(0,3800);
  const matches=[
    ...prefix.matchAll(/(?:current|latest|weekly)\s+(?:monarch\s+)?count\s*:?\s*([\d,]{1,9})\b/gi),
    ...prefix.matchAll(/(?:counted\s+this\s+week|this\s+week\s+we\s+counted)\s*:?\s*([\d,]{1,9})\s+monarchs?\b/gi)
  ].map(m=>Number(m[1].replaceAll(',',''))).filter(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000);
  return matches.length===1?matches[0]:null;
}
export function parsePacificGroveMuseum(html,{now=new Date()}={}){
  const text=cleanHtml(html);
  const reportDate=parseReportDate(text,now);
  const age=ageDays(reportDate,now);
  const publishedCount=extractPublishedCurrentCount(text);
  const current=(publishedCount!==null && reportDate && age<=10)
    ? {state:'DATED_COUNT',count:publishedCount,observedOn:reportDate,message:'Dated count published by Pacific Grove Museum.'}
    : {state:'NO_CURRENT_COUNT',count:null,observedOn:null,message:'No fresh, explicitly dated sanctuary count could be verified.'};
  let reportStatus='UNVERIFIED',note='Check the museum’s official page for the latest status.';
  const reportedNotArrived=/monarchs?\s+have\s+not\s+yet\s+arrived\s+in\s+Pacific\s+Grove/i.test(text)
    ||/monarch\s+season\s+has\s+not\s+yet\s+begun/i.test(text);
  if(reportDate && reportedNotArrived){
    reportStatus=age<=14?'NOT_STARTED_REPORTED':'STALE_NOT_STARTED_REPORT';
    note=age<=14?'Museum reports monarch season has not yet begun.':'Museum reported season not begun on its older dated update; current arrival status is not confirmed.';
  }else if(current.state==='DATED_COUNT'){
    reportStatus='COUNT_REPORTED';
    note='Museum has published a dated sanctuary count; this is not a real-time census.';
  }else if(reportDate){
    reportStatus='DATED_REPORT_NO_COUNT';
    note='The museum has a dated update, but no fresh explicit sanctuary count was validated.';
  }
  return {reportDate,ageDays:age,reportStatus,reportNote:note,current};
}
export function siteMonitoringData({museumHtml=null,museumError=false,now=new Date()}={}){
  const museum=museumHtml?parsePacificGroveMuseum(museumHtml,{now}):null;
  return {
    generatedAt:now.toISOString(),
    meaning:'Official published site monitoring is distinct from regional iNaturalist observations and modeled migration activity.',
    sites:BASE_SITES.map(site=>{
      const pacific=site.id==='pacific-grove-ca';
      return {
        ...site,
        sourceState:pacific?(museum?'FETCHED':'UNAVAILABLE'):'REFERENCE_ONLY',
        current:pacific&&museum?museum.current:{state:'NO_CURRENT_COUNT',count:null,observedOn:null,message:'No verified current-season sanctuary count is available from this official source.'},
        officialReport:pacific&&museum?{date:museum.reportDate,ageDays:museum.ageDays,state:museum.reportStatus,note:museum.reportNote}:{date:null,ageDays:null,state:'SEASONAL_REFERENCE',note:'California State Parks describes the usual overwintering season, not a current butterfly count.'},
        sourceWarning:pacific&&museumError?'Museum page could not be fetched; historical survey retained with its original date.':null
      };
    })
  };
}
export async function retrieveMonitoring({fetcher=fetch,now=new Date()}={}){
  let html=null,error=false;
  try{
    const signal=AbortSignal.timeout(7000);
    const r=await fetcher(PACIFIC_GROVE_REPORT,{signal,headers:{'Accept':'text/html','User-Agent':'MonarchMigrationLive/1.0 (public monitoring; chrisizworski.com)'}});
    if(!r.ok)throw new Error('Museum report response not OK');
    const t=await r.text();
    if(t.length>1500000||t.length<100)throw new Error('Museum report unexpected size');
    html=t;
  }catch{error=true;}
  return siteMonitoringData({museumHtml:html,museumError:error,now});
}
