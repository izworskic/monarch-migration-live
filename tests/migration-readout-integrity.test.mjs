import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { migrationPulse, seasonPhase, formatLocalWindow } from '../lib/monarch-model.js';

const oct9=new Date('2026-10-09T20:00:00Z');
const midOct=new Date('2026-10-23T20:00:00Z');
const jan=new Date('2027-01-10T20:00:00Z');
const base={latitude:43.6,longitude:-83.9,date:oct9,temperatureF:68,
  windSpeedMph:8,windDirectionDeg:0,precipProbability:10,recentSightings:10,previousSightings:8};

test('Michigan eastern migration keeps a usable numeric index when both live sources are available',()=>{
 const result=migrationPulse({...base,population:'east'});
 assert.equal(result.quality,'complete');
 assert.ok(Number.isFinite(result.score));
 assert.ok(result.score>=0&&result.score<=100);
 assert.ok(Number.isFinite(result.confidence));
});

test('Pacific Grove and Pismo Beach do not inherit fake eastern autumn peak timing',()=>{
 for(const [latitude,longitude] of [[36.621,-121.918],[35.121,-120.626]]){
   const result=migrationPulse({...base,latitude,longitude,date:midOct,population:'west'});
   const time=formatLocalWindow(latitude,midOct,'west');
   assert.equal(result.phase,'western-arrival');
   assert.equal(result.quality,'western-reference-only');
   assert.equal(result.score,null);
   assert.equal(result.confidence,null);
   assert.equal(time.fallPeakStart,null);
   assert.equal(time.fallMidpoint,null);
   assert.match(time.westernPeakTypical,/November/);
 }
});

test('western coastal winter is overwintering in January, and flight weather is not a migration pulse',()=>{
 const r=migrationPulse({...base,latitude:36.621,longitude:-121.918,date:jan,population:'west'});
 assert.equal(r.phase,'western-overwintering');
 assert.equal(r.score,null);
 assert.equal(r.components.flightConditions,null);
});

test('western inland late September is a different cycle from coastal sanctuary aggregation',()=>{
 const inland=seasonPhase(41,new Date('2026-09-20T20:00:00Z'),'west',-113);
 assert.equal(inland,'western-migration');
});

test('0/0 observation periods are no reports, not falling or proof of absence',()=>{
 const r=migrationPulse({...base,recentSightings:0,previousSightings:0});
 assert.equal(r.observationTrend,'no-reports');
 assert.ok(Number.isFinite(r.score));
});
test('0 previous sightings but new reports yields new-reports rather than artificial rising ratio',()=>{
 const r=migrationPulse({...base,recentSightings:1,previousSightings:0});
 assert.equal(r.observationTrend,'new-reports');
});
test('a failed iNaturalist source never becomes zero reports or a numerical score',()=>{
 const r=migrationPulse({...base,recentSightings:null,previousSightings:null,observationsAvailable:false});
 assert.equal(r.score,null);
 assert.equal(r.confidence,null);
 assert.equal(r.observationTrend,'unavailable');
 assert.equal(r.components.liveObservations,null);
 assert.equal(r.quality,'source-unavailable');
});
test('a failed weather source never becomes 50/100 flight conditions or a numerical pulse',()=>{
 const r=migrationPulse({...base,temperatureF:null,windSpeedMph:null,weatherAvailable:false});
 assert.equal(r.score,null);
 assert.equal(r.components.flightConditions,null);
 assert.equal(r.confidence,null);
});
test('the two weekly observation windows must not share an endpoint date',()=>{
 const source=fs.readFileSync('api/context.js','utf8');
 assert.match(source,/daysAgo\(6\),today/);
 assert.match(source,/daysAgo\(13\),daysAgo\(7\)/);
 assert.doesNotMatch(source,/const radius = 1\.75;/);
 assert.match(source,/const radius = 50 \/ 111\.2;/);
 assert.match(source,/searchHalfWidthKm: 50/);
});
test('client readout supports unavailable scores and avoids synthetic numeric fallback',()=>{
 const app=fs.readFileSync('public/app.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 assert.doesNotThrow(()=>new vm.Script(app));
 assert.match(app,/model:\{score:null,confidence:null/);
 assert.match(app,/score unavailable — live source incomplete/i);
 assert.match(app,/No eastern-style score/);
 assert.match(app,/Number\.isFinite\(m\.components\?\.flightConditions\)/);
 for(const id of ['pulseLabel','flightLabel','confidenceLabel','pulseUnit','confidenceUnit']){
   assert.ok(html.includes('id="'+id+'"'),'Missing dynamic UI label '+id);
 }
});
