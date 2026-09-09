import test from 'node:test';
import assert from 'node:assert/strict';
import { isCommerciallyReusableLicense, normalizeINatLicense } from '../lib/licenses.js';

test('commercially reusable licenses pass',()=>{
  for(const l of ['cc0','cc-by','CC0_1_0','CC_BY_4_0']) assert.equal(isCommerciallyReusableLicense(l),true);
});

test('noncommercial and unknown licenses fail',()=>{
  for(const l of ['cc-by-nc','CC_BY_NC_4_0','all-rights-reserved','']) assert.equal(isCommerciallyReusableLicense(l),false);
});

test('iNaturalist license normalization',()=>assert.equal(normalizeINatLicense('CC_BY'),'cc-by'));
