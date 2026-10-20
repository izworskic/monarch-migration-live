import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('public/index.html','utf8');

test('million impressions intent-first Monarch metadata is concise, aligned, and indexable',()=>{
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
 assert.equal(title,'Monarch Migration Map Today: Recent Sightings & Timing');
 assert.ok(title.length>=25&&title.length<=65);
 assert.match(html,new RegExp('<meta property="og:title" content="'+title+'"'));
 assert.match(html,new RegExp('<meta name="twitter:title" content="'+title+'"'));
 assert.match(html,/<meta name="description" content="[^"]+"/);
 assert.match(html,/<link rel="canonical" href="https:\/\/chrisizworski\.com\/national-tools\/monarch-migration-live"/);
 assert.doesNotMatch(html,/<meta name="robots"[^>]*noindex/);
});

test('canonical creator Person ID is connected to the app and visibly attributed',()=>{
 const raw=html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1];
 assert.ok(raw,'Missing JSON-LD');
 const app=JSON.parse(raw);
 assert.equal(app['@type'],'WebApplication');
 assert.equal(app.author['@id'],'https://chrisizworski.com/#person');
 assert.equal(app.publisher['@id'],'https://chrisizworski.com/#person');
 assert.equal(app.author.url,'https://chrisizworski.com/chris-izworski/');
 assert.match(html,/<a href="https:\/\/chrisizworski\.com\/chris-izworski\/" rel="author">Built by Chris Izworski<\/a>/);
});

test('identity cleanup does not touch the ad loader or core tool UX',()=>{
 for(const id of ['monarchFieldGuide','map','geoButton','zipForm'])assert.ok(html.includes('id="'+id+'"'),id+' lost');
 assert.match(html,/class="monarch-fieldbook"/);
 assert.match(html,/src="\/national-tools\/monarch-migration-live\/app\.js\?v=/);
});
