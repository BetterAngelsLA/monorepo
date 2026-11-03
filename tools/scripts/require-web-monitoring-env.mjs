// A web build with monitoring switched off looks exactly like a healthy build
// until somebody notices the dashboard is empty. In CI, refuse to build without
// it; locally, say so and continue so nobody needs a New Relic key to run the app.
//
// Both variables are required: the license key enables the agent, and
// EXPO_PUBLIC_APP_ENV is the `environment` attribute every dashboard widget
// filters on. Monitoring is expected in every deployed environment, including
// preview/development, not only production.
const REQUIRED = [
  'EXPO_PUBLIC_NEW_RELIC_WEB_LICENSE_KEY',
  'EXPO_PUBLIC_APP_ENV',
];

const isCI = process.env.CI === 'true' || process.env.CI === '1';
const missing = REQUIRED.filter((name) => !process.env[name]);

if (missing.length === 0) {
  process.exit(0);
}

const detail = missing
  .map((name) =>
    name === 'EXPO_PUBLIC_NEW_RELIC_WEB_LICENSE_KEY'
      ? `${name} (GitHub secret of the same name)`
      : name,
  )
  .join(', ');

if (isCI) {
  console.error(
    `[monitoring] Missing ${detail}. Refusing to build a web bundle with browser monitoring disabled.`,
  );
  process.exit(1);
}

console.warn(
  `[monitoring] Missing ${detail}. Browser monitoring is disabled for this local build.`,
);
