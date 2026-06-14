# Seed Image Placeholders & Production Notes

**For Content + Seed Track (and future Media/Infra/Backend):**

All images are **placeholders** until real uploads via MinIO + Sharp processing (per 00-locked-decisions + 03-railway). Use these notes for:

- Founder-provided hero photos (high quality, authentic HDB kitchen, natural light preferred).
- AI-assisted generation or stock with proper licensing/attribution (temporary only).
- Cook-uploaded during onboarding (video + stills with AI quality scoring).

## Required Derivatives (Backend/Infra)
- 1200px WebP hero (product + cook profile)
- 400px WebP thumb (grids, discovery)
- Optional 800px for modals
- Video: 30s/60s MP4 or MOV, transcoded, first-frame thumb extracted.

Storage: MinIO `shc-images` / `cook-uploads` buckets. Public + signed URLs. Metadata in product_image or shc tables.

## Per-Dish Placeholders (use in mobile mocks + future catalog)

**Nasi Lemak Sambal Prawn (dish_nasi_lemak_prawn_001)**
- Hero: seed/assets/images/nasi-lemak-sambal-prawn-hero.jpg
  - Description: High-resolution 1200px WebP of plated Nasi Lemak on banana leaf in warm HDB kitchen light, prawns glistening with sambal, peanuts scattered, egg yolk visible. Alt: 'Auntie Rose's 1972 Peranakan Nasi Lemak Sambal Prawn — heritage in every grain'.
  - Secondary: Close-up of rempah pounding on batu lesung; finished dish on family table with HDB window + park view.
- Cook profile hero for Auntie Rose: Warm portrait with her at stove or with grandchildren + dish.

**Ayam Buah Keluak (dish_ayam_buah_keluak_002)**
- Hero: seed/assets/images/ayam-buah-keluak-hero.jpg
  - Rich dark stew in traditional Peranakan bowl, chicken pieces visible with keluak shells on side for authenticity, on warm wooden table with HDB window light.
  - Close-up of the pounded keluak paste texture (deep black-brown).
- Note: Difficult to photograph beautifully — emphasize steam, colour depth, and the ritual shells.

**Eurasian Devil's Curry (dish_devils_curry_003)**
- Hero: seed/assets/images/devils-curry-hero.jpg
  - Vibrant red-orange gravy with chicken and potato chunks in a large Peranakan-style serving bowl, steam rising, mustard seeds visible, served with sliced baguette or white rice on a festive tablecloth. Background hint of Katong Joo Chiat architecture (shophouses).
  - High contrast, appetising, heritage-authentic styling.
- Secondary: The rempah paste (bright red from fresh chillies) being fried; grandmother-era photo scan if available.

## Cook Personas — Visuals
- Auntie Rose Tampines: Candid in HDB kitchen (apron, natural smile), perhaps holding a plate of nasi lemak. Warm cream + terracotta tones. 3rd gen story overlay possible.
- Auntie Doris Katong: Family table scene or at stove with Devil's Curry. Blend of vintage Katong + modern HDB. Include subtle Eurasian elements (cross, old photos).

## Production Checklist
- [ ] Real photos uploaded for Phase 1-2 launch (at least 1 hero + 2 supporting per dish).
- [ ] AI quality assessment passes (sharpness, lighting, no blur, appealing colour).
- [ ] Alt text + accessibility descriptions in seed + CMS.
- [ ] Video for at least 1 dish + 1 cook intro per persona (30-60s).
- [ ] Credit cooks in captions: "Photo: Family archive / Auntie Rose, 2025".
- [ ] Festive variants: extra CNY/Raya shots (e.g. dish with red packet or ketupat).

## Temporary Fallbacks (Mobile Mocks Only)
Until real assets:
- Use solid colour cards with emoji or text overlay (e.g. 🍚 for nasi lemak, 🔥 for devil curry).
- Or public domain SG food photography (attributed) in /assets for dev only.
- Never ship production with placeholders or generic stock.

**Owner:** Content + Seed Track coordinates with Mobile (render) and Backend/Infra (storage + processing). Update this file when real images added to seed or MinIO.

*Heritage images are as important as the recipes themselves. Capture the HDB soul.*
