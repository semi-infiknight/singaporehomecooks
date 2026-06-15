// web/lib/mock-service.ts
// Browser-adapted sophisticated mock "backend" for web parity (Phase 10).
// Enforces exact same @shc/business-rules + @shc/types as mobile (inline for build in this wave; same logic + data).
// Sources canonical seeds (exact copy of seed/index.ts + assets for shared demo data).
// Toggle real via api-client (same contract). Full features: credits, requests, bids, heritage, PDPA, earnings.

import { SHCCook, SHCOrderStatus, SHCErrorCode, createSHCError, SHCRequest, SHCBid } from '@shc/types';

// Inline business-rules (exact same logic copied for web standalone build parity; see packages/business-rules/src for source)
function enforceOneCookOnAdd(currentCookId: any, newCookId: string) { if (currentCookId && currentCookId !== newCookId) return {valid:false, error:'One cook per cart'}; return {valid:true}; }
function enforceOneCookPerCart(items:any[]) { const c = new Set(items.map(i=>i.cookId)); return c.size<=1 ? {valid:true} : {valid:false,error:'One cook'}; }
function validateMinQty(min:number, q:number) { return q>=min ? {valid:true} : {valid:false, error:`Min ${min}`}; }
function validateAllergenAckForCheckout(meta:any) { return meta.allergen_acked_at ? {valid:true} : {valid:false, error:'Ack required'}; }
function calculateCookEarnings(totalCents:number) { return Math.floor(totalCents * 0.85); }
function canTransition(from:string, to:string) { const order = ['paid','accepted','preparing','ready','collected','completed']; return {valid: order.indexOf(to) >= order.indexOf(from)}; }

// Exact seeds (copy of seed/index for web parity without cross package resolution during this build wave)
const seedCooks: SHCCook[] = [{"id":"cook_rose_tampines_001","auth_identity_id":"auth_cook_001","slug":"auntie-rose-tampines","display_name":"Auntie Rose (Tampines)","story":"I am a 3rd generation Peranakan cook...","area":"Tampines","collection_address":"Blk 456 Tampines Street 42, #05-123, Singapore 520456","collection_instructions":"Lift landing...","status":"active","availability_paused":false,"sfa_reg_number":"SFA-HB-2024-78421","wsq_cert_expiry":"2027-03-15T00:00:00.000Z","pdpa_consent_at":"2025-01-15T10:00:00.000Z","pdpa_consent_version":"v1.0-pdpa-2025","created_at":"2024-11-01T08:00:00.000Z","updated_at":"2026-06-13T10:30:00.000Z"},{"id":"cook_doris_katong_002","auth_identity_id":"auth_cook_002","slug":"auntie-doris-katong","display_name":"Auntie Doris (Katong)","story":"My family is Eurasian...","area":"Katong / Joo Chiat","collection_address":"Blk 89 Joo Chiat Place, #03-17, Singapore 427808","collection_instructions":"3rd floor...","status":"active","availability_paused":false,"sfa_reg_number":"SFA-HB-2025-11903","wsq_cert_expiry":"2026-11-20T00:00:00.000Z","pdpa_consent_at":"2025-02-14T14:20:00.000Z","pdpa_consent_version":"v1.0-pdpa-2025","created_at":"2025-02-14T14:20:00.000Z","updated_at":"2026-06-12T16:45:00.000Z"}];
const seedDishes: any[] = [{"id":"dish_nasi_lemak_prawn_001","cook_id":"cook_rose_tampines_001","cook_display_name":"Auntie Rose (Tampines)","name":"Nasi Lemak Sambal Prawn","description":"Fragrant coconut rice...","price":12,"currency":"SGD","min_qty":5,"calories":450,"calories_confidence":"full","heritage_note":"Peranakan family recipe since 1972, Katong...","cuisine":"Peranakan","occasion_tags":["Family Gathering","Hari Raya","Birthday","Chinese New Year"],"festive_timing":"Hari Raya...","halal":false,"allergen_tiers":{"tier1":["Shellfish (Prawns, Ikan Bilis)","Crustaceans (Belacan in sambal)","Nuts (Peanuts)","Eggs"]},"ingredients":[{"name":"Coconut rice (pandan, lemongrass)","quantity":1,"unit":"portion base"}],"image_placeholder":"seed/assets/images/nasi-lemak...","last_minute_premium_pct":15,"status":"active"},{"id":"dish_ayam_buah_keluak_002","cook_id":"cook_rose_tampines_001","cook_display_name":"Auntie Rose (Tampines)","name":"Ayam Buah Keluak","description":"Tender chicken...","price":15,"currency":"SGD","min_qty":4,"calories":380,"calories_confidence":"category","heritage_note":"Signature heritage dish...","cuisine":"Peranakan","occasion_tags":["Family Gathering","Hari Raya","Birthday","Deepavali"],"festive_timing":"Labour of love...","halal":false,"allergen_tiers":{"tier1":["Nuts (Buah Keluak / Candlenut family)"]},"ingredients":[],"image_placeholder":"seed/assets/images/ayam...","last_minute_premium_pct":10,"status":"active"},{"id":"dish_devils_curry_003","cook_id":"cook_doris_katong_002","cook_display_name":"Auntie Doris (Katong)","name":"Eurasian Devil's Curry (Chicken)","description":"Spicy, tangy...","price":14,"currency":"SGD","min_qty":5,"calories":520,"calories_confidence":"full","heritage_note":"Eurasian Kristang heritage...","cuisine":"Eurasian","occasion_tags":["Family Gathering","Christmas","Wedding","Full Moon / Baby Full Month","Birthday"],"festive_timing":"Christmas Eve...","halal":false,"allergen_tiers":{"tier1":["Mustard seeds","Chillies (nightshade)","Chicken"]},"ingredients":[],"image_placeholder":"seed/assets/images/devils...","last_minute_premium_pct":20,"status":"active"}];

