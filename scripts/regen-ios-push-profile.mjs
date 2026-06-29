#!/usr/bin/env node
/**
 * Delete stale EAS App Store provisioning profile and regenerate with Push Notifications.
 * Uses Expo session + ASC API key stored on EAS (non-interactive).
 *
 * Prerequisite: Push Notifications must be enabled on the App ID in Apple Developer Portal.
 * ASC API key auth cannot reliably enable push on the bundle ID — verify at:
 * https://developer.apple.com/account/resources/identifiers/bundleId/edit/494YWU3AKA
 *
 * Usage:
 *   EAS_CLI_ROOT=/path/to/eas-cli/node_modules/eas-cli node scripts/regen-ios-push-profile.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const iosApp = process.env.SHC_IOS_APP ?? 'mobile-customer';
const projectDir = join(repoRoot, 'apps', iosApp);
const projectId =
  process.env.SHC_EAS_PROJECT_ID ??
  (iosApp === 'mobile-cook'
    ? 'bb1c9052-df53-48fd-89e2-94ee51159bd9'
    : '5c1f4300-5851-4288-9416-bd968589001a');
const bundleIdentifier =
  process.env.SHC_BUNDLE_ID ??
  (iosApp === 'mobile-cook'
    ? 'com.singaporehomecooks.cook'
    : 'com.singaporehomecooks.customer');
const appleBundleIdResource =
  process.env.SHC_APPLE_BUNDLE_RESOURCE ??
  (iosApp === 'mobile-cook' ? '' : '494YWU3AKA');
process.chdir(projectDir);

const require = createRequire(import.meta.url);
const easCliRoot =
  process.env.EAS_CLI_ROOT ??
  (() => {
    try {
      return dirname(
        require.resolve('eas-cli/package.json', {
          paths: [join(projectDir, 'node_modules'), join(__dirname, '..', 'node_modules')],
        }),
      );
    } catch {
      throw new Error(
        'Set EAS_CLI_ROOT to your eas-cli install path (e.g. from `pnpm dlx eas-cli`).',
      );
    }
  })();
const build = join(easCliRoot, 'build');

const { createGraphqlClient } = require(join(
  build,
  'commandUtils/context/contextUtils/createGraphqlClient',
));
const { CredentialsContext } = require(join(build, 'credentials/context'));
const { SetUpBuildCredentials } = require(join(
  build,
  'credentials/ios/actions/SetUpBuildCredentials',
));
const {
  getAppFromContextAsync,
  getProvisioningProfileAsync,
  getBuildCredentialsAsync,
} = require(join(build, 'credentials/ios/actions/BuildCredentialsUtils'));
const { RemoveProvisioningProfiles } = require(join(
  build,
  'credentials/ios/actions/RemoveProvisioningProfile',
));
const { tryAuthenticateAppStoreWithEasAscApiKeyAsync } = require(join(
  build,
  'credentials/ios/actions/AscApiKeyUtils',
));
const { getOwnerAccountForProjectIdAsync } = require(join(build, 'project/projectUtils'));
const { getPrivateExpoConfigAsync } = require(join(build, 'project/expoConfig'));
const { resolveXcodeBuildContextAsync } = require(join(build, 'project/ios/scheme'));
const { resolveTargetsAsync } = require(join(build, 'project/ios/target'));
const GitClient = require(join(build, 'vcs/clients/git')).default;
const { ensureBundleIdExistsAsync } = require(join(
  build,
  'credentials/ios/appstore/ensureAppExists',
));
const { parse: parseProvisioningProfile } = require(join(
  build,
  'credentials/ios/utils/provisioningProfile',
));
const { getRequestContext } = require(join(build, 'credentials/ios/appstore/authenticate'));
const { IosDistributionType } = require(join(build, 'graphql/generated'));
const { AppleTeamType } = require(join(
  build,
  'credentials/ios/appstore/authenticateTypes',
));
const { getApplePlatformFromTarget } = require(join(build, 'project/ios/target'));
const { ProfileClass } = require(join(build, 'credentials/ios/appstore/provisioningProfile'));
const appleUtilsRequire = createRequire(join(easCliRoot, 'build/credentials/context.js'));
const { BundleId, CapabilityType } = appleUtilsRequire('@expo/apple-utils');

const easJsonRaw = JSON.parse(readFileSync(join(projectDir, 'eas.json'), 'utf8'));
const buildProfile = easJsonRaw.build.production;

const state = JSON.parse(readFileSync(join(homedir(), '.expo/state.json'), 'utf8'));
const sessionSecret = state.auth?.sessionSecret;
if (!sessionSecret) {
  console.error('Not logged in to Expo. Run: pnpm dlx eas-cli login');
  process.exit(1);
}

const graphqlClient = createGraphqlClient({ sessionSecret });
const actor = {
  id: state.auth.userId,
  username: state.auth.username,
  accounts: [{ id: 'eeba7903-d780-48cb-93fe-de74c573caef', name: 'darksend' }],
  primaryAccount: { id: 'eeba7903-d780-48cb-93fe-de74c573caef', name: 'darksend' },
};

const exp = await getPrivateExpoConfigAsync(projectDir, { env: buildProfile.env ?? {} });
const vcsClient = new GitClient({ requireCommit: false, maybeCwdOverride: repoRoot });
const ctx = new CredentialsContext({
  projectDir,
  projectInfo: { exp, projectId },
  user: actor,
  graphqlClient,
  analytics: { logEvent: () => {} },
  env: buildProfile.env ?? {},
  nonInteractive: true,
  autoAcceptCredentialReuse: false,
  vcsClient,
});
ctx.shouldAskAuthenticateAppStore = false;

const app = await getAppFromContextAsync(ctx);
const account = await getOwnerAccountForProjectIdAsync(graphqlClient, projectId);
const xcodeContext = await resolveXcodeBuildContextAsync(
  { projectDir, exp, nonInteractive: true, vcsClient: ctx.vcsClient },
  buildProfile,
);
const targets = await resolveTargetsAsync({
  exp,
  projectDir,
  xcodeBuildContext: xcodeContext,
  env: buildProfile.env ?? {},
  vcsClient: ctx.vcsClient,
});

const appLookup = { ...app, bundleIdentifier: targets[0].bundleIdentifier };
const target = targets[0];

console.log('Authenticating with App Store Connect API key from EAS…');
const authed = await tryAuthenticateAppStoreWithEasAscApiKeyAsync(
  ctx,
  appLookup,
  AppleTeamType.COMPANY_OR_ORGANIZATION,
);
if (!authed) {
  console.error(
    'Could not authenticate with ASC API key. Ensure an App Store Connect API key is configured for this app on EAS.',
  );
  process.exit(1);
}
console.log('Authenticated with Apple (team:', ctx.appStore.authCtx.team.id, ')');

const appleContext = getRequestContext(ctx.appStore.authCtx);
let bundleId = await BundleId.findAsync(appleContext, { identifier: bundleIdentifier });
if (!bundleId) {
  console.log(`Registering bundle identifier ${bundleIdentifier} on Apple…`);
  await ensureBundleIdExistsAsync(
    ctx.appStore.authCtx,
    {
      accountName: account.name,
      projectName: exp.slug,
      bundleIdentifier: target.bundleIdentifier,
    },
    {
      entitlements: target.entitlements,
      usesBroadcastPushNotifications: exp.ios?.usesBroadcastPushNotifications ?? false,
      parentBundleIdentifier: target.parentBundleIdentifier,
    },
  );
  bundleId = await BundleId.findAsync(appleContext, { identifier: bundleIdentifier });
}
if (!bundleId) {
  console.error(`Could not register ${bundleIdentifier} on Apple Developer Portal.`);
  process.exit(1);
}
const resolvedAppleBundleIdResource = appleBundleIdResource || bundleId.id;
const caps = await bundleId.getBundleIdCapabilitiesAsync();
const hasPush = caps.some((cap) =>
  cap.isType?.(CapabilityType.PUSH_NOTIFICATIONS) ||
  cap.attributes?.capabilityType === CapabilityType.PUSH_NOTIFICATIONS ||
  cap.attributes?.capabilityType === 'PUSH_NOTIFICATIONS',
);

console.log(
  'App ID capabilities on Apple:',
  caps.map((c) => c.attributes?.capabilityType ?? c.id).join(', ') || '(none)',
);

const skipPushCheck = process.env.SHC_INITIAL_SETUP === '1';

if (!hasPush && !skipPushCheck) {
  console.error(`
Push Notifications is NOT enabled on the Apple App ID yet.

EAS "Synced capabilities: Enabled: Push Notifications" is misleading here — the ASC API key
cannot actually turn on push for this bundle ID. You must enable it manually:

1. Open https://developer.apple.com/account/resources/identifiers/bundleId/edit/${resolvedAppleBundleIdResource}
2. Check "Push Notifications" under Capabilities
3. Click Save (confirm "Modify App Capabilities")
4. Re-run: node scripts/regen-ios-push-profile${iosApp === 'mobile-cook' ? '-cook' : ''}.mjs
5. Then: cd apps/${iosApp} && CI=1 pnpm dlx eas-cli build --profile production --platform ios --non-interactive --wait

Alternatively run \`eas credentials -p ios\` interactively and log in with your Apple ID
(cookie auth) to let Expo enable push automatically.

For first-time credential setup only (no push yet), run:
  SHC_INITIAL_SETUP=1 node scripts/regen-ios-push-profile${iosApp === 'mobile-cook' ? '-cook' : ''}.mjs
`);
  process.exit(1);
}

if (!hasPush && skipPushCheck) {
  console.warn(
    'Push not enabled yet — running initial iOS build credential setup only (distribution cert + profile).',
  );
  console.warn(
    `Enable push at https://developer.apple.com/account/resources/identifiers/bundleId/edit/${resolvedAppleBundleIdResource} before shipping push notifications.`,
  );
  console.log('Setting up iOS build credentials…');
  ctx.nonInteractive = false;
  ctx.autoAcceptCredentialReuse = true;
  await new SetUpBuildCredentials({
    app: { account, projectName: exp.slug },
    targets,
    distribution: buildProfile.distribution ?? 'store',
    enterpriseProvisioning: buildProfile.enterpriseProvisioning,
  }).runAsync(ctx);
  console.log('Done — initial iOS credentials are on EAS. Enable push, then re-run without SHC_INITIAL_SETUP.');
  process.exit(0);
}

console.log('Syncing App ID capabilities…');
await ensureBundleIdExistsAsync(
  ctx.appStore.authCtx,
  {
    accountName: account.name,
    projectName: exp.slug,
    bundleIdentifier: target.bundleIdentifier,
  },
  {
    entitlements: target.entitlements,
    usesBroadcastPushNotifications: exp.ios?.usesBroadcastPushNotifications ?? false,
    parentBundleIdentifier: target.parentBundleIdentifier,
  },
);

console.log('Revoking App Store profiles on Apple Developer Portal…');
const applePlatform = getApplePlatformFromTarget(target);
await ctx.appStore.revokeProvisioningProfileAsync(
  target.bundleIdentifier,
  applePlatform,
  ProfileClass.General,
);

console.log('Removing stale App Store provisioning profile from EAS…');
const profile = await getProvisioningProfileAsync(ctx, appLookup, IosDistributionType.AppStore);
if (profile?.id) {
  await new RemoveProvisioningProfiles([appLookup], [profile]).runAsync(ctx);
  console.log('Deleted EAS provisioning profile', profile.id);
}

await new Promise((r) => setTimeout(r, 3000));

console.log('Regenerating provisioning profile…');
await new SetUpBuildCredentials({
  app: { account, projectName: exp.slug },
  targets,
  distribution: buildProfile.distribution ?? 'store',
  enterpriseProvisioning: buildProfile.enterpriseProvisioning,
}).runAsync(ctx);

const buildCredentials = await getBuildCredentialsAsync(ctx, appLookup, IosDistributionType.AppStore);
const profileBase64 = buildCredentials?.provisioningProfile?.provisioningProfile;
if (!profileBase64) {
  console.error('No provisioning profile found after regeneration.');
  process.exit(1);
}
const plist = parseProvisioningProfile(profileBase64);
const aps = plist.Entitlements?.['aps-environment'];
if (!aps) {
  console.error(
    'Provisioning profile still missing aps-environment.',
    'Entitlements:',
    JSON.stringify(plist.Entitlements ?? {}),
  );
  process.exit(1);
}

console.log('Verified aps-environment in profile:', aps);
console.log('Done — push provisioning profile is ready for EAS build.');
