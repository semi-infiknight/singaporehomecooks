// apps/mobile/lib/mock-service.ts
// Sophisticated in-app mock "backend" for Phases 0-5 core flows.
// Enforces @shc/business-rules + validates against @shc/types schemas.
// Later replaced by real /store/shc API + TanStack + Medusa.
// All data is typed, rule-checked. SG HDB/heritage focused seed data.

import { SHCCook, SHCOrderStatus, shcOrderMetaSchema, shcProductMetaSchema, SHCErrorCode, createSHCError, SHCErrorCodes, SHCRequest, SHCBid, SHCFeatureFlag, shcRequestSchema, shcBidSchema, shcFeatureFlagSchema } from '@shc/types';
import {
  enforceOneCookPerCart,
  enforceOneCookOnAdd,
  validateMinQty,
  validateAllergenAckForCheckout,
  calculateCookEarnings,
  canTransition,
} from '@shc/business-rules';

// Canonical seeds for rich, consistent SG heritage data (Content+Seed track). Shared with Medusa bootstrap.
import { seedCooks, seedDishes } from '../../../seed';

// In-memory "DB" (persists in module for session) (seeded inline for self-contained mobile; no external seed dep)
let cooks: SHCCook[] = [];
let products: any[] = []; // SHCProductMeta + base
let availabilities: any[] = [];
let orders: any[] = [];
let carts: any = { items: [], cookId: null };
let messages: Record<string, any[]> = {};
let currentUser: any = { role: 'customer' as 'customer' | 'cook', id: 'cust_demo', name: 'Demo Customer', pdpa_consent_at: null as string | null, pdpa_consent_version: null as string | null };

// Phase 7-9 growth/diff state (enriched mock, frozen contracts via shc_*). Memory = simple offline cache (persist across session; prod: AsyncStorage/SecureStore swap point)
let userCredits: Record<string, number> = {}; // customerId -> balance (units; redeem 4 units ~ S$1)
let lifetimeSpend: Record<string, number> = {}; // for tier: Bronze <450, Silver, Gold >1200
let requests: SHCRequest[] = [];
let bids: SHCBid[] = [];
let heritageArchives: Record<string, any[]> = {}; // cookId -> permanent archive entries (seed + add/edit, visible even inactive)
let featureFlags: SHCFeatureFlag[] = [];
let notifications: any[] = []; // in-app bell: recent order events, request matches etc.
const searchSynonyms: Array<{term: string; expansions: string[]}> = [
  { term: 'nasi lemak', expansions: ['coconut rice', 'sambal prawn rice', 'lemak'] },
  { term: 'coconut rice', expansions: ['nasi lemak', 'nasi lemak prawn'] },
  { term: 'ayam buah keluak', expansions: ['buah keluak', 'keluak chicken', 'peranakan black nut'] },
  { term: 'devil curry', expansions: ['devils curry', 'eurasian curry', 'kristang curry'] },
  { term: 'hari raya', expansions: ['raya', 'eid', 'puasa', 'open house'] },
  { term: 'hdb', expansions: ['home kitchen', 'tampines', 'katong', 'blk'] },
];

// Simple rate limit stub (per production-hardening + task): in-memory throttle for sensitive actions
const RATE_LIMIT_WINDOW_MS = 60_000; // 1min
const RATE_LIMIT_MAX = 8; // generous for demo
const rateCounters: Record<string, { count: number; resetAt: number }> = {};
function checkRateLimit(actorId: string, action: string): void {
  const key = `${actorId}:${action}`;
  const now = Date.now();
  const rec = rateCounters[key] || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > rec.resetAt) {
    rec.count = 0;
    rec.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  if (rec.count >= RATE_LIMIT_MAX) {
    throw createSHCError('SHC-GENERIC-001', `Rate limit exceeded for ${action}. Try again later.`);
  }
  rec.count++;
  rateCounters[key] = rec;
}

// Structured audit logger stub (per production/compliance-pdpa + hardening)
function auditLog(actor: string, action: string, before?: any, after?: any, meta?: any) {
  const entry = {
    ts: new Date().toISOString(),
    actor,
    action,
    before: before ? JSON.parse(JSON.stringify(before)) : undefined,
    after: after ? JSON.parse(JSON.stringify(after)) : undefined,
    meta: meta || {},
  };
  // console for local + future pino/railway
  console.info('[SHC-AUDIT]', JSON.stringify(entry));
  // In prod: persist to shc_audit_log or external
}

