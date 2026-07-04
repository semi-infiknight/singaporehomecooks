#!/usr/bin/env node
/**
 * Analyze PNG screenshots: dimensions, content bbox, corner samples, sha256.
 * Usage: node scripts/analyze-png-pixels.mjs <png> [png...]
 * Env PIXEL_ANALYSIS_OUT=path writes JSON file.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function parsePng(path) {
  const abs = resolve(path);
  const buf = readFileSync(abs);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`Not PNG: ${path}`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  const sha256 = createHash('sha256').update(buf).digest('hex');

  let bbox = null;
  let samples = {};
  try {
    const { PNG } = await import('pngjs');
    const png = PNG.sync.read(buf);
    const { width: w, height: h, data } = png;
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    const threshold = 250;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (w * y + x) << 2;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 10 && (r < threshold || g < threshold || b < threshold)) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX >= minX && maxY >= minY) {
      bbox = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }
    const corner = (cx, cy) => {
      const i = (w * cy + cx) << 2;
      return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
    };
    samples = {
      topLeft: corner(0, 0),
      topRight: corner(w - 1, 0),
      bottomLeft: corner(0, h - 1),
      bottomRight: corner(w - 1, h - 1),
      center: corner(Math.floor(w / 2), Math.floor(h / 2)),
    };
    return { path: abs, width: w, height: h, bitDepth, colorType, sha256, bbox, samples, bytes: buf.length };
  } catch (e) {
    return {
      path: abs,
      width,
      height,
      bitDepth,
      colorType,
      sha256,
      bbox: null,
      samples,
      bytes: buf.length,
      note: `decode skipped: ${e.message}`,
    };
  }
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node analyze-png-pixels.mjs <png>...');
  process.exit(1);
}

const results = [];
for (const f of files) {
  results.push(await parsePng(f));
}

const json = JSON.stringify({ analyzedAt: new Date().toISOString(), images: results }, null, 2);
const out = process.env.PIXEL_ANALYSIS_OUT;
if (out) writeFileSync(out, json);
console.log(json);