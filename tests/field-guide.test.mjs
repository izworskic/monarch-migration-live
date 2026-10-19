import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessMonarchOuting, seasonChapter, habitatAdvice} from '../public/field-guide-logic.js';

const east={
  population:'east',
  timing:{fallPeakStart:'2026-09-09T12:00:00Z',fallPeakEnd:'2026-09-22T12:00:00Z',springArrival:'2026-05-10T12:00:00Z'},
  model:{score:78,phase:'fall-migration',components:{flightConditions:75}},
  observationSummary:{recent7dRecords:12},
  weather:{temperatureF:69,windSpeedMph:10,shortForecast:'Sunny'}
};
test('promising window is a modeled field watch, never a monarch count',()=>{
  const result=assessMonarchOuting(east);
  assert.equal(result.tone,'promising');
  assert.match(result.tag,/MODELED/);
  assert.match(result.caveat,/not an arrival prediction/i);
  assert.match(result.evidence[1].value,/12 licensed observation records/);
});
test('lost live coverage never gets a go verdict',()=>{
  const result=assessMonarchOuting({...east,model:{...east.model,score:null}});
  assert.equal(result.tone,'unknown');
  assert.match(result.summary,/incomplete/);
});
test('outside migration season cannot get a good-day recommendation from high score',()=>{
  const result=assessMonarchOuting({...east,model:{...east.model,phase:'post-migration'}});
  assert.equal(result.tone,'plan');
});
test('western California cannot inherit eastern migration pulse',()=>{
  const west={...east,population:'west',model:{...east.model,phase:'western-arrival'}};
  const result=assessMonarchOuting(west);
  assert.equal(result.tone,'western');
  assert.match(result.summary,/official counts/i);
  assert.doesNotMatch(seasonChapter('fall',west).local,/Sep 9/);
});
test('site tips are seasonal, practical, and do not claim a current roost',()=>{
  assert.match(habitatAdvice('shoreline',east),/not a confirmed active roost/i);
  assert.match(habitatAdvice('garden',{...east,model:{...east.model,phase:'breeding-season'}}),/milkweed/);
  assert.match(seasonChapter('fall',east).local,/Sep 9/);
});
test('field guide is accessible and wired into existing readout',()=>{
  const html=fs.readFileSync('public/index.html','utf8');
  const app=fs.readFileSync('public/app.js','utf8');
  const ui=fs.readFileSync('public/field-guide.js','utf8');
  const css=fs.readFileSync('public/styles.css','utf8');
  assert.match(html,/id="monarchFieldGuide"/);
  assert.match(html,/role="tablist"/);
  assert.match(html,/id="fieldPlanCaveat"/);
  assert.match(html,/field-guide\.js\?v=/);
  assert.match(app,/new CustomEvent\('monarch:context'/);
  assert.match(ui,/addEventListener\('monarch:context'/);
  assert.match(css,/\.field-layout/);
  for(const file of [html,ui])assert.doesNotMatch(file,/data:image\/svg\+xml/);
});
