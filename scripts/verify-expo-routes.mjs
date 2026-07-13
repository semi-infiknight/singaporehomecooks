#!/usr/bin/env node
/**
 * Fail CI / verify when Expo Router (or Next app) has route-killing layouts:
 *
 * 1. Same segment as BOTH a file and a directory
 *    e.g. orders.tsx + orders/   → unmatched / wrong screen (bit us twice on cook)
 * 2. Empty route directories (git doesn't track them; still break Metro locally)
 *
 *   pnpm verify:expo-routes
 *
 * Agent rule: after any mobile route add/move, run this before claiming "fixed".
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const ROOTS = [
  "apps/mobile-cook/app",
  "apps/mobile-customer/app",
  // Next also uses file-based routes; same class of bug is possible under app/
  "apps/web/app",
];

const EXT = /\.(tsx|ts|jsx|js)$/;

function walkDirs(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const ent of entries) {
    if (ent.name.startsWith(".") || ent.name === "node_modules") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      acc.push(p);
      walkDirs(p, acc);
    }
  }
  return acc;
}

function listChildren(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !e.name.startsWith("."));
  } catch {
    return [];
  }
}

const conflicts = [];
const emptyDirs = [];

for (const rel of ROOTS) {
  const root = path.join(ROOT, rel);
  if (!fs.existsSync(root)) continue;

  const dirs = [root, ...walkDirs(root)];
  for (const dir of dirs) {
    const kids = listChildren(dir);
    const fileStems = new Set();
    const dirNames = new Set();

    for (const k of kids) {
      if (k.isDirectory()) {
        dirNames.add(k.name);
        const sub = path.join(dir, k.name);
        const subKids = listChildren(sub);
        if (subKids.length === 0) {
          emptyDirs.push(path.relative(ROOT, sub));
        }
      } else if (EXT.test(k.name)) {
        // ignore _layout, _route, etc. only for stem conflict with dirs
        const stem = k.name.replace(EXT, "");
        if (stem.startsWith("_")) continue;
        fileStems.add(stem);
      }
    }

    for (const stem of fileStems) {
      if (dirNames.has(stem)) {
        conflicts.push({
          parent: path.relative(ROOT, dir),
          segment: stem,
          file: `${stem}.tsx|ts`,
          folder: `${stem}/`,
        });
      }
    }
  }
}

let failed = false;

if (conflicts.length) {
  failed = true;
  console.error("\n❌ Expo/Next route CONFLICT: same segment as file AND folder\n");
  console.error("   This causes Unmatched Route / Details broken / random tab screens.");
  console.error("   Fix: use folder only → segment/index.tsx + segment/[id].tsx (+ optional _layout.tsx)\n");
  for (const c of conflicts) {
    console.error(`   ${c.parent}/${c.segment}`);
    console.error(`     file:   ${c.parent}/${c.file}`);
    console.error(`     folder: ${c.parent}/${c.folder}`);
  }
  console.error("\n   Learned from: cook listings/ (empty), cook orders.tsx+orders/, customer cook/[slug].tsx+[slug]/\n");
}

if (emptyDirs.length) {
  failed = true;
  console.error("\n❌ Empty route directories (not in git, still break Expo Router)\n");
  for (const d of emptyDirs) {
    console.error(`   rmdir ${d}`);
  }
  console.error("");
}

if (failed) {
  process.exit(1);
}

console.log("✅ verify-expo-routes: no file+folder conflicts, no empty route dirs");
