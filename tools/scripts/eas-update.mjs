/**
 * Publishes the EAS Update for a deploy.
 *
 * Two things are explicit here rather than left to `eas update`:
 *
 * - `--branch`: `--auto` derives the branch from the git branch, and a CI
 *   checkout is a detached HEAD, so it publishes to a branch literally named
 *   "HEAD". The branch name the rest of the pipeline uses (the sanitized
 *   `BRANCH_NAME`) has to be the one the update lands on.
 * - `--environment`: it makes eas-cli load the project's EAS environment
 *   variables while it evaluates `app.config.js`. Skip it and the update is
 *   fingerprinted without them — a different runtime version than the binary
 *   got, so no build ever receives the update. `development` mirrors the
 *   `preview` build profile, `production` the `production` profile.
 *
 * Env:
 *   BRANCH_NAME   EAS Update branch (required)
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import minimist from 'minimist';

import { parseJsonOutput } from './cli-json.mjs';

const argv = minimist(process.argv.slice(2), {
  string: ['project', 'profile'],
});

if (!argv.project || !argv.profile) {
  console.error(
    'Usage: eas-update.mjs --project <name> --profile <preview|production>',
  );
  process.exit(1);
}

const branch = process.env.BRANCH_NAME;
if (!branch) {
  console.error('BRANCH_NAME is required (the EAS Update branch).');
  process.exit(1);
}

// Matches the environment each build profile resolves (apps/betterangels/eas.json).
const environment =
  argv.profile === 'production' ? 'production' : 'development';
const projectDir = path.resolve('apps', argv.project);

// Non-interactive `eas update` insists on a branch *and* a message. `--auto`
// would supply the message but also re-derives the branch, which is what the
// explicit `--branch` is here to prevent, so take the subject ourselves.
function commitSubject() {
  try {
    return execFileSync('git', ['log', '-1', '--pretty=%s'], {
      encoding: 'utf8',
    })
      .trim()
      .slice(0, 200);
  } catch {
    return '';
  }
}
const message = commitSubject() || `Deploy ${branch}`;

let raw;
try {
  raw = execFileSync(
    'eas',
    [
      'update',
      '--branch',
      branch,
      '--message',
      message,
      '--environment',
      environment,
      '--platform',
      'all',
      '--non-interactive',
      '--json',
    ],
    { cwd: projectDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
} catch (error) {
  if (error.stdout) process.stdout.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  console.error(`eas update failed for ${branch} (${environment}).`);
  process.exit(1);
}

let updates;
try {
  updates = parseJsonOutput(raw);
} catch (error) {
  // The update may already be published; report what came back instead of a
  // bare SyntaxError.
  console.error(`Could not parse eas update output: ${error.message}`);
  console.error(raw.slice(0, 500));
  process.exit(1);
}

if (!Array.isArray(updates) || updates.length === 0) {
  console.error(`eas update returned no updates for ${branch}.`);
  process.exit(1);
}

// Summary on stderr, the raw `eas update --json` payload on stdout: callers
// parse stdout (tools/scripts/eas-e2e.ts needs the group id) and a summary line
// in the middle of it would have to be skipped by hand.
console.error(`Published an update to ${branch} (${environment} environment):`);
for (const update of updates) {
  // The runtime is the contract with the binary: it must be the one the build
  // for this commit carries, or the update is never applied.
  console.error(
    `  ${update.platform}: runtime ${update.runtimeVersion} · group ${update.group} · update ${update.id}`,
  );
}

console.log(JSON.stringify(updates));
