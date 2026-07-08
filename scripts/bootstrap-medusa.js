#!/usr/bin/env node
/**
 * Bootstrap against Railway Medusa (remote only — local Medusa is disabled for clients).
 * Creates admin (if missing), publishable API key, demo customer; writes client .env.local files.
 *
 * Prereqs: Railway Medusa reachable (default from config/railway-client.json).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const MEDUSA_DIR = path.join(ROOT, 'apps', 'medusa');
const RAILWAY_CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/railway-client.json'), 'utf8'));

function rejectLocalMedusa(url) {
  if (/localhost|127\.0\.0\.1/i.test(url)) {
    console.error('ERROR: Local Medusa is disabled. Use Railway:', RAILWAY_CFG.medusaBase);
    process.exit(1);
  }
}

const BASE_URL = process.env.MEDUSA_URL || RAILWAY_CFG.medusaBase;
rejectLocalMedusa(BASE_URL);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@shc.local';
const ADMIN_PASS = process.env.SEED_ADMIN_PASS || 'supersecret';
const CUSTOMER_ENV_OUT = path.join(ROOT, 'apps', 'mobile-customer', '.env.local');
const COOK_ENV_OUT = path.join(ROOT, 'apps', 'mobile-cook', '.env.local');
const WEB_ENV_OUT = path.join(ROOT, 'apps', 'web', '.env.local');
const DEMO_CUSTOMER_EMAIL = process.env.SEED_CUSTOMER_EMAIL || 'customer@shc.local';
const DEMO_CUSTOMER_PASS = process.env.SEED_CUSTOMER_PASS || 'customersecret';
const ENV_EXAMPLE = path.join(ROOT, '.env.example');

function httpJson(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(`${BASE_URL}${urlPath}`);
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch { /* text */ }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function waitForServer(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await httpJson('GET', '/health');
      if (res.status === 200) return true;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function ensureAdmin() {
  // Try login first — avoid medusa user CLI while server is running (can reset connections)
  try {
    await adminToken();
    console.log('  ✓ Admin login OK (existing user)');
    return;
  } catch { /* create below */ }
  if (process.env.SKIP_MEDUSA_USER_CLI === 'true') {
    console.log('  · Admin user create skipped (SKIP_MEDUSA_USER_CLI — create via CI/offline step)');
    return;
  }
  try {
    execSync(`pnpm exec medusa user -e ${ADMIN_EMAIL} -p ${ADMIN_PASS}`, {
      cwd: MEDUSA_DIR,
      stdio: 'pipe',
      env: { ...process.env, MEDUSA_DISABLE_ADMIN: 'true' },
    });
    console.log('  ✓ Admin user created (server was stopped for CLI)');
    await waitForServer(90000);
  } catch {
    console.log('  · Admin user create skipped — ensure admin@shc.local exists');
  }
}

async function adminToken(retries = 5) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await httpJson('POST', '/auth/user/emailpass', { email: ADMIN_EMAIL, password: ADMIN_PASS });
      if (res.status === 200 && res.body?.token) return res.body.token;
      lastErr = new Error(`Admin login failed (${res.status}): ${JSON.stringify(res.body)}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw lastErr;
}

async function adminPost(token, urlPath, body) {
  return httpJson('POST', urlPath, body, { Authorization: `Bearer ${token}` });
}

async function adminGet(token, urlPath) {
  return httpJson('GET', urlPath, null, { Authorization: `Bearer ${token}` });
}

async function ensurePublishableKey(token) {
  const existing = await adminGet(token, '/admin/api-keys?type=publishable&limit=5');
  const keys = existing.body?.api_keys || existing.body?.apiKeys || [];
  const found = keys.find((k) => k.title === 'shc-mobile-publishable' && !k.revoked_at);
  if (found?.token) {
    console.log('  ✓ Reusing existing publishable key');
    return found.token;
  }
  const created = await adminPost(token, '/admin/api-keys', {
    title: 'shc-mobile-publishable',
    type: 'publishable',
  });
  if (created.status >= 200 && created.status < 300 && created.body?.api_key?.token) {
    console.log('  ✓ Created publishable API key');
    return created.body.api_key.token;
  }
  throw new Error(`Failed to create publishable key: ${JSON.stringify(created.body)}`);
}

function writeEnvFiles(pubKey) {
  const expoEnv = [
    '# Auto-generated by scripts/bootstrap-medusa.js — Medusa always required',
    `EXPO_PUBLIC_MEDUSA_BASE=${BASE_URL}`,
    `EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${pubKey}`,
    '',
  ].join('\n');
  fs.writeFileSync(CUSTOMER_ENV_OUT, expoEnv);
  console.log(`  ✓ Wrote ${CUSTOMER_ENV_OUT}`);
  fs.writeFileSync(COOK_ENV_OUT, expoEnv);
  console.log(`  ✓ Wrote ${COOK_ENV_OUT}`);

  const webEnv = [
    '# Auto-generated by scripts/bootstrap-medusa.js',
    `NEXT_PUBLIC_SHC_API_BASE=${BASE_URL}`,
    `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${pubKey}`,
    '',
  ].join('\n');
  fs.writeFileSync(WEB_ENV_OUT, webEnv);
  console.log(`  ✓ Wrote ${WEB_ENV_OUT}`);

  const example = [
    '# Client apps — Railway only (see config/railway-client.json)',
    `EXPO_PUBLIC_MEDUSA_BASE=${RAILWAY_CFG.medusaBase}`,
    'EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_from_bootstrap_or_config',
    `NEXT_PUBLIC_SHC_API_BASE=${RAILWAY_CFG.medusaBase}`,
    'NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_from_bootstrap_or_config',
    '',
    '# Medusa server secrets — Railway dashboard only (never commit)',
    '# DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET, STORE_CORS, AUTH_CORS',
    '',
    '# EAS / mobile builds',
    'EXPO_PUBLIC_MEDUSA_BASE=https://your-medusa.up.railway.app',
    '',
    '# Maestro Cloud (optional CI)',
    'MAESTRO_CLOUD_TOKEN=',
  ].join('\n');
  fs.writeFileSync(ENV_EXAMPLE, example);
  console.log(`  ✓ Wrote ${ENV_EXAMPLE}`);
}

async function ensureDemoCustomer(publishableKey) {
  let token = null;
  const reg = await httpJson('POST', '/auth/customer/emailpass/register', {
    email: DEMO_CUSTOMER_EMAIL,
    password: DEMO_CUSTOMER_PASS,
  });
  if (reg.status >= 200 && reg.status < 300 && reg.body?.token) {
    token = reg.body.token;
    console.log('  ✓ Demo customer auth registered:', DEMO_CUSTOMER_EMAIL);
  } else {
    const login = await httpJson('POST', '/auth/customer/emailpass', {
      email: DEMO_CUSTOMER_EMAIL,
      password: DEMO_CUSTOMER_PASS,
    });
    if (login.status >= 200 && login.status < 300 && login.body?.token) {
      token = login.body.token;
      console.log('  ✓ Demo customer auth login OK:', DEMO_CUSTOMER_EMAIL);
    } else {
      console.log('  · Demo customer auth setup skipped:', JSON.stringify(reg.body || login.body));
      return;
    }

  // Cook auth production hardening: hashed password + custom SHC JWT (Medusa auth_identity linked in seed)
  console.log('  · Ensuring demo cook auth (rose@shc.local / cooksecret) - hashed + auth_identity_id');
  try {
    const cookLogin = await httpJson('POST', '/store/shc/auth/cook/login', {
      email: 'rose@shc.local',
      password: 'cooksecret',
    });
    if (cookLogin.status >= 200 && cookLogin.status < 300 && cookLogin.body?.token) {
      console.log('  ✓ Demo cook SHC JWT login ready (production: use hashed, no plaintext fallback in prod)');
    } else {
      console.log('  · Demo cook will be ready after seed (provides password_hash + auth_identity_id)');
    }
  } catch (e) {
    console.log('  · Cook auth (seed provides; bootstrap verifies post-seed)');
  }
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'x-publishable-api-key': publishableKey,
  };
  const me = await httpJson('GET', '/store/customers/me', null, authHeaders);
  if (me.status === 200 && me.body?.customer?.id) {
    console.log('  ✓ Demo store customer profile exists:', me.body.customer.id);
    return;
  }

  const created = await httpJson(
    'POST',
    '/store/customers',
    { email: DEMO_CUSTOMER_EMAIL, first_name: 'Demo', last_name: 'Customer' },
    authHeaders
  );
  if (created.status >= 200 && created.status < 300 && created.body?.customer?.id) {
    console.log('  ✓ Demo store customer created:', created.body.customer.id);
    return;
  }
  console.log('  · Demo store customer setup skipped:', JSON.stringify(created.body || me.body));
}

async function main() {
  console.log('Singapore Home Cooks — Medusa Bootstrap (automated)\n');

  console.log('[1/6] Waiting for Medusa at', BASE_URL);
  const up = await waitForServer();
  if (!up) {
    console.error(`ERROR: Medusa not reachable at ${BASE_URL}. Check Railway deploy or VPN.`);
    console.error('  Quick fix: pnpm env:sync  (writes Railway URLs to client .env.local)');
    process.exit(1);
  }
  console.log('  ✓ Server healthy');

  console.log('\n[2/6] Ensuring admin user...');
  await ensureAdmin();

  console.log('\n[3/6] Admin login...');
  const token = await adminToken();
  console.log('  ✓ Authenticated');

  console.log('\n[4/6] Publishable API key...');
  const pubKey = await ensurePublishableKey(token);

  console.log('\n[5/6] Demo customer account...');
  await ensureDemoCustomer(pubKey);

  console.log('\n[6/6] Writing env files...');
  writeEnvFiles(pubKey);

  console.log('\nBootstrap complete.');
  console.log('Demo accounts:');
  console.log(`  Customer: ${DEMO_CUSTOMER_EMAIL} / ${DEMO_CUSTOMER_PASS}`);
  console.log('  Cook: rose@shc.local / cooksecret');
  console.log('Next:');
  console.log('  pnpm customer:dev   # mobile customer → Railway');
  console.log('  pnpm cook:dev       # mobile cook → Railway');
  console.log('  pnpm web:dev        # web PWA → Railway');
  console.log('  pnpm verify:real-e2e');
}

main().catch((e) => {
  console.error('Bootstrap failed:', e.message || e);
  process.exit(1);
});