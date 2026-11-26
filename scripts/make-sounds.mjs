// Makes public/audio/*.mp3 (except melody.mp3, which is the button's file as it is) from the CC0 sources in CREDITS.md.
// Not part of the build. To run it again: download the sources into <dl> (dl/fs/dice.mp3, marimba.mp3, campfire.mp3 =
// the Freesound HQ previews; dl/x-casino-audio, dl/x-interface-sounds = the Kenney packs, unzipped), then
//   npm i --no-save @wasm-audio-decoders/ogg-vorbis mpg123-decoder lamejs@1.2.1
//   node scripts/make-sounds.mjs <dl> public/audio
import { readFileSync } from 'node:fs';
import { OggVorbisDecoder } from '@wasm-audio-decoders/ogg-vorbis';
import { MPEGDecoder } from 'mpg123-decoder';

async function decode(path) {
  const buf = readFileSync(path);
  const d = path.endsWith('.mp3') ? new MPEGDecoder() : new OggVorbisDecoder();
  await d.ready;
  const r = path.endsWith('.mp3') ? d.decode(new Uint8Array(buf)) : await d.decodeFile(new Uint8Array(buf));
  d.free();
  const ch = r.channelData, n = ch[0].length, mono = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (const c of ch) s += c[i]; mono[i] = s / ch.length; }
  return { mono, sr: r.sampleRate };
}
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.MPEGMode = require('lamejs/src/js/MPEGMode.js'); globalThis.Lame = require('lamejs/src/js/Lame.js'); globalThis.BitStream = require('lamejs/src/js/BitStream.js');
const lamejs = require('lamejs');

const [dl, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

function cut(x, sr, from, to) { return x.slice(Math.round(from * sr), Math.round(to * sr)); }
function fade(x, sr, inS, outS) {
  const a = Math.round(inS * sr), b = Math.round(outS * sr), n = x.length;
  for (let i = 0; i < a && i < n; i++) x[i] *= i / a;
  for (let i = 0; i < b && i < n; i++) x[n - 1 - i] *= Math.sin((Math.PI / 2) * (i / b)); // equal-power tail
  return x;
}
/** seamless loop: the last `xs` seconds are cross-faded into the start, and then dropped */
function loop(x, sr, xs) {
  const c = Math.round(xs * sr), n = x.length - c, y = x.slice(0, n);
  for (let i = 0; i < c; i++) { const t = i / c; y[i] = x[i] * Math.sin((Math.PI / 2) * t) + x[n + i] * Math.cos((Math.PI / 2) * t); }
  return y;
}
function normalize(x, db = -1) {
  let p = 0; for (const v of x) p = Math.max(p, Math.abs(v));
  const g = Math.pow(10, db / 20) / (p || 1); for (let i = 0; i < x.length; i++) x[i] *= g; return x;
}
function encode(x, sr, kbps = 64) {
  const enc = new lamejs.Mp3Encoder(1, sr, kbps);
  const pcm = new Int16Array(x.length);
  for (let i = 0; i < x.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767)));
  const chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) { const b = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (b.length) chunks.push(Buffer.from(b)); }
  const e = enc.flush(); if (e.length) chunks.push(Buffer.from(e));
  return Buffer.concat(chunks);
}

const jobs = [
  // file, source, from, to, fadeIn, fadeOut, loopCrossfade
  ['dice.mp3', `${dl}/fs/dice.mp3`, 0.2, 1.34, 0.005, 0.25],
  ['paper.mp3', `${dl}/x-casino-audio/Audio/card-slide-3.ogg`, 0.0, 0.3, 0.003, 0.1],
  ['wood.mp3', `${dl}/fs/marimba.mp3`, 0.0, 0.4, 0.002, 0.15],
  ['pop.mp3', `${dl}/x-interface-sounds/Audio/drop_003.ogg`, 0.0, 0.19, 0.002, 0.05],
  ['fire.mp3', `${dl}/fs/campfire.mp3`, 5.0, 18.0, 0, 0, 1.0],
];
for (const [name, src, from, to, fi, fo, xf] of jobs) {
  const { mono, sr } = await decode(src);
  let x = cut(mono, sr, from, to);
  x = xf ? loop(x, sr, xf) : fade(x, sr, fi, fo);
  normalize(x);
  const mp3 = encode(x, sr);
  writeFileSync(`${out}/${name}`, mp3);
  console.log(name, `${(x.length / sr).toFixed(2)}s`, sr, `${(mp3.length / 1024).toFixed(1)} KB`);
}
