/**
 * Shared Playwright auth for live Railway — one login per role, disk cache, long backoff on 429.
 * Avoid parallel login storms (auth.login = 5 / 15 min per IP).
 */
import { request, type Page } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const API_BASE = process.env.NEXT_PUBLIC_SHC_API_BASE || 'https://medusa-production-d2ba.up.railway.app';
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  'pk_0c98d5a5c7ba76cad2ea42501361d8e29825876bcedb8425a627f35a2c12b9b2';

const CACHE_DIR = join(process.cwd(), 'e2e', '.auth-cache');
const CACHE_FILE = join(CACHE_DIR, 'sessions.json');
/** Reuse tokens for most of the rate-limit window */
const CACHE_TTL_MS = 12 * 60 * 1000;

type Role = 'customer' | 'cook';
type Session = { token: string; user: unknown; fetchedAt: number };

type CacheFile = Partial<Record<Role, Session>>;

const memory: CacheFile = {};

function readCache(): CacheFile {
  try {
    if (!existsSync(CACHE_FILE)) return {};
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as CacheFile;
  } catch {
    return {};
  }
}

function writeCache(next: CacheFile) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(next, null, 2));
  } catch {
    /* non-fatal */
  }
}

function valid(s?: Session): s is Session {
  return !!s?.token && Date.now() - s.fetchedAt < CACHE_TTL_MS;
}

async function loginOnce(
  path: string,
  email: string,
  password: string
): Promise<Session> {
  const api = await request.newContext({
    extraHTTPHeaders: {
      'content-type': 'application/json',
      'x-publishable-api-key': PUBLISHABLE_KEY,
    },
  });
  let lastBody = '';
  // 5/15min limit — few attempts, long waits
  const waits = [0, 30_000, 60_000, 90_000, 120_000, 180_000];
  for (let i = 0; i < waits.length; i++) {
    if (waits[i] > 0) await new Promise((r) => setTimeout(r, waits[i]));
    try {
      const res = await api.post(`${API_BASE}${path}`, {
        data: { email, password },
      });
      lastBody = await res.text();
      if (res.ok()) {
        const parsed = JSON.parse(lastBody) as { token?: string; user?: unknown };
        if (parsed.token) {
          return { token: parsed.token, user: parsed.user, fetchedAt: Date.now() };
        }
      }
      if (lastBody.includes('Too many login') || res.status() === 429) {
        continue;
      }
    } catch (e) {
      lastBody = String((e as Error).message || e);
    }
  }
  throw new Error(`Login failed: ${lastBody.slice(0, 240)}`);
}

export async function getCustomerSession(): Promise<Session> {
  if (valid(memory.customer)) return memory.customer!;
  const disk = readCache();
  if (valid(disk.customer)) {
    memory.customer = disk.customer;
    return disk.customer!;
  }
  const session = await loginOnce(
    '/store/shc/auth/customer/login',
    process.env.SHC_CUSTOMER_EMAIL || 'customer@shc.local',
    process.env.SHC_CUSTOMER_PASSWORD || 'customersecret'
  );
  memory.customer = session;
  writeCache({ ...readCache(), customer: session });
  return session;
}

export async function getCookSession(): Promise<Session> {
  if (valid(memory.cook)) return memory.cook!;
  const disk = readCache();
  if (valid(disk.cook)) {
    memory.cook = disk.cook;
    return disk.cook!;
  }
  const session = await loginOnce(
    '/store/shc/auth/cook/login',
    process.env.SHC_COOK_EMAIL || 'rose@shc.local',
    process.env.SHC_COOK_PASSWORD || 'cooksecret'
  );
  memory.cook = session;
  writeCache({ ...readCache(), cook: session });
  return session;
}

/** Apply customer JWT to page localStorage (call after a navigation to same origin). */
export async function applyCustomerAuth(page: Page) {
  const session = await getCustomerSession();
  await page.addInitScript(
    (data) => {
      localStorage.setItem('shc_web_token', data.token);
      localStorage.setItem('shc_web_user', data.userJson);
    },
    { token: session.token, userJson: JSON.stringify(session.user) }
  );
}

/** Switch page storage to cook portal JWT before cook routes. */
export async function applyCookAuth(page: Page) {
  const session = await getCookSession();
  await page.addInitScript(
    (data) => {
      localStorage.setItem('shc_cook_token', data.token);
      localStorage.setItem('shc_cook_user', data.userJson);
      localStorage.setItem('shc_cook_onboarding_seen_v1', '1');
    },
    { token: session.token, userJson: JSON.stringify(session.user) }
  );
  // Also set immediately if already on domain
  try {
    await page.evaluate(
      (data) => {
        localStorage.setItem('shc_cook_token', data.token);
        localStorage.setItem('shc_cook_user', data.userJson);
        localStorage.setItem('shc_cook_onboarding_seen_v1', '1');
      },
      { token: session.token, userJson: JSON.stringify(session.user) }
    );
  } catch {
    /* no page yet */
  }
}

/** Switch back to customer JWT mid-test. */
export async function reapplyCustomerAuth(page: Page) {
  const session = await getCustomerSession();
  await page.evaluate(
    (data) => {
      localStorage.setItem('shc_web_token', data.token);
      localStorage.setItem('shc_web_user', data.userJson);
    },
    { token: session.token, userJson: JSON.stringify(session.user) }
  );
}
