# Feature Flags & Cohort Rules (Default State)

**Related Files:** `05-data-model.md`

| Flag | Default | Cohort | Description |
|------|---------|--------|-------------|
| `recipe_requests_enabled` | false | Phase 8 | Enables request + bid flow |
| `corporate_invoicing` | false | Phase 8 | Allows corporate flag on orders |
| `ai_listing_assist` | false | Phase 9 | AI suggestions in wizard |
| `home_credits_wallet` | false | Phase 9 | Internal credit system |
| `live_chat_soketi` | false | Phase 8 optional | Real-time chat vs polling |
| `ai_photo_assessment` | false | Phase 3 | AI photo quality tips at upload |
| `natural_language_search` | false | Phase 5 | Claude-powered contextual meal search |
| `behavioural_personalisation` | false | Phase 6 | Allergy alerts + 7 notification types |
| `cook_collaboration` | false | Phase 3 | Large order board & collective listings |
| `heritage_archive` | false | Phase 7 | Permanent recipe archive & library |
| `dynamic_pricing_ui` | false | Phase 4 | Real-time earnings calculator + last-minute premiums |

Flags are managed via Admin and evaluated in both backend and mobile.