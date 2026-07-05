#!/usr/bin/env node
/**
 * Static preflight before Maestro order-tray — grep + fixture unit test.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = process.env.FAMILY_VALUES_SCRATCH || root;
mkdirSync(scratch, { recursive: true });
const logPath = resolve(scratch, 'e2e-preflight.log');
const lines = [`=== fv-e2e-preflight ${new Date().toISOString()} ===`];
let ok = true;

function run(cmd, label) {
  lines.push(`\n--- ${label} ---`);
  lines.push(`$ ${cmd}`);
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    lines.push(out.trim());
    lines.push(`PASS: ${label}`);
    return true;
  } catch (e) {
    ok = false;
    lines.push((e.stdout || '').trim());
    lines.push((e.stderr || '').trim());
    lines.push(`FAIL: ${label}`);
    return false;
  }
}

const mobileOrders = resolve(root, 'apps/mobile-customer/app/(customer)/orders/[id].tsx');
const webOrders = resolve(root, 'apps/web/app/orders/[id]/page.tsx');

run(`rg -n "resolveOrderForDisplay" "${mobileOrders}"`, 'mobile orders uses resolveOrderForDisplay');
run(`rg -n "resolveOrderForDisplay" "${webOrders}"`, 'web orders uses resolveOrderForDisplay');
run(`rg -n "orderTrayActions" "${mobileOrders}"`, 'mobile orders uses orderTrayActions');
run('pnpm --filter @shc/utils exec vitest run src/family-values-e2e-fixtures.test.ts', 'fixture unit test');
run('pnpm --filter @shc/ui exec vitest run src/family-values-tray-integration.test.tsx', 'shipped tray integration test');
run(`rg -n "orderTrayActions" "${webOrders}"`, 'web orders uses orderTrayActions');
run('rg -n "order-e2e-review" apps/mobile-customer/e2e/order-tray.yaml', 'maestro deep link matches E2E_ORDER_SEED');
run(
  `rg -n "open-review-tray-btn|review-body-input" "${mobileOrders}"`,
  'order screen Maestro testIDs'
);

lines.push(`\n=== preflight ${ok ? 'PASS' : 'FAIL'} ===`);
writeFileSync(logPath, lines.join('\n'));
console.log(lines.join('\n'));
process.exit(ok ? 0 : 1);