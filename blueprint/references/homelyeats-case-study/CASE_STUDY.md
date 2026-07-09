# HomelyEats — Full Case Study Distillation

**Source article:** [Medium · Design Bootcamp](https://medium.com/design-bootcamp/how-i-simplified-ordering-home-cooked-meals-with-a-subscription-centric-app-a-product-design-521a82b219be)  
**Designer:** Ayushi Prakash · Published 2023-12-13  
**Scope of case study:** **Customer-side only** (cook interface acknowledged but not designed)  
**Assets:** see [IMAGE_INDEX.md](./IMAGE_INDEX.md) · files under `images/`

This document is the agent-facing rewrite of the blog: problem → research → constraints → **screen flows** → **state models** → visual system. Use it as the product-design brief when redesigning SHC tiffin/subscription.

---

## 1. Problem framing

### Context

Working professionals / students living away from home:

- No time/space to cook
- Miss mom’s cooking
- Default to takeout/junk → guilt + overspend
- Local tiffin services: inconsistent quality, oily food, mystery portions, opaque hygiene

### Product goal (quoted)

> Designing a mobile app that makes ordering delicious and healthy home-cooked meals easier, allowing the user to choose the right meal at reasonable prices with **flexible subscription plans**.

### Product definition

**HomelyEats** = subscription-centric home-cooked meal delivery app that streamlines **purchase + daily management** of meal plans for subscribers.

Ideal: two apps (cook + customer). Case study covers **customer only**, with kitchen constraints modeled so cooks stay operable.

---

## 2. Research summary

### Methods

| Method | Artifact | Image |
|--------|----------|-------|
| 1:1 calls (friends/sister away from home) | Interview topics board | `03` / `semantic-research-1on1-calls.png` |
| Google Form survey (~35+ responses) | Survey result charts | `04` / `semantic-research-user-survey.png` |
| Synthesis | Needs & concerns diagram | `05` / `semantic-research-user-insights.png` |
| Competitive analysis (apps + tiffin) | Competitor matrix + findings | `06`–`08` |

### Interview topics

1. Living conditions & daily meal management  
2. Frequency of restaurant / delivery orders  
3. Tiffin or cook satisfaction — pain if not  
4. Preferences for daily meals  

### Target audience (narrowed)

- Working professionals  
- Students  
- Health-conscious individuals  

Ages mostly **18–39**.

### User pain points (10) — `images/09.png`

1. Poor UI/UX in existing apps  
2. Hard to find a good tiffin service  
3. No subscription / plan flexibility  
4. Payment hassles + unclear refunds  
5. Unclear meal descriptions / nutrition  
6. Limited variety + no customization  
7. Delivery delays / wrong orders  
8. Food quality & quantity concerns  
9. Weak support / feedback loops  
10. No cook background / trust info  

### Personas — `images/10.png`

Two primary personas derived from goals + frustrations (students / working professionals with different meal-regularity needs). Agents should open the image when designing empty states and onboarding copy.

---

## 3. Design constraints (critical for backend)

These are **product rules**, not decoration.

### 3.1 Time-based meal options

Kitchens set **menu time ranges** for logistics:

| Meal type | Example window |
|-----------|----------------|
| Breakfast | 06:30 – 10:00 |
| Lunch | 12:00 – 15:00 |
| (Dinner / snacks implied similarly) | |

Menus and customization windows hang off these slots.

### 3.2 Subscription plans & flexibility

| Rule | Meaning |
|------|---------|
| **One meal per kitchen = one subscription plan** | A kitchen’s “Delight lunch daily meal” is a plan SKU. User can hold multiple plans (possibly multi-kitchen in HomelyEats). |
| **≥ 8 hours advance notice** | Customize or skip a meal only if ≥ 8h before delivery slot. Gives kitchen prep time. |

### 3.3 Localized delivery

- **Near:** partner kitchen delivers within **1–2 km** (control + speed)  
- **Far:** external delivery partner + **delivery fee**

### SHC translation note

SHC today is **collection-first** (HDB pickup), not kitchen delivery radius. Keep HomelyEats *flexibility mechanics* (flex days, skip, balance) but map delivery → **collection slot** unless product changes.

---

## 4. Information architecture

### Bottom tabs (customer)

| Tab | Role |
|-----|------|
| **Subscriptions** (Home) | Discover kitchens/plans, promo banner, categories, meal-type rails |
| **Delivery** | (implied logistics / track — less detailed in article) |
| **Orders** | Day-by-day meal deliveries materialised from subscriptions + one-time |
| **Account** | Profile, My subscriptions, addresses, payments, coupons, support |

### Dual entry to “My subscriptions”

1. Homepage banner: “N active subscriptions → Manage”  
2. Account → My subscriptions  

Asset: `28` / `semantic-screen-my-subscriptions.png`

---

## 5. End-to-end user journeys

```
Guest explore
    → Auth (phone / Google / email + OTP + name)
    → Rough GPS location (not full address yet)
    → Home discovery
    → Kitchen page
    → Subscribe to a meal plan (SKU + days + payment)
    → Orders materialised for plan period
    → Daily: view menu / customize / skip
    → Manage: pause / recharge / cancel
    → Optional: one-time order without subscription
```

### Ideation method

- **MoSCoW** feature prioritisation  
- Comprehensive user-flow map  
- Pen-and-paper wireframes → hi-fi  

Assets: `13` wireframes · `15` style guide · `11`–`12` product sneak peek

---

## 6. Screen-by-screen flows

### 6.1 Onboarding — `images/16.png`

**Goals:** set tone, reduce drop-off, allow trial.

| Step | UX |
|------|-----|
| Splash / welcome | Warm Indian-home food illustrations |
| Value props | Short carousel |
| CTA | Sign up / Log in |
| Escape hatch | **Continue as guest** (explore without account) |

**Why:** guest mode lowers barrier → higher eventual conversion.

---

### 6.2 Auth & account setup — `images/17.png`

| Step | Detail |
|------|--------|
| Entry | Phone **or** Google **or** email |
| Verify | OTP |
| First-time | Capture **name** only |
| Location | Grant GPS; **rough** location for nearby kitchens |
| Address deferral | Full address asked only at **order / subscription pay** time |

**Rationale:** full address early = drop-off. Nearby kitchens need only approx location.

---

### 6.3 Homepage — `images/18.png` (+ component callouts `19`–`22`)

Homepage is the conversion surface. Layout avoids monotony and fights **decision fatigue** via categorisation + filters.

#### Annotated regions (from designer callouts)

| # | Element | Purpose |
|---|---------|---------|
| 1 | Orange promo banner “No time to cook? Explore subscriptions” | Push subscription conversion |
| 2 | Category chips (Thali, Keto, Salads, Breads…) | Simplify browse |
| 3 | “Most popular” meal-type rails (Breakfast / Lunch / Dinner) | Fast path to popular plans |
| 4 | Kitchen list cards | Conversion-oriented cards (rating, open hours, price range, **subscriber count**) |
| — | Location chip + change address | Local relevance |
| — | Search (kitchen / meal / cuisine) | Direct intent |
| — | Offer / coupon cards | First-subscription discount |
| — | Meal-type sort (Breakfast / Lunch / Snack / Dinner) | Time-of-day filtering |
| — | Sort: Veg / Non-veg / Nearest | Hygiene of choice |
| — | Sticky bottom tabs | Subscriptions · Delivery · Orders · Account |

#### Kitchen card data model (implied)

- Kitchen name + verified badge  
- Cuisines  
- Open / closes at  
- Rating + review count  
- Price range ₹X–Y / meal  
- **Subscriber count** (social proof)  
- Favourite heart  
- Cover food photo  

---

### 6.4 Kitchen page — `images/23.png`

**Principle: Jakob’s Law** — match mental model of food-delivery restaurant pages so users don’t relearn IA.

Typical contents (from breakdown + competitive norms):

- Hero photo + kitchen name + rating  
- Story / tags / open status  
- List of **subscription meal plans** offered by kitchen  
- Plan price / meal type / description  
- CTA into subscribe flow  

---

### 6.5 Subscribe to a meal — `images/24.png`

**Primary conversion funnel.** Focus: reduce cognitive load, transparent trust, simple purchase.

Implied steps (from article + flow graphic):

1. Select meal plan on kitchen page  
2. Choose plan duration / prepaid package (balance model)  
3. Choose **repeat days** (daily / weekdays / weekends / custom M–S)  
4. Delivery / collection timeslot  
5. Optional cooking / delivery instructions  
6. Pay  
7. Confirmation → plan becomes **Active** → future **Orders** pre-created  

**Business rule:** one plan SKU per kitchen meal line; customisation of individual days starts *after* subscribe (Orders + Manage).

---

### 6.6 My Orders (daily delivery list) — `images/25.png`

**Key concept:** every row = **one meal delivery instance**.  
On subscribe, the system **pre-creates orders for the whole subscription period**.

#### UI structure

- Horizontal **scroll calendar** (day select)  
- List of order cards for that day  
- Per card: kitchen name, plan title, status chip, timeslot, menu (if known), Manage / View  

#### Order card variants (5 states)

| State | Meaning | UI cue (from design) |
|-------|---------|----------------------|
| **Indeterminate** | Far-future order; no operational status yet | Neutral / minimal |
| **Scheduled** | Upcoming; menu updated **or** “menu yet to be updated” | Blue chip + timeslot; optional **CUSTOMIZABLE** tag if ≥8h |
| **Delivered** | Successfully delivered | Green chip + delivered time |
| **Skipped** | User skipped that day (uses flex) | Orange / muted “Skipped” |
| **Canceled by kitchen** | Kitchen canceled that day | Red chip |

#### Customisation affordance

- **CUSTOMIZABLE** tag on card when ≥ **8 hours** before slot — user knows without opening detail  
- If kitchen hasn’t published menu: “Menu yet to be updated”  

---

### 6.7 Customize order (add extras) — `images/26.png`

| Rule | Detail |
|------|--------|
| Window | Only if **> 8 hours** until delivery slot |
| Action | Add extra items + **instant pay** for delta |
| Outcome | Order content updates; kitchen sees delta in time |

---

### 6.8 Skip an order — `images/27.png`

| Concept | Detail |
|---------|--------|
| **Flex days** | Limited skip/pause budget granted per subscription period |
| Skip | Single day → order becomes **Skipped** |
| Pause | Multi-day hold (see §6.11) |
| After limit | No more free skips until **new period** / recharge |
| Period extension | Each skipped/paused day **extends subscription expiry** so user doesn’t lose paid meals |

Quote from case study:

> Flex days allow you to pause or skip meal deliveries… After reaching a limit, more pauses/skips are available at the start of your new subscription period. The subscription period extends for each paused/skipped day, adjusting the expiry date accordingly.

---

### 6.9 My Subscriptions list — `images/28.png`

Tabs: **Active** | **Past**

#### Subscription card states (5)

| State | Section | CTA |
|-------|---------|-----|
| **Default (Active)** | Active | Manage |
| **Paused till *date*** | Active | Resume / Manage |
| **Expires in n days** | Active | **Recharge now** + Manage |
| **Canceled on *date*** | Past | View |
| **Expired** (balance/deliveries depleted) | Past | **Recharge now** / Manage |

Entry points: home banner + Account.

---

### 6.10 Manage subscription — `images/29.png`

Single source of truth for one plan. Hierarchy of information:

**Top priority metrics**

- Remaining **balance** (money wallet for the plan)  
- **Deliveries left** (e.g. 12/30)  
- **Flex days left** (e.g. 8/15)  
- **Expires on** date  

**Primary actions**

- **Pause** · **Recharge** (high emphasis)

**Secondary settings**

- Change delivery timeslot  
- Repeat-on days (Daily / Weekdays / Weekends / custom day chips)  
- Cooking instructions (edit)  
- Delivery instructions (edit)  
- Reminder before subscription ends  
- WhatsApp updates toggle  
- Help  

**Danger zone (bottom)**

- **Cancel subscription** — last, to prevent mis-taps  

**Side panel:** Recent transactions (per-meal debits from balance)

---

### 6.11 Recharge plan — `images/30.png`

| Behaviour | Detail |
|-----------|--------|
| Goal | Prolong service **before** expiry |
| Action | Top up plan balance |
| Preferences | New day preferences apply **after** current balance is consumed |
| Outcome | Continuous service without gap |

---

### 6.12 Pause plan — `images/31.png`

| Behaviour | Detail |
|-----------|--------|
| Cost | Consumes **flex days** |
| UI first screen | Remaining flex days + consequences |
| Effect | Status → **Paused till date**; expiry extends by pause length |
| Resume | Explicit resume or auto on end date |

---

### 6.13 Cancel plan — `images/32.png`

| Behaviour | Detail |
|-----------|--------|
| Before cancel | Mandatory **reason chips** (feedback) |
| After | Moves to Past · **Canceled on date** |
| UX goal | Transparent control → trust |

---

### 6.14 One-time order (no subscription) — `images/33.png`

Parallel funnel for:

- Trial users  
- Occasional / special occasion  
- Users not ready for commitment  

Still appears under **My Orders** alongside subscription-materialised orders.

---

### 6.15 Empty states — `images/34.png`

Mandatory empty screens for zero subscriptions, zero orders, empty favourites, etc. (warm illustration language matching onboarding).

---

## 7. State machines (canonical for implementation)

### 7.1 Subscription status

```
                    ┌─────────────┐
         pay        │   active    │
    ──────────────► │  (default)  │◄──── resume
                    └──────┬──────┘
           pause flex      │      expire / balance 0
           days left       │              │
                ▼          │ cancel       ▼
         ┌──────────┐      │       ┌──────────┐
         │  paused  │──────┘       │  expired │
         └──────────┘              └──────────┘
                │ cancel                 │ recharge
                ▼                        ▼
         ┌──────────┐              ┌──────────┐
         │ canceled │              │  active  │
         └──────────┘              └──────────┘
```

### 7.2 Order (meal instance) status

```
  subscribe materialises N future orders
                │
                ▼
        indeterminate  ──(date approaches)──►  scheduled
                                                   │
                    ┌────────── skip (flex) ───────┤
                    │                              │
                    ▼                              ├── customize (≥8h) ──► scheduled'
               skipped                             │
                                                   ├── kitchen cancel ──► canceled_by_kitchen
                                                   │
                                                   └── deliver ──► delivered
```

### 7.3 Flex-day ledger

```
on subscribe / recharge period start:
  flex_remaining = flex_quota_for_plan

on skip day OR pause day:
  require flex_remaining > 0
  flex_remaining -= 1
  subscription.expires_on += 1 day
  order.status = skipped | subscription.paused_until = ...
```

### 7.4 Balance ledger (prepaid)

```
on subscribe / recharge: balance += package_amount
on each delivered (or scheduled debit rule): balance -= meal_price
on expired: balance ~ 0 or deliveries_left = 0
```

*(Exact debit timing — at schedule vs at delivery — is a product choice; HomelyEats UI shows post-hoc “Recent transactions” per meal.)*

---

## 8. Visual system — `images/15.png`

| Token | HomelyEats choice | Why |
|-------|-------------------|-----|
| Primary | **Orange** | Appetite, energy, food appeal |
| Illustrations | Warm Indian home / food | Belonging for diaspora students |
| Density | Clean white cards, soft peach canvas | Product-design case study clarity |
| Type | System-like sans, clear hierarchy | Reduce cognitive load |

**SHC must NOT adopt orange as brand.** Map patterns to Family Values / Gourmeat tokens (`brand.md`, `@shc/ui`). Steal structure, not palette.

---

## 9. Feature inventory (customer)

| Feature | HomelyEats | Notes |
|---------|------------|-------|
| Guest browse | ✅ | |
| Phone / Google / email auth | ✅ | OTP |
| GPS rough location | ✅ | Full address deferred |
| Category + meal-type discovery | ✅ | |
| Kitchen listing + social proof | ✅ | subscriber count |
| Kitchen detail (Jakob’s Law) | ✅ | |
| Subscribe prepaid plan | ✅ | |
| Multi active subscriptions | ✅ | Multiple kitchens possible |
| Pre-materialised daily orders | ✅ | Calendar UI |
| 5 order states | ✅ | |
| Customize + pay extras (≥8h) | ✅ | |
| Skip day (flex) | ✅ | |
| Pause plan (flex) | ✅ | |
| Recharge | ✅ | |
| Cancel + reasons | ✅ | |
| One-time order | ✅ | |
| Empty states | ✅ | |
| Cook app | ❌ (out of scope) | Constraints only |

---

## 10. Diagram / asset map (quick)

| Image | Topic |
|-------|--------|
| 02 | Hero cover |
| 03–05 | Research |
| 06–08 | Competitive analysis |
| 09 | Pain points |
| 10 | Personas |
| 11–12 | Product sneak peek / motion |
| 13 | Paper wireframes (full journey) |
| 14–15 | Visual process + style |
| 16 | Onboarding flow |
| 17 | Auth + location |
| 18–22 | Homepage system |
| 23 | Kitchen page |
| 24 | Subscribe flow |
| 25 | My orders + states |
| 26 | Customize extras |
| 27 | Skip |
| 28–29 | Subscriptions list + manage |
| 30 | Recharge |
| 31 | Pause |
| 32 | Cancel |
| 33 | One-time order |
| 34 | Empty states |

Open `images/semantic-*.png` for agent-friendly names.

---

## 11. What “good” looks like (acceptance criteria from the case study)

1. User can become a **subscriber in few taps** with transparent pricing.  
2. Daily meal management is **calendar-first**, not buried in settings.  
3. Flexibility (skip/pause) is **budgeted** (flex days), not infinite chaos for kitchens.  
4. Kitchen logistics protected by **8h cutoffs** and **time windows**.  
5. Trust via ratings, subscriber counts, cook info, clear cancel/refund language.  
6. One-time orders exist so non-subscribers still convert later.  
7. Empty + canceled + expired states are designed, not afterthoughts.

---

*Extracted for Singapore Home Cooks agents. Implementation mapping: [REDESIGN_PLAN.md](./REDESIGN_PLAN.md).*