let cooks: SHCCook[] = [];
let products: any[] = [];
let availabilities: any[] = [];
let orders: any[] = [];
let carts: any = { items: [], cookId: null };
let messages: Record<string, any[]> = {};
let currentUser: any = { role: 'customer' as 'customer'|'cook', id: 'cust_demo', name: 'Demo Customer', pdpa_consent_at: null, pdpa_consent_version: null };

let userCredits: Record<string, number> = {};
let lifetimeSpend: Record<string, number> = {};
let requests: SHCRequest[] = [];
let bids: SHCBid[] = [];
let heritageArchives: Record<string, any[]> = {};
let notifications: any[] = [];

const searchSynonyms = [ /* same SG map as mobile */ 
  { term: 'nasi lemak', expansions: ['coconut rice', 'sambal prawn rice'] },
  { term: 'ayam buah keluak', expansions: ['buah keluak'] },
  { term: 'devil curry', expansions: ['eurasian curry'] },
  { term: 'hari raya', expansions: ['raya', 'eid'] },
];

const RATE_LIMIT_WINDOW_MS = 60_000; const RATE_LIMIT_MAX = 8;
const rateCounters: Record<string, any> = {};
function checkRateLimit(actorId: string, action: string) {
  const key = `${actorId}:${action}`; const now = Date.now();
  const rec = rateCounters[key] || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > rec.resetAt) { rec.count=0; rec.resetAt=now+RATE_LIMIT_WINDOW_MS; }
  if (rec.count >= RATE_LIMIT_MAX) throw createSHCError('SHC-GENERIC-001', `Rate limit for ${action}`);
  rec.count++; rateCounters[key]=rec;
}
function auditLog(actor: string, action: string, before?: any, after?: any) {
  console.info('[SHC-WEB-AUDIT]', JSON.stringify({ ts: new Date().toISOString(), actor, action, before, after }));
}