// Seeded Singapore heritage data (validated at load)
// Now sourced from canonical Content+Seed assets (seed/index.ts + JSONs) for exact shared typed data
// between mobile mocks and future Medusa. The 2 cooks + 3+ dishes (Nasi Lemak, Ayam Buah Keluak, Eurasian Devil's Curry)
// with full stories, HDB addresses, realistic allergens, festive timing, occasion tags.
function seed() {
  if (cooks.length > 0) return;

  // Use canonical from seed/ (rich stories, HDB notes, SG details already populated)
  cooks = [...seedCooks];

  // Map canonical dishes into internal product shape + re-validate meta (full heritage from seed)
  products = seedDishes.map((d: any) => {
    const meta = {
      product_id: d.id,
      cook_id: d.cook_id,
      cuisine: d.cuisine,
      occasion_tags: d.occasion_tags || [],
      allergen_tiers: d.allergen_tiers || { tier1: [] },
      halal: !!d.halal,
      calories: d.calories,
      calories_confidence: d.calories_confidence || 'category',
      ingredients: d.ingredients || [],
      min_qty: d.min_qty || 5,
      last_minute_premium_pct: d.last_minute_premium_pct,
    };
    try { shcProductMetaSchema.parse(meta); } catch (e) { console.warn('Seed meta validation note:', e); }

    const cookName = d.cook_display_name || cooks.find(c => c.id === d.cook_id)?.display_name;
    // NOTE: NO explicit 'cook_id:' key in this literal (provided cleanly by ...meta below to satisfy TS no-dupe)
    return {
      id: d.id,
      name: d.name,
      price: d.price,
      cook_name: cookName,
      ...meta,
      heritage_note: d.heritage_note || d.description?.slice(0, 120),
      description: d.description,
      festive_timing: d.festive_timing,
      image_placeholder: d.image_placeholder,
    };
  });

  // Availabilities derived (richer in real Medusa shc_availability)
  availabilities = products.map((p: any, idx: number) => ({
    product_id: p.id,
    portions_per_day: idx === 1 ? 12 : 18,
    collection_days: [0,1,2,3,4,5,6],
    time_slots: ['17:00-19:00', '18:00-20:00'],
    paused: false,
  }));

  // Seed one demo order (uses first canonical dish)
  const firstDish = products[0];
  const demoCookId = firstDish.cook_id;
  const demoOrder = {
    id: 'SHC-2026-00001',
    cook_id: demoCookId,
    items: [{ product_id: firstDish.id, name: firstDish.name, qty: 5, price: firstDish.price }],
    total: firstDish.price * 5,
    shc_status: 'paid' as SHCOrderStatus,
    collection_date: '2026-06-20',
    collection_slot: '18:00-19:00',
    allergen_acked_at: new Date().toISOString(),
    pdpa_consent_at: new Date().toISOString(),
    pdpa_consent_version: 'v1.0-pdpa-2025',
    paynow_reference: 'SHC-2026-00001-ABC',
    customer_id: 'cust_demo',
    created_at: new Date().toISOString(),
  };
  orders = [demoOrder];
  messages['SHC-2026-00001'] = [
    { id: 'm1', order_id: 'SHC-2026-00001', sender_actor: 'cook', body: `Order accepted! Ready by 5:30pm. Collection at my HDB — details released 2h before. See you! (From ${firstDish.cook_name})`, created_at: new Date().toISOString() },
  ];

  // Phase 8/9 seeds: feature flags (use shc_feature_flag), heritage archives (from seed stories + extra), sample request, credits for demo customer, platform stat stub
  if (featureFlags.length === 0) {
    featureFlags = [
      { key: 'home_credits', enabled: true, cohort_filter: { all: true } },
      { key: 'recipe_requests', enabled: true },
      { key: 'ai_calorie_stub', enabled: true },
      { key: 'corporate_orders', enabled: true },
    ].map(f => { try { shcFeatureFlagSchema.parse(f); } catch {}; return f as any; });
  }
  if (Object.keys(heritageArchives).length === 0) {
    // Permanent archive even if cook inactive. Use seed heritage + extra SG family stories
    heritageArchives['cook_rose_tampines_001'] = [
      { id: 'ha1', title: '1972 Katong Nasi Lemak', story: 'Ah Mah ground rempah on batu lesung every dawn in the shophouse. We keep the exact pandan-lemak ratio in our Tampines HDB. Published for the Heritage Library.', photo_stub: 'nasi-lemak-family-1972.jpg', published: true, created_at: '2024-01-01' },
      { id: 'ha2', title: 'Buah Keluak Ritual', story: 'Soak 3 days, scrape the flesh by hand — the same way my mother taught in 1983 HDB kitchen. The bitter chocolate depth is our family signature for Raya and birthdays.', photo_stub: 'keluak-paste-hdb.jpg', published: true, created_at: '2024-06-01' },
    ];
    heritageArchives['cook_doris_katong_002'] = [
      { id: 'ha3', title: 'Eurasian Devil\'s Curry from Nenek', story: 'Portuguese-Malay roots in Katong since 1900s. The vinegar tang and mustard seeds tell our Kristang story. Still cooked in Joo Chiat HDB for Christmas & Full Moon. Always published.', photo_stub: 'devils-curry-1950s.jpg', published: true, created_at: '2025-02-01' },
    ];
  }
  if (requests.length === 0) {
    requests = [{
      id: 'req_001', customer_id: 'cust_demo', body: 'Nasi lemak sambal for 6-8, medium spice, for Hari Raya open house on 20th. Family recipe preferred.', youtube_url: undefined, party_size: 8, budget_cents: 15000, date: '2026-06-20', status: 'open' as const, created_at: new Date().toISOString(),
    }];
    try { shcRequestSchema.parse(requests[0]); } catch {}
  }
  // Seed some credits for demo (customer earns on complete; cook profile shows for own)
  if (!userCredits['cust_demo']) userCredits['cust_demo'] = 85; // ~S$21 redeemable
  if (!lifetimeSpend['cust_demo']) lifetimeSpend['cust_demo'] = 680; // Silver tier demo
  // Initial notif from demo order
  if (notifications.length === 0) notifications.push({ id: 'n1', type: 'order', body: 'Demo order SHC-2026-00001 ready for collection. Home Credits will be awarded on complete.', created_at: new Date().toISOString() });
}

