/**
 * Singapore Home Cooks — Seed Data (Typed Exports)
 *
 * Canonical rich seed objects. Mobile mocks, Medusa bootstrap, tests, and scripts
 * should import from here for exact same data.
 *
 * JSON in seed/assets/ is the editable source (for Content Track + founders).
 * This file is the runtime/TS-friendly mirror (kept in sync via scripts/seed.ts validation).
 *
 * Types drawn from @shc/types where possible (cook, product-meta).
 * Extended for full heritage display (descriptions, HDB notes, festive, image notes).
 *
 * Run `npx tsx scripts/seed.ts --validate` after editing to keep in sync.
 */

import type { SHCCook, SHCProductMeta } from '@shc/types';

// --- Cooks (matches shcCookSchema + rich story) ---
export const seedCooks: SHCCook[] = [
  {
    id: 'cook_rose_tampines_001',
    auth_identity_id: 'auth_cook_001',
    slug: 'auntie-rose-tampines',
    display_name: 'Auntie Rose (Tampines)',
    story: "I am a 3rd generation Peranakan cook from the Katong lineage. My grandmother started cooking these recipes in her Katong shophouse kitchen in 1972, using fresh prawns from the market every morning and grinding rempah by hand on the batu lesung. When the family moved to a 4-room HDB in Tampines in the early 1980s, the recipes came with us — the same love, the same care, now in a modern HDB kitchen overlooking the park connector. I specialise in Nyonya dishes for family gatherings, Hari Raya, Chinese New Year, and birthdays. Every dish carries the story of my Ah Mah and the women before her. I cook only what I would serve my own grandchildren. Collection from Blk 456 Tampines Street 42, #05-123. Shoes off at the door, please — it is still a home.",
    area: 'Tampines',
    collection_address: 'Blk 456 Tampines Street 42, #05-123, Singapore 520456',
    collection_instructions: 'Lift landing on 5th floor. Call or WhatsApp 9654 3210 when you arrive (15 min early is fine). Please remove shoes at the door. Void deck parking available. Young grandchildren often napping — quiet voices appreciated. Reusable containers welcome; I provide sturdy takeaway boxes otherwise.',
    status: 'active',
    availability_paused: false,
    sfa_reg_number: 'SFA-HB-2024-78421',
    wsq_cert_expiry: '2027-03-15T00:00:00.000Z',
    pdpa_consent_at: '2025-01-15T10:00:00.000Z',
    pdpa_consent_version: 'v1.0-pdpa-2025',
    created_at: '2024-11-01T08:00:00.000Z',
    updated_at: '2026-06-13T10:30:00.000Z',
  },
  {
    id: 'cook_doris_katong_002',
    auth_identity_id: 'auth_cook_002',
    slug: 'auntie-doris-katong',
    display_name: 'Auntie Doris (Katong)',
    story: "My family is Eurasian — a beautiful mix of Portuguese, Dutch, Malay, and Chinese roots that has lived in Katong for over 100 years. My grandmother (Nenek) cooked for British families in the 1950s and passed down her Devil's Curry, Galinha Assam, and sugee cake recipes to my mother and then to me. We moved from a landed house to Blk 89 Joo Chiat Place HDB in the 1990s but the kitchen rituals stayed: the pounding of spices, the slow vinegar braise, the festive spreads for Christmas, weddings, and Full Moon parties. I am 2nd generation in this HDB but the heritage is deep. I cook with heart for occasions that matter — and I always have time to tell you the story behind each dish. Collection from my Katong home kitchen. You will smell the rempah before you reach the lift.",
    area: 'Katong / Joo Chiat',
    collection_address: 'Blk 89 Joo Chiat Place, #03-17, Singapore 427808',
    collection_instructions: '3rd floor, no lift lobby. Ring doorbell or call 9123 8876. Park at Joo Chiat Complex or side roads. Please bring your own bags or tiffin if possible — I love seeing traditional carriers come home. Festive orders (Christmas, weddings) often ready early morning. I am happy to chat about the Eurasian history of the dish while you collect.',
    status: 'active',
    availability_paused: false,
    sfa_reg_number: 'SFA-HB-2025-11903',
    wsq_cert_expiry: '2026-11-20T00:00:00.000Z',
    pdpa_consent_at: '2025-02-14T14:20:00.000Z',
    pdpa_consent_version: 'v1.0-pdpa-2025',
    created_at: '2025-02-14T14:20:00.000Z',
    updated_at: '2026-06-12T16:45:00.000Z',
  },
];

