// apps/web/lib/api-client.ts
// TanStack Query ready browser API client for web (Phase 10).
// Exact parity with mobile/api-client + mock-service: real Medusa toggle (localhost:9000 /store/shc), full fallback to mock enforcing rules + seeds.
// Supports all growth (credits, bids, heritage, PDPA). SHCError surface. Use same env pattern.

import { api as mockApi } from './mock-service';
import { SHCError, createSHCError, SHCErrorCode } from '@shc/types';
import { z } from 'zod';

let USE_REAL = (typeof window !== 'undefined' && (window as any).__SHC_USE_REAL__) || (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_USE_REAL_MEDUSA === 'true');
export function setUseRealMedusa(enabled: boolean) { USE_REAL = !!enabled; if (typeof window!=='undefined') (window as any).__SHC_USE_REAL__ = USE_REAL; console.info('[web-api] real Medusa:', USE_REAL); }
export function getUseRealMedusa() { return USE_REAL; }

const MEDUSA_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SHC_API_BASE) || 'http://localhost:9000';
const PUB_KEY = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) || 'pk_demo_publishable_key_from_bootstrap';

const CooksSchema = z.object({ cooks: z.array(z.any()) });
const ProductsSchema = z.object({ products: z.array(z.any()) });

async function tryReal<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T | null> {
  if (!USE_REAL) return null;
  try {
    const res = await fetch(`${MEDUSA_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(PUB_KEY ? { 'x-publishable-api-key': PUB_KEY } : {}), ...init?.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (schema) { const p = schema.safeParse(json); if (!p.success) { console.warn('real zod fail, fallback', p.error); return null; } return p.data; }
    return json;
  } catch (e) { console.info('[web-api] real fetch failed, fallback mock:', (e as Error).message); return null; }
}

export const shcApi = mockApi;

// Typed callers with real fallback
export async function getCooks() {
  const r = await tryReal('/store/shc/cooks', {method:'GET'}, CooksSchema as any); if (r) return (r as any).cooks || [];
  return mockApi.listCooks();
}
export async function searchProducts(q='', f?:any) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''; 
  const r = await tryReal(`/store/shc/products${qs}`, {method:'GET'}, ProductsSchema as any); if(r) return (r as any).products||[];
  return mockApi.searchProducts(q, f);
}
export async function getCookBySlug(slug:string) { return mockApi.getCook(slug); }
export async function getProduct(id:string) { return mockApi.getProduct(id); }
export async function getSlots(pid:string) { return mockApi.getAvailableSlots(pid); }

export async function addToCart(pid:string, qty:number) { return mockApi.addToCart(pid, qty); }
export async function getCart() { return mockApi.getCart(); }
export async function clearCart() { return mockApi.clearCart(); }

export async function checkout(ack:boolean, coll:{date:string;slot:string}, pdpa=true) {
  const real = await tryReal('/store/shc/carts/demo-complete', {method:'POST', body:JSON.stringify({allergen_acked:ack, collection_date:coll.date, collection_slot:coll.slot, pdpa_consent:pdpa})});
  if (real) return real;
  return mockApi.checkout(ack, coll, pdpa);
}
export async function checkoutWithCredits(ack:boolean, coll:{date:string;slot:string}, credits=0, corporate=false) {
  const real = await tryReal('/store/shc/checkout-credits', {method:'POST', body:JSON.stringify({allergenAck:ack,collection:coll,creditsToApply:credits,isCorporate:corporate})});
  if(real) return real;
  return (mockApi as any).checkoutWithCredits(ack, coll, credits, corporate);
}

export async function transitionOrder(oid:string, to:any) { return mockApi.transitionOrder(oid, to); }
export async function getOrder(id:string) { return mockApi.getOrder(id); }
export async function getMyOrders(role:'customer'|'cook') { 
  const r = await tryReal(`/store/shc/orders?${role}_id=demo`, {method:'GET'});
  if (r && (r as any).orders) return (r as any).orders;
  return role==='cook' ? mockApi.listOrdersForCook() : mockApi.listOrdersForCustomer();
}
export async function getMessages(oid:string){return mockApi.getMessages(oid);}
export async function sendMessage(oid:string, body:string, from:'customer'|'cook'){return mockApi.sendMessage(oid,body,from);}

export async function getEarnings() { return mockApi.getEarnings(); }
export async function getCredits() { return mockApi.getCredits(); }
export async function redeemCredits(a:number){ return mockApi.redeemCredits(a); }
export async function createRequest(i:any){return mockApi.createRequest(i);}
export async function listOpenRequests(){return mockApi.listOpenRequests();}
export async function createBid(rid:string,pc:number,m?:string){return mockApi.createBid(rid,pc,m);}
export async function getBids(rid?:string){return mockApi.getBids(rid);}
export async function acceptBid(bid:string){return mockApi.acceptBid(bid);}
export async function getHeritageArchive(cid:string){return mockApi.getHeritageArchive(cid);}
export async function addHeritageEntry(cid:string,e:any){return mockApi.addHeritageEntry(cid,e);}
export async function getNotifications(){return mockApi.getNotifications();}
export async function estimateCaloriesAI(ings:any[]){return mockApi.estimateCaloriesAI(ings);}
export async function getPhotoTips(){return mockApi.getPhotoTips();}
export async function flagCorporateOrder(n:string){return mockApi.flagCorporateOrder(n);}

export async function createCookListing(input:any){ return (mockApi as any).createListing ? (mockApi as any).createListing(input) : {id:'new-'+Date.now(), ...input}; } // stub

export async function loginAs(role:'customer'|'cook', name?:string, pdpa?:any) { return mockApi.loginAs(role,name,pdpa); }
export function getCurrentUser() { return mockApi.getCurrentUser(); }

export async function simulatePaymentConfirm(oid:string, ref:string) {
  const r = await tryReal('/admin/shc/payment-confirm', {method:'POST', body:JSON.stringify({order_id:oid, paynow_reference:ref})});
  if(r) return r; return {success:true, note:'sim local web'};
}

export { createSHCError } from '@shc/types';
export type { SHCError, SHCErrorCode } from '@shc/types';
