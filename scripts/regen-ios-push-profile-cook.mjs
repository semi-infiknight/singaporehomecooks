#!/usr/bin/env node
/**
 * Regenerate cook iOS App Store provisioning profile with Push Notifications.
 * Prerequisite: Push enabled on com.singaporehomecooks.cook in Apple Developer Portal.
 *
 * Usage:
 *   EAS_CLI_ROOT=/path/to/eas-cli node scripts/regen-ios-push-profile-cook.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = {
  ...process.env,
  SHC_IOS_APP: 'mobile-cook',
  SHC_EAS_PROJECT_ID: 'bb1c9052-df53-48fd-89e2-94ee51159bd9',
  SHC_BUNDLE_ID: 'com.singaporehomecooks.cook',
  SHC_APPLE_BUNDLE_RESOURCE: process.env.SHC_APPLE_BUNDLE_RESOURCE ?? 'UP2GVHBSNM',
};

const result = spawnSync(process.execPath, [join(root, 'scripts/regen-ios-push-profile.mjs')], {
  stdio: 'inherit',
  env,
  cwd: root,
});

process.exit(result.status ?? 1);
