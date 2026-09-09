import test from 'node:test';
import assert from 'node:assert/strict';
import { fallPeakForLatitude, springArrivalForLatitude, southwardTailwindMph, migrationPulse, seasonPhase } from '../lib/monarch-model.js';

test('45N fall midpoint is September 6',()=>{
  assert.equal(fallPeakForLatitude(45,2026).midpoint.toISOString().slice(0,10),'2026-09-06');
});

test('43N spring arrival baseline is May 14',()=>{
  assert.equal(springArrivalForLatitude(43,2026).toISOString().slice(0,10),'2026-05-14');
});

test('north wind produces positive southward tailwind',()=>{
  assert.ok(southwardTailwindMph(12,0)>11.9);
  assert.ok(southwardTailwindMph(12,180)<-11.9);
});

test('Michigan-like latitude is in fall migration on Sep 9',()=>{
  assert.equal(seasonPhase(43.6,new Date('2026-09-09T12:00:00Z')),'fall-migration');
});

test('better fall observations and weather increase pulse',()=>{
  const date=new Date('2026-09-09T12:00:00Z');
  const low=migrationPulse({latitude:43.6,date,recentSightings:1,previousSightings:5,temperatureF:51,windSpeedMph:12,windDirectionDeg:180,precipProbability:80,population:'east'});
  const high=migrationPulse({latitude:43.6,date,recentSightings:40,previousSightings:12,temperatureF:72,windSpeedMph:12,windDirectionDeg:0,precipProbability:5,population:'east'});
  assert.ok(high.score>low.score,`${high.score} should exceed ${low.score}`);
});

test('western model reports lower confidence than east with same sparse inputs',()=>{
  const args={latitude:39,date:new Date('2026-09-22T12:00:00Z'),recentSightings:1,previousSightings:1,temperatureF:70,windSpeedMph:5,windDirectionDeg:0,precipProbability:0};
  assert.ok(migrationPulse({...args,population:'west'}).confidence < migrationPulse({...args,population:'east'}).confidence);
});
