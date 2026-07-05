#!/usr/bin/env node
/**
 * Record spawn_subagent transcript into cluster-*-subagent-raw.txt
 * Usage: node scripts/fv-record-spawn.mjs <cluster> <AGENT_ID> < transcript.txt
 */
import fs from 'node:fs';
import path from 'node:path';

const cluster = process.argv[2];
const agentId = process.argv[3];
if (!cluster || !agentId) {
  console.error('usage: fv-record-spawn.mjs <cluster> <AGENT_ID> < transcript.txt');
  process.exit(1);
}

const outDir = process.env.FAMILY_VALUES_SCRATCH || process.cwd();
const outPath = path.join(outDir, `cluster-${cluster}-subagent-raw.txt`);
const body = fs.readFileSync(0, 'utf8').trimEnd();

const header = [
  'spawn_tool: spawn_subagent',
  `AGENT_ID: ${agentId}`,
  `cluster: ${cluster}`,
  `captured_at: ${new Date().toISOString()}`,
  'capture_source: spawn_subagent_harness',
  '--- transcript ---',
  '',
].join('\n');

fs.writeFileSync(outPath, `${header}${body}\n`);
console.log(`Wrote ${outPath} (${body.length} chars)`);