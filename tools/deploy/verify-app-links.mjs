#!/usr/bin/env node
/**
 * Verify the live app-link identity for each environment.
 *
 * The verification files are owned by the infrastructure repo (a dedicated S3
 * origin behind an ordered CloudFront behaviour), while the bundle identifiers
 * that must appear in them are owned here. That split only stays safe if drift
 * is detectable, so this asserts the published identity against the app's.
 *
 * It reads the *public* endpoints — Apple's CDN cache and Google's resolver —
 * rather than S3, because those are what devices actually consult.
 *
 *   node tools/deploy/verify-app-links.mjs
 *   node tools/deploy/verify-app-links.mjs --host outreach.dev.betterangels.la
 */

const TARGETS = [
  { host: 'outreach.betterangels.la', packageName: 'la.betterangels.app' },
  {
    host: 'outreach.dev.betterangels.la',
    packageName: 'la.betterangels.dev.app',
  },
];

const hostFilter = process.argv.includes('--host')
  ? process.argv[process.argv.indexOf('--host') + 1]
  : null;

function selectedTargets() {
  const targets = hostFilter
    ? TARGETS.filter((t) => t.host === hostFilter)
    : TARGETS;

  if (targets.length === 0) {
    throw new Error(
      `Unknown --host "${hostFilter}". Known: ${TARGETS.map((t) => t.host).join(', ')}`,
    );
  }
  return targets;
}

async function checkAppleCdn({ host, packageName }) {
  const response = await fetch(
    `https://app-site-association.cdn-apple.com/a/v1/${host}`,
  );

  if (!response.ok) {
    throw new Error(
      `${host}: Apple's CDN returned ${response.status} for the association file.`,
    );
  }

  const body = await response.json();
  const appIDs = (body?.applinks?.details ?? [])
    .flatMap((detail) => detail.appIDs ?? (detail.appID ? [detail.appID] : []))
    .filter(Boolean);

  if (appIDs.length === 0) {
    throw new Error(
      `${host}: Apple's CDN served an association file with no appIDs.`,
    );
  }

  if (!appIDs.some((appID) => String(appID).endsWith(`.${packageName}`))) {
    throw new Error(
      `${host}: Apple lists [${appIDs.join(', ')}] but this app is "${packageName}". The app identity has drifted from the infra repo.`,
    );
  }

  return appIDs.join(', ');
}

async function checkDigitalAssetLinks({ host, packageName }) {
  const url =
    'https://digitalassetlinks.googleapis.com/v1/statements:list' +
    `?source.web.site=https://${host}` +
    '&relation=delegate_permission/common.handle_all_urls';

  const response = await fetch(url);
  const body = await response.json();

  const packages = (body?.statements ?? [])
    .map((statement) => statement?.target?.androidApp?.packageName)
    .filter(Boolean);

  if (packages.length === 0) {
    throw new Error(
      `${host}: Google found no statements (${body?.debugString?.trim() || 'no debug output'}). Is /.well-known/assetlinks.json being served?`,
    );
  }

  if (!packages.includes(packageName)) {
    throw new Error(
      `${host}: Google lists [${packages.join(', ')}] but this app is "${packageName}". The app identity has drifted from the infra repo.`,
    );
  }

  return packages.join(', ');
}

const results = [];

for (const target of selectedTargets()) {
  try {
    const [apple, google] = await Promise.all([
      checkAppleCdn(target),
      checkDigitalAssetLinks(target),
    ]);
    results.push({ ...target, apple, google, ok: true });
  } catch (error) {
    results.push({ ...target, ok: false, error: error.message });
  }
}

for (const result of results) {
  if (result.ok) {
    console.log(
      `✅ ${result.host}  apple: ${result.apple}  google: ${result.google}`,
    );
  } else {
    console.error(`❌ ${result.error}`);
  }
}

if (results.some((result) => !result.ok)) {
  process.exit(1);
}
