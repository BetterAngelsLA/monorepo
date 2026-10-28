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
// An unknown profile would otherwise resolve to just the `EXPO_PUBLIC_*` values
// from the environment — no `APP_VARIANT`, no API URL — and the caller would
// export with whatever the tracked `.env` happens to say.
if (!easJson.build?.[argv.profile]) {
  console.error(
    `Unknown profile "${argv.profile}" for ${argv.project} (eas.json has: ${Object.keys(easJson.build ?? {}).join(', ')})`,
  );
  process.exit(1);
}
for (const [key, value] of Object.entries(
  easJson.build?.[argv.profile]?.env ?? {},
)) {
  env.set(key, String(value));
}

// Every profile sets this, and a profile that loses it would otherwise export
// with `undefined` inlined and nothing at runtime to notice.
if (!env.get('EXPO_PUBLIC_API_URL')) {
  console.error(`No EXPO_PUBLIC_API_URL resolved for ${argv.profile}`);
  process.exit(1);
}

// The tracked `.env` ships inside the EAS archive; `.env.local` does not travel.
// `--print` also emits `export` lines: Nx fills a task's env before its
// dependencies run and never overrides what is set.
// The web base path is absent on purpose — it would make the native runtime
// branch-specific.
const envPath = path.resolve(argv.out ?? path.join(projectDir, '.env'));
fs.writeFileSync(
  envPath,
  [...env].map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
);

if (argv.print) {
  // No `process.exit` here: exiting can truncate a piped stdout, and the caller
  // would `eval` a partial environment.
  const quote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;
  process.stdout.write(
    `${[...env].map(([key, value]) => `export ${key}=${quote(value)}`).join('\n')}\n`,
  );
} else {
  console.log(`Wrote ${envPath} for ${argv.profile} (${env.size} vars)`);
}
