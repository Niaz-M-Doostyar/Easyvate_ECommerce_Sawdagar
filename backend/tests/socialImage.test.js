const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const sharp = require('sharp');
let root, server, base;
before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'sawdagar-social-test-'));
  process.env.UPLOADS_DIR = root;
  const foreground = await sharp({create:{width:200,height:100,channels:4,background:'#16804c'}}).png().toBuffer();
  await sharp({create:{width:400,height:200,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:foreground,left:100,top:50}]).png().toFile(path.join(root,'transparent.png'));
  await sharp(crypto.randomBytes(1200 * 630 * 3),{raw:{width:1200,height:630,channels:3}})
    .png().toFile(path.join(root,'noise.png'));
  const app = express(); app.use('/image',require('../routes/image'));
  server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  base = `http://127.0.0.1:${server.address().port}/image`;
});
after(async () => {
  if (server) await new Promise(resolve=>server.close(resolve));
  if (root) await fs.rm(root,{recursive:true,force:true});
});
const url = (src, params={}) => `${base}?${new URLSearchParams({src,...params})}`;
test('social preview is an opaque JPEG with full product and white padding',async()=>{
  const response = await fetch(url('/uploads/transparent.png',{fit:'social',f:'webp',w:'80'}));
  assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),'image/jpeg');
  const buffer = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(buffer).metadata();
  assert.equal(metadata.width,1200); assert.equal(metadata.height,630); assert.equal(metadata.hasAlpha,false);
  const {data,info} = await sharp(buffer).raw().toBuffer({resolveWithObject:true});
  assert.ok(data[0]>245 && data[1]>245 && data[2]>245,'transparent background becomes white');
  const center = (315 * info.width + 600) * info.channels;
  assert.ok(data[center+1]>data[center] && data[center+1]>data[center+2],'product remains visible');
  const cached = await fetch(url('/uploads/transparent.png',{fit:'social'}),{headers:{'If-None-Match':response.headers.get('etag')}});
  assert.equal(cached.status,304); assert.equal(cached.headers.get('etag'),response.headers.get('etag'));
});
test('high-detail previews stay under the payload limit',async()=>{
  const response = await fetch(url('/uploads/noise.png',{fit:'social'}));
  assert.equal(response.status,200);
  assert.ok((await response.arrayBuffer()).byteLength<=280000);
});
test('ordinary image variants remain separate and unsafe sources are rejected',async()=>{
  const normal = await fetch(url('/uploads/transparent.png',{w:'80'}));
  assert.equal(normal.headers.get('content-type'),'image/webp');
  assert.equal((await sharp(Buffer.from(await normal.arrayBuffer())).metadata()).width,80);
  assert.equal((await fetch(url('/uploads/../secret',{fit:'social'}))).status,400);
});
