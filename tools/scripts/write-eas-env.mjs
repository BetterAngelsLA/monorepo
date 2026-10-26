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
      key === 'EXPO_BASE_URL' ||
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

fs.writeFileSync(
  path.join(projectDir, '.env'),
  [...env].map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
);
console.log(`Wrote ${projectDir}/.env for ${argv.profile} (${env.size} vars)`);