// --- Dishes (product + meta aligned + heritage display) ---
export interface SeedDish extends Partial<SHCProductMeta> {
  id: string;
  cook_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  heritage_note: string;
  festive_timing: string;
  image_placeholder: string;
  status: string;
  cook_display_name?: string;
}

export const seedDishes: SeedDish[] = [
  {
    id: 'dish_nasi_lemak_prawn_001',
    cook_id: 'cook_rose_tampines_001',
    cook_display_name: 'Auntie Rose (Tampines)',
    name: 'Nasi Lemak Sambal Prawn',
    description: 'Fragrant coconut rice steamed with pandan and lemongrass, topped with fiery sambal prawns (fresh from the market), crispy ikan bilis, roasted peanuts, cool cucumber slices, and a perfectly fried egg. This is the 1972 Katong family recipe — rich, comforting, and unmistakably Peranakan. The sambal is made in small batches with belacan, fresh chillies, and a touch of gula melaka for balance. Perfect for family gatherings, Hari Raya breakfast spreads, or any day you need a taste of home. 450 cal per generous portion (full ingredient-based calculation).',
    price: 12,
    currency: 'SGD',
    min_qty: 5,
    calories: 450,
    calories_confidence: 'full',
    heritage_note: 'Peranakan family recipe since 1972, Katong. My grandmother used fresh prawns from the market every morning. Still made the same way in our Tampines HDB kitchen.',
    cuisine: 'Peranakan',
    occasion_tags: ['Family Gathering', 'Hari Raya', 'Birthday', 'Chinese New Year'],
    festive_timing: 'Hari Raya: ideal for breakfast or lunch on the eve or 1st day. CNY: popular as light lunch after visiting. Book 5-7 days ahead for large parties during festive peaks.',
    halal: false,
    allergen_tiers: {
      tier1: ['Shellfish (Prawns, Ikan Bilis)', 'Crustaceans (Belacan in sambal)', 'Nuts (Peanuts)', 'Eggs'],
      tier2: ['Coconut (milk in rice)'],
      tier3: [],
    },
    ingredients: [
      { name: 'Coconut rice (pandan, lemongrass)', quantity: 1, unit: 'portion base' },
      { name: 'Sambal prawns (fresh)', quantity: 4, unit: 'large prawns' },
      { name: 'Ikan bilis (anchovies)', quantity: 15, unit: 'g' },
      { name: 'Roasted peanuts', quantity: 20, unit: 'g' },
      { name: 'Cucumber', quantity: 4, unit: 'slices' },
      { name: 'Fried egg', quantity: 1, unit: 'whole' },
    ],
    image_placeholder: 'seed/assets/images/nasi-lemak-sambal-prawn-hero.jpg — High-resolution 1200px WebP of plated Nasi Lemak on banana leaf in warm HDB kitchen light, prawns glistening with sambal, peanuts scattered, egg yolk visible. Alt: \'Auntie Rose\'s 1972 Peranakan Nasi Lemak Sambal Prawn — heritage in every grain\'.',
    last_minute_premium_pct: 15,
    status: 'active',
  },
  {
    id: 'dish_ayam_buah_keluak_002',
    cook_id: 'cook_rose_tampines_001',
    cook_display_name: 'Auntie Rose (Tampines)',
    name: 'Ayam Buah Keluak',
    description: 'Tender chicken pieces slow-braised in a complex, earthy rempah with buah keluak (the signature black Indonesian black nut). The nut is painstakingly soaked, cleaned, and pounded into a rich, almost chocolate-like paste that gives the dish its deep, nutty, slightly bitter depth — balanced with tamarind, lemongrass, galangal, and a hint of gula melaka. A true Peranakan heirloom dish, labour-intensive and worth every step. Served with steamed rice. Signature of Auntie Rose\'s table for special occasions. 380 cal (category + sampled full calc).',
    price: 15,
    currency: 'SGD',
    min_qty: 4,
    calories: 380,
    calories_confidence: 'category',
    heritage_note: 'Signature heritage dish passed from my grandmother\'s Katong kitchen, 1972. The buah keluak ritual — soaking for days, scraping the flesh — is the same one my mother taught me in the Tampines HDB.',
    cuisine: 'Peranakan',
    occasion_tags: ['Family Gathering', 'Hari Raya', 'Birthday', 'Deepavali'],
    festive_timing: 'Labour of love — best ordered 3-5 days ahead. Popular centrepiece for Hari Raya and birthday celebrations. During Chinese New Year, pairs beautifully with other Nyonya dishes for reunion meals.',
    halal: false,
    allergen_tiers: {
      tier1: ['Nuts (Buah Keluak / Candlenut family)', 'Shellfish (possible belacan trace in rempah base)'],
      tier2: ['Coconut (in some variants)'],
      tier3: [],
    },
    ingredients: [
      { name: 'Chicken (bone-in pieces)', quantity: 500, unit: 'g' },
      { name: 'Buah keluak (prepared)', quantity: 8, unit: 'nuts' },
      { name: 'Rempah (galangal, lemongrass, chilli, belacan)', quantity: 1, unit: 'batch' },
      { name: 'Tamarind pulp', quantity: 2, unit: 'tbsp' },
      { name: 'Gula melaka', quantity: 1, unit: 'tbsp' },
    ],
    image_placeholder: 'seed/assets/images/ayam-buah-keluak-hero.jpg — Rich dark stew in traditional Peranakan bowl, chicken pieces visible with keluak shells on side for authenticity, on warm wooden table with HDB window light. Close-up of the pounded keluak paste texture.',
    last_minute_premium_pct: 10,
    status: 'active',
  },
  {
    id: 'dish_devils_curry_003',
    cook_id: 'cook_doris_katong_002',
    cook_display_name: 'Auntie Doris (Katong)',
    name: "Eurasian Devil's Curry (Chicken)",
    description: 'Spicy, tangy, and deeply aromatic — the iconic Singapore Eurasian Devil\'s Curry. Bone-in chicken (or traditional mix with pork elements on request) slow-cooked with a potent blend of fresh chillies, mustard seeds, vinegar, turmeric, ginger, garlic, and potatoes. The vinegar gives it the signature \'devil\' sour-heat that cuts through the richness. A Christmas, wedding, and Full Moon table staple in Katong Eurasian homes for generations. My grandmother learned it cooking for colonial households and made it her own. Served with crusty bread or rice to sop up every drop of the glorious gravy. 520 cal (full calc from ingredients).',
    price: 14,
    currency: 'SGD',
    min_qty: 5,
    calories: 520,
    calories_confidence: 'full',
    heritage_note: 'Eurasian Kristang heritage from my grandmother\'s 1950s Katong kitchen. The devilish heat and sour tang tell the story of our Portuguese-Malay-Chinese roots. Still made exactly as Nenek taught in our Joo Chiat HDB.',
    cuisine: 'Eurasian',
    occasion_tags: ['Family Gathering', 'Christmas', 'Wedding', 'Full Moon / Baby Full Month', 'Birthday'],
    festive_timing: 'Christmas Eve and Day centrepiece. Also popular for Eurasian weddings and Full Moon celebrations year-round. Book early for December — many families order 10+ portions. Last-minute premiums apply on 23-25 Dec.',
    halal: false,
    allergen_tiers: {
      tier1: ['Mustard seeds', 'Chillies (nightshade)', 'Chicken'],
      tier2: ['Vinegar (trace alcohol)', 'Potato'],
      tier3: ['Pork (traditional variant available on request — non-halal confirmed)'],
    },
    ingredients: [
      { name: 'Chicken (bone-in thighs/drumsticks)', quantity: 600, unit: 'g' },
      { name: 'Fresh red chillies', quantity: 8, unit: 'pcs' },
      { name: 'Mustard seeds', quantity: 1, unit: 'tsp' },
      { name: 'White vinegar', quantity: 3, unit: 'tbsp' },
      { name: 'Turmeric, ginger, garlic, shallots', quantity: 1, unit: 'rempah batch' },
      { name: 'Potatoes', quantity: 2, unit: 'medium' },
    ],
    image_placeholder: 'seed/assets/images/devils-curry-hero.jpg — Vibrant red-orange gravy with chicken and potato chunks in a large Peranakan-style serving bowl, steam rising, mustard seeds visible, served with sliced baguette or white rice on a festive tablecloth. Background hint of Katong Joo Chiat architecture.',
    last_minute_premium_pct: 20,
    status: 'active',
  },
];

