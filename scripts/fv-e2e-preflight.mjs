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
const webTraySection = resolve(root, 'apps/web/lib/order-tray-section-web.tsx');

run(`rg -n "resolveOrderForDisplay" "${mobileOrders}"`, 'mobile orders uses resolveOrderForDisplay');
run(`rg -n "resolveOrderForDisplay" "${webOrders}"`, 'web orders uses resolveOrderForDisplay');
run(`rg -n "OrderTrackingTraySection" "${mobileOrders}"`, 'mobile orders uses OrderTrackingTraySection');
run('rg -n "orderTrayActions|open-review-tray-btn" packages/shc-ui/src/order-tray-screen.tsx', 'shared order-tray-screen uses orderTrayActions + Maestro testIDs');
run('pnpm --filter @shc/utils exec vitest run src/family-values-e2e-fixtures.test.ts', 'fixture unit test');
run('pnpm --filter @shc/ui exec vitest run src/order-tray-tracking.test.tsx src/order-tray-section.test.tsx src/order-tray-parity.test.ts', 'shipped tray hook+section+parity tests');
run(`rg -n "OrderTrackingTraySectionWeb" "${webOrders}"`, 'web orders uses OrderTrackingTraySectionWeb');
run(`rg -n "useOrderTrayTracking|createOrderTrayFns" "${webTraySection}"`, 'web section uses useOrderTrayTracking');
run(
  `bash -c 'rg -n "orderTrayActions|const trayFns|openOrderReviewTray" "${webOrders}" && exit 1 || echo "no duplicate tray wiring on web page"'`,
  'web page has no duplicate tray wiring'
);
run('rg -n "order-e2e-review" apps/mobile-customer/e2e/order-tray.yaml', 'maestro deep link matches E2E_ORDER_SEED');
run(
  `rg -n "open-review-tray-btn|OrderTrackingTraySection" "${mobileOrders}" packages/shc-ui/src/order-tray-screen.tsx packages/shc-ui/src/order-tray-forms.tsx`,
  'order screen Maestro testIDs (screen + shared tray)'
);

lines.push(`\n=== preflight ${ok ? 'PASS' : 'FAIL'} ===`);
writeFileSync(logPath, lines.join('\n'));
console.log(lines.join('\n'));
process.exit(ok ? 0 : 1);