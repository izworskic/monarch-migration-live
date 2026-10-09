import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePacificGroveMuseum,retrieveMonitoring,siteMonitoringData} from '../lib/western-monarch-monitoring.js';

const NOW=new Date('2026-10-09T23:00:00Z');
const OLD='<html><body><h1>Visit Monarchs at the Monarch Sanctuary</h1><h3>Monarch season has not yet begun. Peak season is November - January.</h3><p>Monarchs have not yet arrived in Pacific Grove.</p><p>Last updated 9/19/26</p><h2>About the Sanctuary</h2>Historical high of 7,604 monarchs.</body></html>';
test('stale museum status is not misrepresented as evidence of no arrivals today',()=>{
 const p=parsePacificGroveMuseum(OLD,{now:NOW});
 assert.equal(p.reportStatus,'STALE_NOT_STARTED_REPORT');
 assert.equal(p.reportDate,'2026-09-19');
 assert.equal(p.current.count,null);
});
test('verified official counts require an explicit count label and fresh dated report',()=>{
 const html='<h3>Latest monarch count: 1,234</h3><p>Last updated 10/8/26</p><h2>About the Sanctuary</h2> 7,600 previously recorded.';
 const p=parsePacificGroveMuseum(html,{now:NOW});
 assert.equal(p.current.state,'DATED_COUNT');
 assert.equal(p.current.count,1234);
 assert.equal(p.current.observedOn,'2026-10-08');
});
test('undated count, multiple contradictory counts and historical numbers are never treated as live',()=>{
 const cases=[
  '<h3>Latest monarch count: 50</h3><p>No date</p>',
  '<h3>Latest monarch count: 50</h3><p>Latest monarch count: 70</p>Last updated 10/8/26',
  '<p>In 2023 about 6508 monarchs were counted.</p>Last updated 10/8/26'
 ];
 for(const html of cases)assert.equal(parsePacificGroveMuseum(html,{now:NOW}).current.count,null);
});
test('last season Xerces counts are preserved as historical, never presented as current',()=>{
 const {sites}=siteMonitoringData({museumHtml:OLD,now:NOW});
 assert.equal(sites.length,2);
 const pg=sites.find(x=>x.id==='pacific-grove-ca'),pismo=sites.find(x=>x.id==='pismo-beach-ca');
 assert.equal(pg.previousSurvey.count,188);
 assert.equal(pismo.previousSurvey.count,471);
 assert.equal(pg.previousSurvey.season,'2025–26');
 assert.equal(pismo.current.count,null);
 assert.equal(pismo.officialReport.state,'SEASONAL_REFERENCE');
});
test('failed official source returns intact historical records with degraded status',async()=>{
 const data=await retrieveMonitoring({now:NOW,fetcher:async()=>{throw Error('offline')}});
 assert.equal(data.sites.find(x=>x.id==='pacific-grove-ca').sourceState,'UNAVAILABLE');
 assert.equal(data.sites.find(x=>x.id==='pacific-grove-ca').current.count,null);
 assert.equal(data.sites.find(x=>x.id==='pismo-beach-ca').previousSurvey.count,471);
});
