const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { shareDocument, productImage } = require('../src/lib/productShare.cjs');
const product = { id: '1027', nameEn: '</script><script>alert(1)</script>', images: [{ url: 'http://localhost:4000/uploads/phone.jpg' }] };
function browser(userAgent, options = {}) {
  const nodes = {open:{addEventListener:(_,fn)=>{nodes.openClick=fn;}}, android:{href:'play'}, ios:{href:'apple'}, 'install-help':{}, 'copy-error':{hidden:true}, 'copy-install':{hidden:true,addEventListener:(_,fn)=>{nodes.click=fn;}}};
  let destination, copied, timer;
  const listeners = {};
  const document = {hidden:false,getElementById:id=>nodes[id],addEventListener:(name,fn)=>{listeners[name]=fn;}};
  const script = shareDocument(product).match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, {
    navigator:{userAgent,platform:'',maxTouchPoints:0,clipboard:{writeText:async value=>{if(options.failCopy)throw Error('denied');copied=value;}}},
    document,
    window:{location:{replace:url=>{destination=url;},assign:url=>{destination=url;}},addEventListener:(name,fn)=>{listeners[name]=fn;}},
    setTimeout:fn=>{timer=fn;return 1;}, clearTimeout:()=>{timer=undefined;},
  });
  return {nodes, document, listeners, runTimer(){if(timer)timer();}, get destination(){return destination;},get copied(){return copied;}};
}
test('preview escapes content and uses a publicly fetchable image', () => {
  assert.equal(productImage(product), 'https://sawdagar.com/uploads/phone.jpg');
  const html = shareDocument(product);
  assert.ok(html.includes('property="og:image" content="https://sawdagar.com/uploads/phone.jpg"'));
  assert.ok(!html.includes(product.nameEn));
  assert.ok(html.includes('sawdagar://products/1027'));
  assert.ok(html.includes('referrer=sawdagar_product%3D1027'));
  new vm.Script(shareDocument({...product,id:"a'b"}).match(/<script>([\s\S]*?)<\/script>/)[1]);
});
test('Android store redirect preserves referrer and app intent has fallback', () => {
  const b=browser('Android');
  assert.ok(b.destination.startsWith('intent://products/1027#Intent'));
  assert.ok(b.nodes.open.href.includes('intent://products/1027#Intent'));
  assert.ok(b.nodes.open.href.includes('S.browser_fallback_url=play'));
});
test('iOS copies only after consent, then opens the store', async () => {
  const b=browser('iPhone WhatsApp');
  assert.equal(b.destination,'sawdagar://products/1027');
  assert.equal(b.copied,undefined);
  assert.equal(b.nodes['copy-install'].hidden,false);
  await b.nodes.click();
  assert.match(b.copied,/^https:\/\/sawdagar.com\/share\/products\/1027\?sawdagar_install=\d{13}$/);
  assert.equal(b.destination,'apple');
});
test('iOS stays on the install preview in Safari until the user chooses an action',()=>{
  const b=browser('iPhone Safari'); b.runTimer(); assert.equal(b.destination,undefined);
  b.nodes.openClick({preventDefault(){}}); assert.equal(b.destination,'sawdagar://products/1027');
});
test('iOS in-app browsers attempt the app once without automatic store fallback',()=>{
  const b=browser('iPhone WhatsApp'); b.runTimer();
  assert.equal(b.destination,'sawdagar://products/1027');
});
test('clipboard failure stays on the page with a recovery instruction',async()=>{
  const b=browser('iPhone WhatsApp',{failCopy:true}); await b.nodes.click();
  assert.equal(b.destination,'sawdagar://products/1027');assert.equal(b.nodes['copy-error'].hidden,false);
});
test('desktop crawlers and browsers get preview without redirects',()=>{
  assert.equal(browser('Desktop').destination,undefined);
  assert.equal(browser('facebookexternalhit/1.1').destination,undefined);
});
