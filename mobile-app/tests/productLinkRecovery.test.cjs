const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const babel=require('../node_modules/@babel/core');
const core=require('../src/services/productLinksCore.cjs');
const transformed=babel.transformFileSync(require.resolve('../src/services/productLinks.js'),{babelrc:false,configFile:false,plugins:[require.resolve('../node_modules/@babel/plugin-transform-modules-commonjs')]}).code;
function app({os='android',direct=null,native={},choose='Paste & open',storage=new Map()}={}){
 let callback,reads=0,alerts=0;
 const exports={};
 const context={exports,require:name=>{
  if(name==='react-native')return {Platform:{OS:os},Linking:{getInitialURL:async()=>direct,addEventListener:(_,fn)=>{callback=fn;return{remove(){callback=null;}};}},Alert:{alert:(_,__,buttons)=>{alerts++;buttons?.find(b=>b.text===choose)?.onPress();}}};
  if(name==='@react-native-async-storage/async-storage')return {getItem:async k=>storage.get(k),setItem:async(k,v)=>storage.set(k,v)};
  if(name==='sawdagar-product-links')return {getInstallReferrer:async()=>{reads++;return 'sawdagar_product=1027';},...native};
  if(name==='./productLinksCore.cjs')return core;
  throw Error(name);
 }};
 vm.runInNewContext(transformed,context);
 return {api:exports,storage,event:url=>callback?.({url}),get reads(){return reads;},get alerts(){return alerts;}};
}
test('Android restores once and does not restore again on later launches',async()=>{
 const storage=new Map();const a=app({storage});
 assert.equal(await a.api.getInitialProductLink(),'sawdagar://products/1027');
 assert.equal(await a.api.getInitialProductLink(),'sawdagar://products/1027');assert.equal(a.reads,1);
 const b=app({storage});assert.equal(await b.api.getInitialProductLink(),null);assert.equal(b.reads,0);
});
test('explicit launch URL takes priority over installation history',async()=>{
 const a=app({direct:'https://sawdagar.com/share/products/1026'});
 assert.equal(await a.api.getInitialProductLink(),'sawdagar://products/1026');assert.equal(a.reads,0);
});
test('temporary Play failures permit retry on next app launch',async()=>{
 const storage=new Map();const a=app({storage,native:{getInstallReferrer:async()=>null}});
 assert.equal(await a.api.getInitialProductLink(),null);
 assert.equal(await app({storage}).api.getInitialProductLink(),'sawdagar://products/1027');
});
test('a newer incoming link wins over a delayed install referrer',async()=>{
 let finish;const a=app({native:{getInstallReferrer:()=>new Promise(r=>finish=r)}});const received=[];
 a.api.subscribeToProductLinks(url=>received.push(url));const pending=a.api.getInitialProductLink();
 await new Promise(r=>setImmediate(r));a.event('sawdagar://products/1026');finish('sawdagar_product=1027');
 assert.equal(await pending,null);assert.deepEqual(received,['sawdagar://products/1026']);
});
test('iOS decline never reads clipboard',async()=>{
 let reads=0;const a=app({os:'ios',choose:'Not now',native:{hasPasteCandidate:async()=>true,pasteProductLink:async()=>{reads++;}}});
 assert.equal(await a.api.getInitialProductLink(),null);assert.equal(reads,0);assert.equal(a.alerts,1);
});
test('iOS consent restores the copied product once',async()=>{
 const a=app({os:'ios',native:{hasPasteCandidate:async()=>true,pasteProductLink:async()=>`https://sawdagar.com/share/products/1027?sawdagar_install=${Date.now()}`}});
 assert.equal(await a.api.getInitialProductLink(),'sawdagar://products/1027');assert.equal(a.alerts,1);
});
