#!/usr/bin/env bash
# Capture pixel token measurements for Family Values tri-platform review.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${FAMILY_VALUES_SCRATCH:-$ROOT}"
mkdir -p "$OUT/screenshots"
: > "$OUT/pixel-measurements.txt"

log() { echo "$@" | tee -a "$OUT/pixel-measurements.txt"; }

log "=== Family Values pixel measurements $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
log ""
log "--- @shc/ui spacing tokens (shcSpacing) ---"
rg -n "export const shcSpacing" -A 12 "$ROOT/packages/shc-ui/src/theme.ts" | tee -a "$OUT/pixel-measurements.txt"
log ""
log "--- Tray heights (TRAY_HEIGHT_PX) ---"
rg -n "TRAY_HEIGHT_PX" -A 5 "$ROOT/packages/shc-ui/src/family-values-core.ts" | tee -a "$OUT/pixel-measurements.txt"
log ""
log "--- Web tray header padding (post-fix: pb-2 = 8px) ---"
rg -n "px-4 pb-2" "$ROOT/apps/web/app/components/SHCWebComponents.tsx" | tee -a "$OUT/pixel-measurements.txt"
log ""
log "--- Mobile tray header padding (pb: shcSpacing.sm = 8) ---"
rg -n "paddingBottom.*shcSpacing" "$ROOT/packages/shc-ui/src/tray.tsx" | head -3 | tee -a "$OUT/pixel-measurements.txt"
log ""
log "--- Hero rects (sync morph) ---"
rg -n "HERO_RECT_" "$ROOT/packages/shc-ui/src/family-values-core.ts" | tee -a "$OUT/pixel-measurements.txt"
log ""
log "--- Morph animation timings (family-values-ui.tsx) ---"
rg -n "duration: [0-9]+" "$ROOT/packages/shc-ui/src/family-values-ui.tsx" | head -10 | tee -a "$OUT/pixel-measurements.txt"
log ""
log "Measurements saved to $OUT/pixel-measurements.txt"