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

// Writes the tracked `.env`, which is what ships inside the EAS archive: the
// build and the update both evaluate app.config.js against it, so the values
// here are the ones EAS resolves. (An untracked `.env.local` does not travel —
// the upload is git-based.) CI rewrites this file and restores it afterwards.
// The web base path is deliberately absent: it belongs to the web export only
// and would otherwise make the native runtime branch-specific.
// `--print` emits `export` statements instead of a file. The file alone is not
// enough: Nx resolves a task's environment from dotenv files *before* its
// dependencies run, so a dependency that rewrites `.env` is invisible to the
// dependent. Exporting the same values into the shell first means Nx finds them
// already set and its file-loading (which never overrides) leaves them alone.
if (argv.print) {
  // No `process.exit` here: stdout to a pipe is asynchronous, and exiting
  // straight after the write can truncate it, which the caller would happily
  // `eval` as a partial environment.
  const quote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;
  process.stdout.write(
    `${[...env].map(([key, value]) => `export ${key}=${quote(value)}`).join('\n')}\n`,
  );
} else {
  const envPath = path.resolve(argv.out ?? path.join(projectDir, '.env'));
  fs.writeFileSync(
    envPath,
    [...env].map(([key, value]) => `${key}=${value}`).join('\n') + '\n',
  );
  console.log(`Wrote ${envPath} for ${argv.profile} (${env.size} vars)`);
}
