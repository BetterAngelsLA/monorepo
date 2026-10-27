import fs from 'fs';
import path from 'path';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
if (!argv.project || !argv.profile) {
  console.error(
    'Usage: write-eas-env.mjs --project <name> --profile <profile> [--out <file>]',
  );
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

// Writes the tracked `.env`, which is what ships inside the EAS archive: the
// build and the update both evaluate app.config.js against it, so the values
// here are the ones EAS resolves. (An untracked `.env.local` does not travel —
// the upload is git-based.) CI rewrites this file and restores it afterwards.
// The web base path is deliberately absent: it belongs to the web export only
// and would otherwise make the native runtime branch-specific.
const envPath = path.resolve(argv.out ?? path.join(projectDir, '.env'));
fs.writeFileSync(
  envPath,
  [...env].map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
);
console.log(`Wrote ${envPath} for ${argv.profile} (${env.size} vars)`);
