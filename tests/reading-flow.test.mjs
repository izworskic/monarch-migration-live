import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('public/index.html','utf8');
const css=fs.readFileSync('public/styles.css','utf8');

test('main Monarch experience reads as one fieldbook with three compact chapters',()=>{
  assert.match(html,/<article class="monarch-fieldbook"/);
  assert.equal((html.match(/class="fieldbook-chapter fieldbook-/g)||[]).length,3);
  for(const chapter of ['fieldbook-watch','fieldbook-story','fieldbook-evidence']){
    assert.ok(html.includes(chapter),chapter+' missing');
  }
  const locations=[
    ['monarchFieldGuide','fieldbook-watch'],['class="map-section"','fieldbook-watch'],
    ['class="story-grid section-pad"','fieldbook-story'],['class="education section-pad"','fieldbook-story'],
    ['class="history-section section-pad"','fieldbook-evidence'],
    ['class="history-local section-pad"','fieldbook-evidence'],
    ['class="explain-section section-pad"','fieldbook-evidence'],
    ['class="sources section-pad"','fieldbook-evidence']
  ];
  const indices=locations.map(([match])=>html.indexOf(match));
  for(let i=0;i<indices.length;i++)assert.ok(indices[i]>=0&&(!i||indices[i]>indices[i-1]),'Fieldbook content order changed');
  const w=html.indexOf('fieldbook-watch'),st=html.indexOf('fieldbook-story'),ev=html.indexOf('fieldbook-evidence');
  assert.ok(w<indices[0]&&indices[1]<st&&st<indices[2]&&indices[3]<ev&&ev<indices[4]);
  assert.doesNotMatch(html,/<section class="(?:map-section|story-grid section-pad|education section-pad|history-section section-pad|history-local section-pad|explain-section section-pad|sources section-pad)"/);
});
test('interactive IDs, map, photos, and source modules remain in the reading flow',()=>{
  for(const id of ['geoButton','zipForm','pulseValue','monarchFieldGuide','fieldCopy','fieldSeasonPanel','fieldSiteAdvice','map','westernMonitoringCards','historyChart']){
    assert.ok(html.includes('id="'+id+'"'),id+' missing');
  }
  assert.match(html,/commons\.wikimedia\.org\/wiki\/File:Monarch_butterfly_on_goldenrod/);
  assert.match(css,/\.monarch-fieldbook/);
  assert.match(css,/\.monarch-fieldbook>\.fieldbook-chapter\+\.fieldbook-chapter/);
});
test('only structural layout changed; shared app assets remain version-aligned',()=>{
  const version=html.match(/styles\.css\?v=(\d{8}-\d+)/)?.[1];
  assert.ok(version,'Stylesheet version not found');
  for(const name of ['app.js','field-guide.js'])assert.ok(html.includes(name+'?v='+version));
  assert.match(html,/rel="canonical" href="https:\/\/chrisizworski\.com\/national-tools\/monarch-migration-live"/);
});
