#!/usr/bin/env bash
# Install repo git hooks (pre-push runs fast ci-gate config check).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

git -C "$ROOT" config core.hooksPath .githooks
chmod +x "$ROOT/.githooks/pre-push" 2>/dev/null || true
echo "✓ git hooks → .githooks (pre-push: ci-gate config)"