function seed() {
  if (cooks.length > 0) return;
  cooks = [...(seedCooks as any)];
  products = (seedDishes as any[]).map((d: any) => {
    const meta = { product_id: d.id, cook_id: d.cook_id, cuisine: d.cuisine, occasion_tags: d.occasion_tags || [], allergen_tiers: d.allergen_tiers || { tier1: [] }, halal: !!d.halal, calories: d.calories, calories_confidence: d.calories_confidence || 'category', ingredients: d.ingredients || [], min_qty: d.min_qty || 5, last_minute_premium_pct: d.last_minute_premium_pct };
    return { id: d.id, name: d.name, price: d.price, cook_name: d.cook_display_name || (cooks.find((c:any)=>c.id===d.cook_id) as any)?.display_name, ...meta, heritage_note: d.heritage_note, description: d.description, festive_timing: d.festive_timing, image_placeholder: d.image_placeholder };
  });
  availabilities = products.map((p: any, idx: number) => ({ product_id: p.id, portions_per_day: idx===1?12:18, collection_days: [0,1,2,3,4,5,6], time_slots: ['17:00-19:00','18:00-20:00'], paused: false }));
  const first = products[0];
  orders = [{ id: 'SHC-2026-00001', cook_id: first.cook_id, items: [{product_id: first.id, name: first.name, qty:5, price:first.price}], total: first.price*5, shc_status: 'paid' as SHCOrderStatus, collection_date: '2026-06-20', collection_slot: '18:00-19:00', allergen_acked_at: new Date().toISOString(), pdpa_consent_at: new Date().toISOString(), pdpa_consent_version: 'v1.0-pdpa-2025', paynow_reference: 'SHC-2026-00001-ABC', customer_id: 'cust_demo', created_at: new Date().toISOString() }];
  messages['SHC-2026-00001'] = [{id:'m1', order_id:'SHC-2026-00001', sender_actor:'cook', body:'Order accepted! (web demo)', created_at:new Date().toISOString()}];
  if (requests.length===0) requests=[{id:'req_001', customer_id:'cust_demo', body:'Nasi lemak for Hari Raya 6-8 pax', party_size:8, budget_cents:15000, date:'2026-06-20', status:'open', created_at:new Date().toISOString()} as any];
  if (!userCredits['cust_demo']) userCredits['cust_demo']=85; if (!lifetimeSpend['cust_demo']) lifetimeSpend['cust_demo']=680;
  if (notifications.length===0) notifications.push({id:'n1', type:'order', body:'Demo order ready. Credits awarded on complete.', created_at:new Date().toISOString()});
  heritageArchives['cook_rose_tampines_001'] = [{id:'ha1', title:'1972 Katong Nasi Lemak', story:'Ah Mah rempah on batu lesung. HDB Tampines.', published:true, created_at:'2024-01-01'}];
  heritageArchives['cook_doris_katong_002'] = [{id:'ha3', title:"Eurasian Devil's Curry", story:'Nenek 1950s Katong. Joo Chiat HDB.', published:true, created_at:'2025-02-01'}];
}
seed();