seed();

// Public API (mock client)
export const api = {
  // Auth (dev switcher)
  loginAs(role: 'customer' | 'cook', name?: string, pdpaConsent?: { at?: string; version?: string }) {
    const base = { role, id: role === 'cook' ? 'cook_auntierose' : 'cust_demo', name: name || (role === 'cook' ? 'Auntie Rose' : 'Demo Customer') };
    currentUser = {
      ...base,
      pdpa_consent_at: pdpaConsent?.at || (role === 'cook' ? new Date().toISOString() : null),
      pdpa_consent_version: pdpaConsent?.version || (role === 'cook' ? 'v1.0-pdpa-2025' : null),
    };
    auditLog(currentUser.id, 'auth.loginAs', null, currentUser);
    return currentUser;
  },
  getCurrentUser() { return currentUser; },

  // Discovery - customer
  listCooks(): SHCCook[] { seed(); return cooks.filter(c => c.status === 'active'); },

  searchProducts(query: string, filters?: { occasion?: string; halal?: boolean; maxCal?: number; cuisine?: string; minPrice?: number }) {
    seed();
    let res = [...products];
    let effectiveQuery = (query || '').toLowerCase().trim();

    // Phase 7/9 search enhancements: synonym map (SG terms like nasi lemak → coconut rice match) + fuzzy already, natural language stub parse ("under 500 cal for Hari Raya")
    if (effectiveQuery) {
      // NL stub parse for common SG patterns
      const nlFilters: any = {};
      if (/under\s*(\d+)\s*cal|<\s*(\d+)\s*cal/i.test(effectiveQuery)) {
        const m = effectiveQuery.match(/under\s*(\d+)|<\s*(\d+)/i); if (m) nlFilters.maxCal = parseInt(m[1] || m[2]);
      }
      if (/hari raya|raya|eid|puasa/i.test(effectiveQuery)) nlFilters.occasion = 'Hari Raya';
      if (/hdb|home/i.test(effectiveQuery)) { /* flavour text */ }
      // Apply NL extracted as filters (non-destructive to explicit)
      if (nlFilters.maxCal && !filters?.maxCal) filters = { ...(filters || {}), maxCal: nlFilters.maxCal };
      if (nlFilters.occasion && !filters?.occasion) filters = { ...(filters || {}), occasion: nlFilters.occasion };
      // Expand synonyms
      let expanded = effectiveQuery;
      for (const syn of searchSynonyms) {
        if (effectiveQuery.includes(syn.term) || syn.expansions.some(e => effectiveQuery.includes(e))) {
          expanded = [effectiveQuery, syn.term, ...syn.expansions].join(' ');
        }
      }
      res = res.filter(p =>
        p.name.toLowerCase().includes(effectiveQuery) ||
        p.cook_name.toLowerCase().includes(effectiveQuery) ||
        (p.heritage_note || '').toLowerCase().includes(effectiveQuery) ||
        p.occasion_tags.some((t: string) => t.toLowerCase().includes(effectiveQuery)) ||
        expanded.split(/\s+/).some((tok: string) => p.name.toLowerCase().includes(tok) || (p.heritage_note || '').toLowerCase().includes(tok))
      );
    }
    const f = filters || {};
    if (f.occasion) res = res.filter(p => p.occasion_tags.includes(f.occasion!));
    if (f.halal) res = res.filter(p => p.halal);
    if (f.maxCal) res = res.filter(p => (p.calories || 999) <= f.maxCal!);
    if (f.cuisine) res = res.filter(p => (p.cuisine || '').toLowerCase().includes(f.cuisine!.toLowerCase()));
    if (f.minPrice) res = res.filter(p => (p.price || 0) >= f.minPrice!);
    return res;
  },

  getCook(slugOrId: string) {
    seed();
    return cooks.find(c => c.slug === slugOrId || c.id === slugOrId);
  },

  getProduct(id: string) {
    seed();
    return products.find(p => p.id === id);
  },

  getAvailabilityForProduct(productId: string) {
    seed();
    return availabilities.find(a => a.product_id === productId);
  },

  getAvailableSlots(productId: string): Array<{ date: string; slot: string }> {
    seed();
    const a = availabilities.find(av => av.product_id === productId);
    if (!a || a.paused) return [];
    // Simulate near future dates Singapore style
    const base = new Date();
    const slots: Array<{ date: string; slot: string }> = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(base); d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      a.time_slots.forEach((slot: string) => slots.push({ date: dateStr, slot }));
    }
    return slots;
  },

  // Cart - enforce rules
  getCart() { seed(); return { ...carts }; },

  addToCart(productId: string, qty: number) {
    seed();
    checkRateLimit(currentUser.id, 'addToCart');
    const prod = products.find(p => p.id === productId);
    if (!prod) throw createSHCError('SHC-GENERIC-001', 'Product not found');

    const minCheck = validateMinQty(prod.min_qty, qty);
    if (!minCheck.valid) throw createSHCError('SHC-CART-002', minCheck.error || 'Min qty failed');

    const addCheck = enforceOneCookOnAdd(carts.cookId, prod.cook_id);
    if (!addCheck.valid) throw createSHCError('SHC-CART-001', addCheck.error || 'One cook rule');

    const beforeCart = { ...carts };
    const item = { productId, name: prod.name, qty, price: prod.price, cookId: prod.cook_id };
    carts.items = [...(carts.items || []), item];
    carts.cookId = prod.cook_id;

    const overall = enforceOneCookPerCart(carts.items.map((i: any) => ({ cookId: i.cookId, productId: i.productId, qty: i.qty })));
    if (!overall.valid) throw createSHCError('SHC-CART-001', overall.error!);

    auditLog(currentUser.id, 'cart.add', beforeCart, carts);
    return carts;
  },

  clearCart() { carts = { items: [], cookId: null }; return carts; },

  // Checkout + rules
  checkout(allergenAck: boolean, collection: { date: string; slot: string }, pdpaConsent?: boolean) {
    seed();
    checkRateLimit(currentUser.id, 'checkout');
    if (carts.items.length === 0) throw createSHCError('SHC-CART-001', 'Cart empty');
    if (!allergenAck) {
      const err = validateAllergenAckForCheckout({ allergen_acked_at: null });
      if (!err.valid) throw createSHCError('SHC-CART-003', err.error || SHCErrorCodes['SHC-CART-003']);
    }
    // PDPA explicit consent required for customer at checkout (per compliance-pdpa.md + task)
    if (!pdpaConsent) {
      throw createSHCError('SHC-GENERIC-001', 'PDPA consent required before completing checkout (Singapore compliance)');
    }
    const total = carts.items.reduce((sum: number, i: any) => sum + i.price * i.qty, 0);
    const orderId = `SHC-2026-${String(10000 + orders.length).slice(-5)}`;
    const cookId = carts.cookId!;

    const pdpaAt = new Date().toISOString();
    const orderMeta = {
      order_id: orderId,
      cook_id: cookId,
      collection_date: collection.date,
      collection_slot: collection.slot,
      allergen_acked_at: allergenAck ? new Date().toISOString() : undefined,
      pdpa_consent_at: pdpaAt,
      pdpa_consent_version: 'v1.0-pdpa-2025',
      shc_status: 'paid' as SHCOrderStatus,
      paynow_reference: undefined,
      created_at: new Date().toISOString(),
    };
    shcOrderMetaSchema.parse(orderMeta); // enforce schema

    const cookName2 = cooks.find(c => c.id === cookId)?.display_name;
    const order = {
      id: orderId,
      cook_name: cookName2,
      items: [...carts.items],
      total,
      ...orderMeta,
      customer_id: currentUser.id,
    };
    orders.unshift(order);
    messages[orderId] = [];

    // Audit before/after (money + state)
    const finalCart = carts;
    auditLog(currentUser.id, 'order.checkout', { cart: finalCart }, { order, total, earnings: calculateCookEarnings(total * 100) / 100 }, { pdpa: true });

    carts = { items: [], cookId: null };
    return { order, earningsPreview: calculateCookEarnings(total * 100) / 100 };
  },

  // Order state transitions (cook + customer) - FULL rule enforcement
  transitionOrder(orderId: string, to: SHCOrderStatus): { order: any; error?: any } {
    seed();
    checkRateLimit(currentUser.id, 'transitionOrder');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx < 0) return { order: null, error: createSHCError('SHC-ORDER-001', 'Order not found') };

    const from = orders[idx].shc_status as SHCOrderStatus;
    const before = { ...orders[idx] };
    if (!canTransition(from, to)) {
      const err = createSHCError('SHC-ORDER-001', `Invalid transition ${from} → ${to}. See 09-order-state.md`);
      auditLog(currentUser.id, 'order.transition.rejected', before, before, { to, error: err.code });
      return { order: orders[idx], error: err };
    }

    // Additional rule: compliance for cook accept
    if (to === 'accepted' && currentUser.role === 'cook') {
      // mock compliance check always ok for demo
    }

    orders[idx].shc_status = to;
    orders[idx].updated_at = new Date().toISOString();
    if (to === 'paid') orders[idx].address_released_at = undefined; // released later by "system"

    // Simulate address release on paid -> accepted-ish
    if (from === 'paid' && to === 'accepted') {
      orders[idx].address_released_at = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    }

    // Phase 9 Growth: earn Home Credits (5% of total as units) on completed/collected. 12m expiry stub (not enforced in demo). Award to customer. Add notif for bell.
    if ((to === 'collected' || to === 'completed') && orders[idx].customer_id && orders[idx].total) {
      const cust = orders[idx].customer_id;
      const earned = Math.max(1, Math.floor(orders[idx].total * 0.05 * 4)); // 5% of total -> credit units (4u ~ S$1), min1
      userCredits[cust] = (userCredits[cust] || 0) + earned;
      lifetimeSpend[cust] = (lifetimeSpend[cust] || 0) + (orders[idx].total || 0);
      notifications.unshift({ id: 'n' + Date.now(), type: 'credit', body: `+${earned} Home Credits earned on ${orders[idx].id} (5% of S$${orders[idx].total}). Redeem at checkout for future feasts.`, created_at: new Date().toISOString() });
    }
    // In-app notif bell events from order states (Phase 7 polish)
    if (['paid', 'accepted', 'ready_for_collection', 'collected'].includes(to)) {
      notifications.unshift({ id: 'n' + Date.now(), type: 'order', body: `Order ${orderId} → ${to}. ${to === 'ready_for_collection' ? 'HDB collection ready — address in chat.' : ''}`, created_at: new Date().toISOString() });
    }

    const after = orders[idx];
    auditLog(currentUser.id, 'order.transition', before, after, { money: { total: after.total } });
    return { order: orders[idx] };
  },

  getOrder(id: string) { seed(); return orders.find(o => o.id === id); },
  listOrdersForCustomer() { seed(); return orders.filter(o => o.customer_id === currentUser.id); },
  listOrdersForCook() { seed(); return orders.filter(o => o.cook_id === currentUser.id); },

  // Chat (polling mock)
  getMessages(orderId: string) { seed(); return messages[orderId] || []; },
  sendMessage(orderId: string, body: string, from: 'customer' | 'cook' = 'customer') {
    seed();
    if (!messages[orderId]) messages[orderId] = [];
    const msg = { id: 'm' + Date.now(), order_id: orderId, sender_actor: from, body, created_at: new Date().toISOString() };
    messages[orderId].push(msg);
    // auto reply for demo (cook or customer)
    if (from === 'customer') {
      setTimeout(() => {
        if (messages[orderId]) {
          messages[orderId].push({ id: 'm' + (Date.now() + 1), order_id: orderId, sender_actor: 'cook', body: 'Noted, thank you! See you at collection in HDB.', created_at: new Date().toISOString() });
        }
      }, 650);
    }
    return msg;
  },

  // Cook listings / wizard
  createListing(input: { name: string; price: number; min_qty: number; occasion_tags: string[]; ingredients: any[]; allergen_tiers: any; cuisine: string; heritage_note?: string }) {
    seed();
    checkRateLimit(currentUser.id, 'createListing');
    const before = { productsLen: products.length };
    const id = 'prod_' + Date.now().toString(36);
    const meta = {
      product_id: id,
      cook_id: currentUser.id,
      cuisine: input.cuisine,
      occasion_tags: input.occasion_tags,
      allergen_tiers: input.allergen_tiers,
      halal: false,
      calories: 420,
      calories_confidence: 'category' as const,
      ingredients: input.ingredients,
      min_qty: input.min_qty,
    };
    shcProductMetaSchema.parse(meta);
    // NOTE: cook_id provided by ...meta (no explicit duplicate key in object literal)
    // Phase 7/9: AI calorie estimation stub (from ingredients, per DECISION_TREES/ai-calorie-estimation.md) — green/amber badge in UI
    let aiCal: any = { calories: meta.calories || 420, confidence: (meta.calories_confidence || 'category') as 'category'|'full', source: 'cook-provided' };
    if (featureFlags.find(f => f.key === 'ai_calorie_stub')?.enabled && input.ingredients?.length) {
      aiCal = this.estimateCaloriesAI(input.ingredients);
    }
    const prod = { id, name: input.name, price: input.price, cook_name: currentUser.name, ...meta, calories: aiCal.calories, calories_confidence: (aiCal.confidence || 'category') as 'category'|'full', heritage_note: input.heritage_note || 'Family recipe from our HDB kitchen.', ai_source: aiCal.source };
    products.push(prod);
    availabilities.push({ product_id: id, portions_per_day: 10, collection_days: [1,2,3,4,5], time_slots: ['17:00-18:00', '18:00-19:00'], paused: false });
    auditLog(currentUser.id, 'listing.create', before, { id, price: input.price });
    return prod;
  },

  updateCookAvailability(productId: string, paused: boolean) {
    const a = availabilities.find(av => av.product_id === productId);
    if (a) a.paused = paused;
    return a;
  },

  // Earnings / compliance stubs
  getEarnings() {
    seed();
    const myOrders = orders.filter(o => o.cook_id === currentUser.id && o.shc_status === 'completed');
    const total = myOrders.reduce((s, o) => s + (o.total || 0), 0);
    return { thisWeek: Math.floor(total * 0.85), projectedPayout: Math.floor(total * 0.85), orders: myOrders.length };
  },

  uploadComplianceStub(type: 'sfa' | 'wsq', fileName: string) {
    return { ok: true, type, fileName, verified_at: null, note: 'Stub — will be verified by Ops. SFA/WSQ required before accept orders.' };
  },

  // === Phase 7-9 Growth/Differentiation (mock only; will swap to real /store/shc in backend wiring) ===
  // Home Credits (Phase 9): balance, tiers (Bronze/Silver/Gold on lifetime), earn on complete (in transition), redeem at checkout
  getCredits() {
    seed();
    const bal = userCredits[currentUser.id] || 42;
    const spend = lifetimeSpend[currentUser.id] || 320;
    const tier = spend > 1200 ? 'Gold' : spend > 450 ? 'Silver' : 'Bronze';
    return { balance: bal, lifetimeSpend: spend, tier, expiryNote: 'Credits expire 12 months from earn. Redeem for S$ value at checkout.' };
  },
  redeemCredits(amount: number) {
    seed();
    const bal = userCredits[currentUser.id] || 0;
    const use = Math.min(amount, bal, 200); // cap demo
    userCredits[currentUser.id] = bal - use;
    notifications.unshift({ id: 'n' + Date.now(), type: 'credit', body: `Redeemed ${use} credits (S$${(use/4).toFixed(0)} value). Applied to next order.`, created_at: new Date().toISOString() });
    return { ok: true, used: use, remaining: userCredits[currentUser.id] };
  },

  // Recipe Request & Bidding (Phase 8 diff): customer "Request Custom Dish", cook bids/accept to create order stub
  createRequest(input: { body: string; youtube_url?: string; party_size?: number; budget_cents?: number; date?: string }) {
    seed();
    const req: SHCRequest = {
      id: 'req_' + Date.now().toString(36),
      customer_id: currentUser.id,
      body: input.body,
      youtube_url: input.youtube_url,
      party_size: input.party_size,
      budget_cents: input.budget_cents,
      date: input.date,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    try { shcRequestSchema.parse(req); } catch (e) { /* stub */ }
    requests.unshift(req);
    notifications.unshift({ id: 'n' + Date.now(), type: 'request', body: `Request posted: ${input.body.slice(0,40)}... Cooks can now bid on Collaboration Board.`, created_at: new Date().toISOString() });
    return req;
  },
  listOpenRequests() { seed(); return requests.filter(r => r.status === 'open' || r.status === 'bidding'); },
  createBid(requestId: string, priceCents: number, message?: string) {
    seed();
    const bid: SHCBid = {
      id: 'bid_' + Date.now().toString(36),
      request_id: requestId,
      cook_id: currentUser.id,
      price_cents: priceCents,
      message: message || 'Happy to cook this SG family favourite in my HDB kitchen with heritage recipe.',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    try { shcBidSchema.parse(bid); } catch {}
    bids.push(bid);
    // update req status
    const req = requests.find(r => r.id === requestId); if (req) req.status = 'bidding';
    return bid;
  },
  getBids(requestId?: string) { seed(); return requestId ? bids.filter(b => b.request_id === requestId) : bids; },
  acceptBid(bidId: string) {
    seed();
    const b = bids.find(bb => bb.id === bidId);
    if (!b) return { ok: false };
    b.status = 'accepted';
    const req = requests.find(r => r.id === b.request_id);
    if (req) req.status = 'matched';
    // Stub: create a simple order from accepted bid (customer side will see)
    const orderId = `SHC-2026-B${String(100 + orders.length)}`;
    const order = {
      id: orderId,
      cook_id: b.cook_id,
      items: [{ name: req?.body?.slice(0,30) || 'Custom Request Dish', qty: req?.party_size || 4, price: Math.round(b.price_cents / 100) }],
      total: Math.round(b.price_cents / 100),
      shc_status: 'paid' as SHCOrderStatus,
      collection_date: req?.date || '2026-07-01',
      collection_slot: '18:00-19:00',
      customer_id: req?.customer_id || currentUser.id,
      created_at: new Date().toISOString(),
    };
    orders.unshift(order);
    messages[orderId] = [{ id: 'mb', order_id: orderId, sender_actor: 'cook', body: 'Bid accepted! Preparing your custom dish with family recipe. See you at HDB collection.', created_at: new Date().toISOString() }];
    notifications.unshift({ id: 'n' + Date.now(), type: 'bid', body: `Bid accepted for request — order ${orderId} created.`, created_at: new Date().toISOString() });
    return { ok: true, order };
  },

  // Heritage Recipe Archive (Phase 8): permanent on cook profile (even inactive). Add/edit from cook side. Seed + new.
  getHeritageArchive(cookId: string) {
    seed();
    return heritageArchives[cookId] || [];
  },
  addHeritageEntry(cookId: string, entry: { title: string; story: string; photo_stub?: string }) {
    seed();
    if (!heritageArchives[cookId]) heritageArchives[cookId] = [];
    const newEntry = { id: 'ha' + Date.now(), ...entry, published: true, created_at: new Date().toISOString() };
    heritageArchives[cookId].unshift(newEntry);
    return newEntry;
  },

  // Corporate/Group stub (Phase 8): flag in checkout + multi note + invoice stub
  flagCorporateOrder(note: string) {
    return { ok: true, invoiceStub: `INVOICE-SHC-${Date.now()}: Corporate/Group — ${note}. GST applicable per rules. Contact ops for bulk.`, note };
  },

  // AI calorie stub (Phase 7/9, from DECISION_TREES): mock "AI" estimate in product create from ingredients list. Green/amber badge.
  estimateCaloriesAI(ingredients: Array<{name: string; quantity: number; unit: string}>) {
    seed();
    // Simple deterministic stub: base + rough per item (SG ingredients). full if >=5 items.
    let base = 320;
    ingredients.forEach(ing => {
      const n = ing.name.toLowerCase();
      if (n.includes('rice') || n.includes('coconut')) base += 80;
      if (n.includes('prawn') || n.includes('chicken') || n.includes('ayam')) base += 45;
      if (n.includes('nut') || n.includes('keluak') || n.includes('peanut')) base += 30;
      if (n.includes('potato')) base += 25;
    });
    const conf = ingredients.length >= 5 ? 'full' : 'category';
    const cals = Math.min(650, Math.max(280, Math.round(base)));
    return { calories: cals, confidence: conf, source: 'AI stub (ingredients vision+LLM mock per ai-calorie-estimation.md)' };
  },

  // Photo quality tips (Phase 7): 3 tips stub (no real AI yet)
  getPhotoTips() {
    return [
      'Natural HDB window light — avoid flash to capture real steam and rempah gloss.',
      'Use banana leaf or traditional bowl + 1-2 props (cucumber/egg) for authentic SG scale.',
      'Include close-up texture shot (sambal, paste) + hero plated. Boosts search & trust.',
    ];
  },

  // In-app notifications stub (Phase 7 polish): recent events (order, credit, request, bid)
  getNotifications() { seed(); return notifications.slice(0, 8); },

  // Expo push registration stub (matches shc_cook; stores on demo cook for subscriber sim push)
  registerPushToken(cookId: string, token: string) {
    seed();
    const c = cooks.find((ck: any) => ck.id === cookId || ck.slug === cookId);
    if (c) (c as any).expo_push_token = token;
    console.log(`[mock] registered expo_push_token for ${cookId} (sim; subscriber will use for events like ready_for_collection)`);
    return { success: true };
  },

  // Feature flags (use shc_feature_flag + platform_stat if needed)
  getFeatureFlags() { seed(); return featureFlags; },
  isFeatureEnabled(key: string) { seed(); return !!featureFlags.find(f => f.key === key)?.enabled; },

  // Enhanced checkout support for credits redeem + corporate (called from UI)
  checkoutWithCredits(allergenAck: boolean, collection: { date: string; slot: string }, creditsToApply = 0, isCorporate = false) {
    seed();
    if (creditsToApply > 0 && featureFlags.find(f => f.key === 'home_credits')?.enabled) {
      const redeemed = this.redeemCredits(creditsToApply);
      // In real would adjust total here; for demo we log + reduce effective in caller UI
      console.log('[mock] credits applied', redeemed);
    }
    if (isCorporate && featureFlags.find(f => f.key === 'corporate_orders')?.enabled) {
      this.flagCorporateOrder('Multi-dish corporate / group order from checkout');
    }
    return this.checkout(allergenAck, collection);
  },
};

export type MockAPI = typeof api;

// Helper for hooks: simulate network delay + error codes
export async function mockFetch<T>(fn: () => T, delay = 120): Promise<T> {
  await new Promise(r => setTimeout(r, delay));
  try {
    return fn();
  } catch (e: any) {
    if (e.code) throw e;
    throw createSHCError('SHC-GENERIC-001', e.message || 'Mock error');
  }
}

export default api;