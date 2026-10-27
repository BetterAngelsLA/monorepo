import fs from 'fs';
import path from 'path';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
if (!argv.project || !argv.profile) {
  console.error('Usage: write-eas-env.mjs --project <name> --profile <profile>');
  process.exit(1);
}

const projectDir = path.resolve(process.cwd(), 'apps', argv.project);
const env = new Map();

for (const [key, value] of Object.entries(process.env)) {
  if (
    (key.startsWith('EXPO_PUBLIC_') ||
      key.startsWith('MAESTRO_') ||
      key === 'APP_VARIANT') &&
    value
  ) {
    env.set(key, value);
  }
}

const easJson = JSON.parse(
  fs.readFileSync(path.join(projectDir, 'eas.json'), 'utf8'),
);
for (const [key, value] of Object.entries(
  easJson.build?.[argv.profile]?.env ?? {},
)) {
  env.set(key, String(value));
}

// `.env.local` rather than the committed `.env`: Expo loads it with higher
// precedence, it is gitignored, and EAS still uploads it (`.easignore` does not
// exclude it), so the build sees exactly what the fingerprint was computed
// from. The web base path is deliberately absent — it belongs to the web
// export only and would otherwise make the native runtime branch-specific.
const envPath = path.join(projectDir, '.env.local');
fs.writeFileSync(
  envPath,
  [...env].map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
);
console.log(`Wrote ${envPath} for ${argv.profile} (${env.size} vars)`);
