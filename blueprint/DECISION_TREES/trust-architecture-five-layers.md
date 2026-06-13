# Decision: Customer Trust Architecture — Five Layers

**Source:** Decisions_Log.txt Section 8

## The Five Independent Trust Layers
1. **Video content** — Cook shows kitchen and cooking process
2. **Tasting portions** — Option for customers to order small tasting portions first
3. **New Cook Guarantee** — Platform-backed guarantee for first orders from new cooks
4. **Kitchen Verified badge** — Visual verification of kitchen standards
5. **Cook Since date** — Transparency on how long the cook has been active

Each layer must independently reassure the customer. Collectively they address the psychological barrier of buying food from a stranger's home.

**Implementation:** These must appear prominently on Cook profile and Dish detail screens. Badge logic lives in `shc_cook` status + compliance module.