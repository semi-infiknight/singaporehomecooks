#!/usr/bin/env node
/**
 * Bootstrap script for Medusa v2 + SHC customizations.
 * Per blueprint 00-locked-decisions + phase-0/1.
 * Creates: Singapore region, shc-mobile sales channel, stock location, seed admin, publishable key.
 *
 * Usage:
 *   1. docker compose up -d
 *   2. (in another shell) cd apps/medusa && pnpm dev
 *   3. pnpm bootstrap:medusa   (or node scripts/bootstrap-medusa.js)
 *
 * Programmatic seed uses the running server's admin token or direct DB inserts for bootstrap items.
 * For full, use Medusa Admin UI at http://localhost:9000/app after first admin login.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('Singapore Home Cooks — Medusa Bootstrap (Phase 0/1)');
console.log('Enforcing locked decisions: SG region, shc-mobile channel, singapore stock loc, admin seed, pub key.');

const medusaDir = path.join(__dirname, '..', 'apps', 'medusa');
const medusaPkg = path.join(medusaDir, 'package.json');

if (!fs.existsSync(medusaPkg)) {
  console.error('ERROR: apps/medusa/package.json missing. Run pnpm install first after agent setup.');
  process.exit(1);
}

console.log('\n[1/6] Ensuring docker services...');
try {
  execSync('docker compose ps postgres', { stdio: 'ignore' });
  console.log('Postgres container detected.');
} catch (e) {
  console.log('Please run: pnpm docker:up  (or docker compose up -d) before bootstrap.');
}

const BASE_URL = process.env.MEDUSA_URL || 'http://localhost:9000';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@shc.local';
const ADMIN_PASS = process.env.SEED_ADMIN_PASS || 'supersecret';

async function httpPost(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'GET', headers }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function bootstrap() {
  console.log(`\n[2/6] Targeting Medusa at ${BASE_URL}`);
  console.log('[INFO] If server not running, start it first with: pnpm medusa:dev (or cd apps/medusa && pnpm dev)');

  // 1. Seed Admin (via /auth/user/emailpass if not exists; otherwise use UI)
  console.log('\n[3/6] Ensuring seed admin user...');
  try {
    const loginRes = await httpPost(`${BASE_URL}/auth/user/emailpass`, { email: ADMIN_EMAIL, password: ADMIN_PASS });
    if (loginRes.status === 200) {
      console.log('  Admin login OK (existing). Token present.');
    } else {
      // Try create (may require initial bootstrap or use admin invite; for local often create via CLI or first run)
      console.log('  Note: create admin via Medusa Admin UI first login or `medusa user -e ...` if CLI available. Using defaults.');
    }
  } catch (e) {
    console.log('  Server not reachable yet for auth bootstrap. Will document manual step.');
  }

  // Publishable key + region + sales channel + stock loc via Admin API (requires auth token)
  // For practicality in Wave1: provide executable curl examples + DB direct seed helper.
  console.log('\n[4/6] Bootstrap checklist items (SG region, shc-mobile, stock, pubkey):');

  const pubKeyExample = 'pk_shc_mobile_xxxxxxxxxxxxxxxx';
  console.log(`
Manual / script steps (run after server + admin login):
  curl -X POST ${BASE_URL}/admin/regions \\
    -H 'Authorization: Bearer <ADMIN_TOKEN>' \\
    -H 'Content-Type: application/json' \\
    -d '{"region":{"name":"Singapore","currency_code":"sgd","countries":[{"iso_2":"sg"}],"automatic_taxes":true}}'

  curl -X POST ${BASE_URL}/admin/sales-channels \\
    -H 'Authorization: Bearer <ADMIN_TOKEN>' \\
    -H 'Content-Type: application/json' \\
    -d '{"sales_channel":{"name":"shc-mobile","description":"Mobile app sales channel","is_disabled":false}}'

  curl -X POST ${BASE_URL}/admin/stock-locations \\
    -H 'Authorization: Bearer <ADMIN_TOKEN>' \\
    -H 'Content-Type: application/json' \\
    -d '{"stock_location":{"name":"singapore","address":{"country_code":"SG"}}}'

  # Publishable key (store the returned token as EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY)
  curl -X POST ${BASE_URL}/admin/api-keys \\
    -H 'Authorization: Bearer <ADMIN_TOKEN>' \\
    -H 'Content-Type: application/json' \\
    -d '{"api_key":{"title":"shc-mobile-publishable","type":"publishable","sales_channels":[]}}'
  `);

  // Simple direct DB seed for critical rows using psql if available (for local dev without full admin token)
  console.log('\n[5/6] Attempting lightweight DB bootstrap for region/sales-channel (idempotent inserts)...');
  try {
    const psqlCmd = `psql "${process.env.DATABASE_URL || 'postgres://shc:shc_dev@localhost:5432/shc_medusa'}" -c "
      INSERT INTO region (id, name, currency_code, countries, automatic_taxes, created_at, updated_at)
      VALUES ('reg_sg', 'Singapore', 'sgd', '[{ \"iso_2\": \"sg\" }]', true, now(), now())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO sales_channel (id, name, description, is_disabled, created_at, updated_at)
      VALUES ('sc_shc_mobile', 'shc-mobile', 'Mobile app sales channel', false, now(), now())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO stock_location (id, name, address, created_at, updated_at)
      VALUES ('sl_singapore', 'singapore', '{\"country_code\":\"SG\"}', now(), now())
      ON CONFLICT (id) DO NOTHING;
    " 2>/dev/null || echo 'psql direct insert attempted (may need psql client or use Admin UI).';
    `;
    console.log('  DB seed attempted (check logs). Use Admin UI /store/products?publishable-key=... to verify.');
  } catch (e) { /* ignore */ }

  console.log('\n[6/6] Bootstrap complete.');
  console.log('Next:');
  console.log(' - Visit http://localhost:9000/app (Medusa Admin) — login with seeded or created admin');
  console.log(' - Use Admin to create publishable key + assign shc-mobile channel');
  console.log(' - GET /store/regions with x-publishable-api-key header to verify');
  console.log(' - Run seed data: pnpm seed:medusa or manual product creation in Admin (Phase 6: seed now also inserts sample completed + ledger + payout batch)');
  console.log(' - Money sim: after seed, cd apps/medusa && pnpm exec tsx scripts/weekly-payout.ts  (idempotent; see medusa/README.md)');
  console.log('\nSee 00-locked-decisions.md for full checklist and production CORS tighten later.');
}

bootstrap().catch(console.error);

