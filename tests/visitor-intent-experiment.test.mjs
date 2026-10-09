import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const variants={
  'pacific-grove-ca':{phrase:'Are monarch butterflies at Pacific Grove right now?',url:'https://www.pgmuseum.org/monarchs',season:'mid-October'},
  'pismo-beach-ca':{phrase:'Are monarchs at Pismo Beach Butterfly Grove yet?',url:'https://parks.ca.gov/?page_id=30273',season:'November through February'},
  'cape-may-nj':{phrase:'Are monarch butterflies migrating through Cape May now?',url:'https://njaudubon.org/monarch-monitoring/',season:'September and October'}
};
const controls=['chicago-il','peninsula-point-mi','south-bass-island-oh','austin-tx','san-antonio-tx'];

test('pilot destination pages show unique evidence-backed visitor guidance',()=>{
 for(const [slug,expected] of Object.entries(variants)){
  const html=fs.readFileSync(path.join(root,'public',slug,'index.html'),'utf8');
  assert.match(html,/data-monarch-experiment="visitor-intent-v1"/);
  assert.match(html,/data-monarch-visitor-cta="official-status"/);
  assert.ok(html.includes(expected.phrase));
  assert.ok(html.includes(expected.url.replaceAll('&','&amp;')));
  assert.ok(html.includes(expected.season));
  assert.match(html,/It is not an official sanctuary count or a guarantee/);
  assert.match(html,/data-monarch-visitor-analytics/);
  assert.match(html,/monarch_visitor_guide_cta/);
  assert.match(html,/name="description"/);
  assert.match(html,new RegExp('<link rel="canonical" href="https://chrisizworski\\.com/national-tools/monarch-migration-live/'+slug+'"'));
 }
});

test('five location controls preserve baseline template and contain no pilot treatment',()=>{
 for(const slug of controls){
  const html=fs.readFileSync(path.join(root,'public',slug,'index.html'),'utf8');
  assert.doesNotMatch(html,/data-monarch-experiment="visitor-intent-v1"/);
  assert.doesNotMatch(html,/monarch_visitor_guide_cta/);
  assert.match(html,/data-seo-location/);
 }
});

test('pilot protects model uncertainty and does not pretend observation counts equal sanctuary counts',()=>{
 for(const slug of Object.keys(variants)){
  const html=fs.readFileSync(path.join(root,'public',slug,'index.html'),'utf8');
  assert.match(html,/Evidence boundary:/);
  assert.match(html,/Migration Pulse/);
  assert.match(html,/not an official sanctuary count/);
 }
});
