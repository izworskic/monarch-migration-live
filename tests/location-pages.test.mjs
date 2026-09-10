import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const slugs=['chicago-il','peninsula-point-mi','south-bass-island-oh','cape-may-nj','austin-tx','san-antonio-tx','pacific-grove-ca','pismo-beach-ca'];

test('Monarch location pages are generated with unique indexable local bindings',()=>{
  for(const slug of slugs){
    const file=path.join(root,'public',slug,'index.html');
    assert.ok(fs.existsSync(file),`missing ${slug}`);
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,new RegExp(`https://chrisizworski\\.com/national-tools/monarch-migration-live/${slug}`));
    assert.match(html,new RegExp(`data-seo-location="${slug}"`));
    assert.match(html,/data-location-preset/);
    assert.match(html,/FAQPage/);
    assert.doesNotMatch((html.match(/<meta name="robots"[^>]*>/i)||[''])[0],/noindex/i);
  }
});

test('Monarch parent links to every admitted local page and publishes location sitemap',()=>{
  const parent=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
  assert.match(parent,/data-location-directory/);
  for(const slug of slugs) assert.ok(parent.includes(`/national-tools/monarch-migration-live/${slug}`),`parent missing ${slug}`);
  const sitemap=fs.readFileSync(path.join(root,'public','sitemap-locations.xml'),'utf8');
  for(const slug of slugs) assert.ok(sitemap.includes(`/national-tools/monarch-migration-live/${slug}`),`sitemap missing ${slug}`);
});