// --- Occasions (rich SG cultural + timing) ---
export interface SeedOccasion {
  tag: string;
  display: string;
  description: string;
  festive_window_weeks_before: number;
  typical_dishes: string[];
  cultural_notes: string;
}

export const seedOccasions: SeedOccasion[] = [
  {
    tag: 'Hari Raya',
    display: 'Hari Raya Puasa',
    description: 'Eid celebrations — family open houses, forgiveness visits. Traditional spreads feature coconut rice dishes, rich curries, sambals, and sweets. Many Peranakan and Malay cooks prepare 3–7 days ahead. Peak ordering window: 10–14 days before Raya. Halal options strongly recommended. Collection often morning of or eve.',
    festive_window_weeks_before: 2,
    typical_dishes: ['Nasi Lemak Sambal Prawn', 'Ayam Buah Keluak', 'Rendang variants', 'Ketupat'],
    cultural_notes: 'Muslim customers; many non-Muslim Singaporeans join open houses. Address respect for prayer times during collection.',
  },
  {
    tag: 'Deepavali',
    display: 'Deepavali (Diwali)',
    description: 'Festival of Lights. Indian and Peranakan households celebrate with sweets, savouries, and hearty curries/veg dishes. Vegetable-heavy and vegetarian options popular. Peak: 7–10 days prior. Families gather for prayers and feasts.',
    festive_window_weeks_before: 1.5,
    typical_dishes: ['Ayam Buah Keluak (veg adaptations)', 'Chap Chye', 'Murukku sides', 'Fish head or mutton curries'],
    cultural_notes: 'Respect for vegetarian requests. Lamps and new clothes; food gifting common between neighbours.',
  },
  {
    tag: 'Chinese New Year',
    display: 'Chinese New Year (CNY)',
    description: '15-day spring festival of reunion, prosperity, and visiting. Pineapple tarts, yu sheng, bak kwa-inspired, and rich Nyonya spreads. Many dishes prepped weeks in advance. Eve and first 3 days are busiest for collection. Last-minute premiums common.',
    festive_window_weeks_before: 3,
    typical_dishes: ['Nasi Lemak variants', 'Ayam Buah Keluak', 'Peranakan Chap Chye', 'Kueh pie tee'],
    cultural_notes: 'Oranges, red packets, \'lo hei\' tossing. Avoid unlucky foods. Many HDB collections happen before visiting relatives.',
  },
  {
    tag: 'Birthday',
    display: 'Birthday / Family Milestone',
    description: 'Everyday but meaningful — 1st birthday, 21st, 60th, 80th. Home-cooked feasts feel more personal than restaurant. Flexible portions. Often combined with other tags.',
    festive_window_weeks_before: 0.5,
    typical_dishes: ['Nasi Lemak Sambal Prawn', "Eurasian Devil's Curry", 'Any signature dish'],
    cultural_notes: 'Longevity noodles or symbolic dishes sometimes requested. Multi-generational HDB tables common.',
  },
  {
    tag: 'Family Gathering',
    display: 'Family Gathering / Potluck',
    description: 'Weekly or monthly reunions, \'makan\' sessions, weekend lunches. The heart of Singapore home cooking culture. Flexible dates, steady demand year-round.',
    festive_window_weeks_before: 0.3,
    typical_dishes: ['All three featured dishes', 'Mix & match from cook archive'],
    cultural_notes: 'HDB void deck or living room tables. Often 8–20 portions. One-cook rule means families pick a specialist.',
  },
  {
    tag: 'Christmas',
    display: 'Christmas / Year-End',
    description: 'Eurasian and Christian families\' big celebration. Devil\'s Curry, roast elements, sugee cake, fruit cake. Peak last week of December. Strong Eurasian cook demand.',
    festive_window_weeks_before: 2,
    typical_dishes: ["Eurasian Devil's Curry", 'Galinha Assam', 'Sugee cake sides'],
    cultural_notes: 'Midnight mass, gift exchanges. Many collections on 24th evening or 25th morning.',
  },
  {
    tag: 'Full Moon / Baby Full Month',
    display: 'Baby Full Moon / Confinement',
    description: 'Celebrating baby\'s first month. Red eggs, ginger, traditional confinement-friendly dishes. Eurasian and Chinese/Peranakan families mark it joyfully. Smaller, high-quality orders common.',
    festive_window_weeks_before: 0.5,
    typical_dishes: ["Eurasian Devil's Curry (mild)", 'Ginger-rich variants', 'Nasi Lemak (lighter)'],
    cultural_notes: 'Gifting of eggs and cakes. Often daytime collections. Respect new mother rest.',
  },
];

