# Decision Tree: AI Calorie Estimation

**Related Files:**
- [../05-data-model/05-data-model.md](../05-data-model/05-data-model.md)
- [../08-marketplace-rules/08-marketplace-rules.md](../08-marketplace-rules/08-marketplace-rules.md)
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [16-references/16-references.md](../16-references/16-references.md)

**Last Updated:** 2026-06-13 (Contracts Track owns)
**Owner:** Contracts Track

## Purpose

Calorie estimation helps customers make informed choices and supports trust. The system uses a combination of cook-provided data, AI analysis of photos/ingredients, and confidence scoring.

## Decision Flow

1. Cook uploads ingredients or photo during listing creation.
2. System attempts automated estimation (vision + LLM or dedicated model).
3. If confidence ≥ 80% → display value with "AI estimated" badge.
4. If confidence < 80% or cook overrides → require manual input + "Cook verified" badge.
5. Customer sees both value and confidence/source on product detail.

## Rules

- Never display calorie info without source and confidence.
- Estimation is advisory only; platform disclaims liability for accuracy.
- Stored in `shc_product_meta.calories` + `calories_confidence`.
- Re-estimation triggered on significant ingredient changes.

## Production Notes

- Rate limit AI calls to control cost.
- Cache results per product version.
- Fallback to "Not available" when estimation fails.

**Contracts Rule:** Calorie data is never used for medical or strict dietary decisions. It is informational only.
