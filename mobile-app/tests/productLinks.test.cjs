const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeProductLink,referrerProductLink,copiedProductLink}=require('../src/services/productLinksCore.cjs');
test('all public and custom scheme formats resolve to the same product',()=>{
 for(const prefix of ['https://sawdagar.com/','https://www.sawdagar.com/','https://sawdagar.com/share/','sawdagar://']){
   assert.equal(normalizeProductLink(prefix+'products/1027'),'sawdagar://products/1027');
 }
});
test('untrusted, malformed, or ambiguous URLs never navigate',()=>{
 for(const value of [null,42,'https://sawdagar.com.evil.com/products/1','https://evil.com/products/1','http://sawdagar.com/products/1','sawdagar://products/../1','sawdagar://products/%2f1','sawdagar://products/1/2','javascript:alert(1)']) assert.equal(normalizeProductLink(value),null);
});
test('Play referrer resolves product and rejects duplicates or bad encoding',()=>{
 assert.equal(referrerProductLink('utm_source=share&sawdagar_product=1027'),'sawdagar://products/1027');
 for(const value of ['utm_source=google-play','sawdagar_product=','sawdagar_product=%ZZ','sawdagar_product=1&sawdagar_product=2'])assert.equal(referrerProductLink(value),null);
});
test('iOS accepts only recent explicitly saved product links',()=>{
 const now=Date.now();const url='https://sawdagar.com/share/products/1027';
 assert.equal(copiedProductLink(url+'?sawdagar_install='+now,now),'sawdagar://products/1027');
 assert.equal(copiedProductLink(url,now),null);
 assert.equal(copiedProductLink(url+'?sawdagar_install='+(now-8*86400000),now),null);
 assert.equal(copiedProductLink(url+'?sawdagar_install='+(now+3600000),now),null);
});