// --- Helpers (used by mobile + future Medusa) ---
export function getSeedCooks() {
  return seedCooks;
}

export function getSeedDishes() {
  return seedDishes;
}

export function getSeedOccasions() {
  return seedOccasions;
}

export function getFeaturedForHome() {
  const rose = seedCooks.find(c => c.slug === 'auntie-rose-tampines');
  const nasi = seedDishes.find(d => d.id === 'dish_nasi_lemak_prawn_001');
  const devil = seedDishes.find(d => d.id === 'dish_devils_curry_003');

  return [
    {
      id: '1',
      name: rose?.display_name || 'Auntie Rose (Tampines)',
      dish: nasi?.name || 'Nasi Lemak Sambal Prawn',
      price: nasi?.price || 12,
      heritage: nasi?.heritage_note || 'Peranakan family recipe since 1972',
      slug: rose?.slug,
    },
    {
      id: '2',
      name: 'Auntie Doris (Katong)',
      dish: devil?.name || "Eurasian Devil's Curry (Chicken)",
      price: devil?.price || 14,
      heritage: (devil?.heritage_note || '').slice(0, 80) + '...',
      slug: 'auntie-doris-katong',
    },
  ];
}

// Trust copy snippets (renderable in modals/screens — source of truth is content/*.md)
export const trustSnippets = {
  fiveLayersSummary: 'Five independent trust layers protect every order: 1. Video content (kitchen + dish demos with AI quality scoring). 2. Subsidised tasting portions (S$3–5) for real reviews. 3. Clear receipts + auto corporate tax invoices. 4. Tiered Occasion Guarantee (orders >S$150: up to 50% refund, capped S$100 for verified issues). 5. Strict cancellation policy (72h+ full; 24-72h 50%; <24h none) + first-order HDB collection guide + live counters.',
  allergenNote: 'Allergens are mandatory Tier 1 disclosure. Common in our heritage dishes: Shellfish (prawns, ikan bilis, belacan), Nuts/Peanuts (Nasi Lemak, buah keluak), Eggs, Mustard seeds (Devil\'s Curry), possible traces of pork in traditional Eurasian/Peranakan. Always ack before checkout.',
  collectionNote: 'Address released exactly 2h before your slot (HDB blocks like Blk 456 Tampines St 42 #05-123). Customer collects — no delivery. Call on arrival, shoes off, respect the home.',
  guaranteeNote: 'Platform-backed. Clear receipts always. For objective failures on larger orders: proportional refund up to 50% (cap S$100). Full details in Trust & Safety.',
};

export const howItWorksSnippet = 'Discover by occasion (Hari Raya, CNY, birthdays). Choose heritage cook + dish. Mandatory allergen ack + one-cook cart. PayNow (customer confirms ref). Address released 2h pre-collection. Cook prepares in real HDB kitchen. You collect. Review after. Weekly payouts to cooks.';

export const paynowSnippet = 'Pay exact amount via PayNow to platform UEN using order reference. Enter ref in app to mark paid. Ops manually verifies in Admin (amount + ref match, no dups). Then address releases on schedule. See full ops steps in content/paynow-flow.md.';

// Full seed bundle
export const seedData = {
  cooks: seedCooks,
  dishes: seedDishes,
  occasions: seedOccasions,
  featuredForHome: getFeaturedForHome(),
  trust: trustSnippets,
  howItWorks: howItWorksSnippet,
  paynow: paynowSnippet,
};

export default seedData;
