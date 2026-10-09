import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
const parent=fs.readFileSync(path.join(root,'public/index.html'),'utf8');

test('map code parses and has a continental fit that includes western overwintering markers',()=>{
  assert.doesNotThrow(()=>new vm.Script(app));
  const bounds=app.match(/const CONTINENTAL_BOUNDS=(\[\[[^;]+\]);/);
  assert.ok(bounds,'continental map bounds missing');
  const [[west,south],[east,north]]=JSON.parse(bounds[1]);
  for(const [slug,lat,lng] of [['pacific-grove-ca',36.621,-121.918],['pismo-beach-ca',35.121,-120.626]]){
    assert.ok(lng>=west&&lng<=east&&lat>=south&&lat<=north,slug+' is outside default map bounds');
    assert.ok(app.includes("slug:'"+slug+"'"),slug+' missing map popup link');
  }
  assert.ok(app.includes('map.fitBounds(CONTINENTAL_BOUNDS'));
});

test('map selected location is restored after style load, not ignored',()=>{
  assert.match(app,/if\(!focusSelectedOnMap\(\{animate:false\}\)\)/);
  assert.match(app,/function focusSelectedOnMap/);
  assert.match(app,/focusSelectedOnMap\(\);/);
});

test('western observations receive their own licensed observation sample',()=>{
  assert.match(app,/label:'western'/);
  assert.match(app,/nelng:-105,swlat:24,swlng:-125/);
  assert.match(app,/const byId=new Map\(\)/);
  assert.match(app,/Promise\.allSettled\(requests\)/);
  assert.match(app,/not a complete count/);
});

test('user-facing map identifies western sites as context, not official counts',()=>{
  assert.match(parent,/Western winter sites/);
  assert.match(parent,/not live counts/);
  assert.match(parent,/eastern migration only/);
  assert.match(parent,/California sanctuary markers are locations/);
  assert.match(parent,/v=20261009-1/);
});