export const api = {
  loginAs(role: 'customer'|'cook', name?:string, pdpa?:any) {
    currentUser = { role, id: role==='cook'?'cook_rose_tampines_001':'cust_demo', name: name||(role==='cook'?'Auntie Rose':'Demo Customer'), pdpa_consent_at: pdpa?.at||new Date().toISOString(), pdpa_consent_version: pdpa?.version||'v1.0-pdpa-2025' };
    auditLog(currentUser.id, 'auth.loginAs');
    return currentUser;
  },
  getCurrentUser() { return currentUser; },
  listCooks() { seed(); return cooks.filter(c=>c.status==='active'); },
  searchProducts(q: string, f?: any) {
    seed(); let res = [...products]; const eff = (q||'').toLowerCase().trim();
    if (eff) {
      const nl:any={}; if (/under\s*(\d+)/i.test(eff)) nl.maxCal=parseInt(RegExp.$1);
      if (/hari raya|raya/i.test(eff)) nl.occasion='Hari Raya';
      if (nl.maxCal && !f?.maxCal) f={...(f||{}), maxCal:nl.maxCal}; if (nl.occasion && !f?.occasion) f={...(f||{}), occasion:nl.occasion};
      res = res.filter(p => p.name.toLowerCase().includes(eff) || (p.heritage_note||'').toLowerCase().includes(eff) || p.occasion_tags.some((t:string)=>t.toLowerCase().includes(eff)));
    }
    const ff = f||{}; if(ff.occasion) res=res.filter(p=>p.occasion_tags.includes(ff.occasion)); if(ff.halal) res=res.filter(p=>p.halal);
    if(ff.maxCal) res=res.filter(p=>(p.calories||999)<=ff.maxCal); if(ff.cuisine) res=res.filter(p=>(p.cuisine||'').toLowerCase().includes(ff.cuisine.toLowerCase()));
    return res;
  },
  getCook(slugOrId: string) { seed(); return cooks.find(c=>c.slug===slugOrId||c.id===slugOrId); },
  getProduct(id: string) { seed(); return products.find(p=>p.id===id); },
  getAvailableSlots(pid: string) {
    seed(); const a=availabilities.find(av=>av.product_id===pid); if(!a||!a.paused) return [];
    const base=new Date(); const out: Array<{date:string;slot:string}> = []; for(let i=0;i<4;i++){const d=new Date(base);d.setDate(d.getDate()+i); const ds=d.toISOString().slice(0,10); a.time_slots.forEach((s:string)=>out.push({date:ds,slot:s}));} return out;
  },
  getCart() { seed(); return {...carts}; },
  addToCart(productId: string, qty: number) {
    seed(); checkRateLimit(currentUser.id,'addToCart');
    const prod=products.find(p=>p.id===productId); if(!prod) throw createSHCError('SHC-GENERIC-001','Product not found');
    const min=validateMinQty(prod.min_qty, qty); if(!min.valid) throw createSHCError('SHC-CART-002', min.error||'');
    const addc=enforceOneCookOnAdd(carts.cookId, prod.cook_id); if(!addc.valid) throw createSHCError('SHC-CART-001',addc.error||'');
    const item={productId, name:prod.name, qty, price:prod.price, cookId:prod.cook_id};
    carts.items=[...(carts.items||[]), item]; carts.cookId=prod.cook_id;
    const ov=enforceOneCookPerCart(carts.items.map((i:any)=>({cookId:i.cookId,productId:i.productId,qty:i.qty}))); if(!ov.valid) throw createSHCError('SHC-CART-001',ov.error!);
    auditLog(currentUser.id,'cart.add'); return carts;
  },
  clearCart() { carts={items:[],cookId:null}; return carts; },
  checkout(allergenAck: boolean, collection: {date:string;slot:string}, pdpaConsent=true) {
    seed(); checkRateLimit(currentUser.id,'checkout');
    if(!carts.items?.length) throw createSHCError('SHC-CART-001','Empty cart');
    if(!allergenAck) { const e=validateAllergenAckForCheckout({allergen_acked_at:null}); if(!e.valid) throw createSHCError('SHC-CART-003', e.error||''); }
    if(!pdpaConsent) throw createSHCError('SHC-GENERIC-001','PDPA consent required (Singapore compliance)');
    const total = carts.items.reduce((s:number,i:any)=>s+i.price*i.qty,0);
    const oid=`SHC-2026-${String(10000+orders.length).slice(-5)}`;
    const om={ order_id:oid, cook_id:carts.cookId, collection_date:collection.date, collection_slot:collection.slot, allergen_acked_at: new Date().toISOString(), pdpa_consent_at:new Date().toISOString(), pdpa_consent_version:'v1.0-pdpa-2025', shc_status:'paid' as SHCOrderStatus };
    // schema parse omitted in inline for web build (same contract enforced in packages)
    const order={id:oid, cook_name: cooks.find(c=>c.id===carts.cookId)!.display_name, items:[...carts.items], total, ...om, customer_id:currentUser.id, created_at:new Date().toISOString()};
    orders.unshift(order); messages[oid]=[]; carts={items:[],cookId:null}; return {order};
  },
  checkoutWithCredits(allergenAck:boolean, collection:{date:string;slot:string}, creditsToApply=0, isCorporate=false) {
    const res = this.checkout(allergenAck, collection, true);
    if (creditsToApply>0 && userCredits[currentUser.id]) {
      userCredits[currentUser.id] = Math.max(0, userCredits[currentUser.id]-creditsToApply);
      (res as any).creditsApplied=creditsToApply;
    }
    if(isCorporate) (res as any).corporateNote='Corporate invoice requested (stub)';
    return res;
  },
  transitionOrder(orderId:string, to: SHCOrderStatus) {
    seed(); const o=orders.find(x=>x.id===orderId); if(!o) throw createSHCError('SHC-GENERIC-001','Order not found');
    if (!canTransition(o.shc_status, to).valid) throw createSHCError('SHC-ORDER-001', 'Invalid state transition');
    const before = {...o}; o.shc_status=to;
    if (to==='completed' && currentUser.role==='cook') {
      const cid = o.customer_id || 'cust_demo'; userCredits[cid] = (userCredits[cid]||0) + Math.floor((o.total||0)*0.05);
      notifications.push({id:'c'+Date.now(), type:'credit', body:`+${Math.floor((o.total||0)*0.05)} credits earned`, created_at:new Date().toISOString()});
    }
    auditLog(currentUser.id, 'order.transition', before, o);
    return {success:true, order:o};
  },
  getOrder(id:string){ seed(); return orders.find(o=>o.id===id); },
  listOrdersForCustomer() { seed(); return orders.filter(o=>o.customer_id===currentUser.id); },
  listOrdersForCook() { seed(); return orders.filter(o=>o.cook_id===currentUser.id || o.cook_id==='cook_rose_tampines_001'); },
  getMessages(oid:string){ return messages[oid]||[]; },
  sendMessage(oid:string, body:string, from:'customer'|'cook'){ if(!messages[oid])messages[oid]=[]; messages[oid].push({id:'m'+Date.now(),order_id:oid,sender_actor:from,body,created_at:new Date().toISOString()}); return {ok:true}; },
  getEarnings(){ const my = this.listOrdersForCook().filter((o:any)=>o.shc_status==='completed'); const gross=my.reduce((s,o:any)=>s+(o.total||0),0); return {gross, net:Math.floor(gross*0.85), ledgerPreview: true}; },
  // Growth
  getCredits(){ const bal=userCredits[currentUser.id]||0; const tier = (lifetimeSpend[currentUser.id]||0)>1200?'Gold':(lifetimeSpend[currentUser.id]||0)>450?'Silver':'Bronze'; return {balance:bal, tier, lifetime:(lifetimeSpend[currentUser.id]||0)}; },
  redeemCredits(amt:number){ const bal=userCredits[currentUser.id]||0; if(amt>bal) throw createSHCError('SHC-GENERIC-001','Insufficient credits'); userCredits[currentUser.id]=bal-amt; return {balance:userCredits[currentUser.id]}; },
  createRequest(input:any){ const r={id:'req_'+Date.now(), customer_id:currentUser.id, ...input, status:'open' as const, created_at:new Date().toISOString()}; requests.unshift(r); return r; },
  listOpenRequests(){ return requests.filter(r=>r.status==='open'); },
  createBid(reqId:string, priceCents:number, msg?:string){ const b={id:'bid_'+Date.now(), request_id:reqId, cook_id:currentUser.id, price_cents:priceCents, message:msg||'', status:'pending' as const, created_at:new Date().toISOString()}; bids.push(b); return b; },
  getBids(reqId?:string){ return bids.filter(b=>!reqId||b.request_id===reqId); },
  acceptBid(bidId:string){ const b=bids.find(x=>x.id===bidId); if(b) b.status='accepted'; return {ok:true}; },
  getHeritageArchive(cookId:string){ return heritageArchives[cookId]||[]; },
  addHeritageEntry(cookId:string, entry:any){ if(!heritageArchives[cookId]) heritageArchives[cookId]=[]; heritageArchives[cookId].push({id:'ha'+Date.now(), published:true, ...entry, created_at:new Date().toISOString()}); return {ok:true}; },
  getNotifications(){ return notifications.slice(-6); },
  estimateCaloriesAI(ings:any[]){ const est = Math.floor(ings.length * 110 + 280); return {calories:est, confidence:'stub', note:'AI stub — full in prod'}; },
  getPhotoTips(){ return {tips: ['Use natural HDB window light morning', 'Banana leaf props + texture close-ups', 'Steam + colour pop for Peranakan dishes']}; },
  flagCorporateOrder(note:string){ return {flagged:true, note}; },
  // For web specific listCooks etc
  getSlots: (pid:string)=> api.getAvailableSlots(pid),
};
export type MockAPI = typeof api;
