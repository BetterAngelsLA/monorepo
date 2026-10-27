#!/usr/bin/env node
/**
 * The `ci-e2e` suites to run: those whose app this run deployed.
 *
 * A suite that tests a deployed app has no meaning when that app was not
 * deployed for this branch — its config would fall back to a local dev server,
 * and running the specs against a different environment produces failures that
 * say nothing about the change (the map specs need the deployed site). Prints the
 * projects comma-separated for `nx run-many --projects=`, and the skips with a
 * reason on stderr.
 *
 * The app under test is the suite's `implicitDependencies`, so nothing is named
 * twice: `shelter-e2e` declares `shelter-web` in its project file.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const deployed = String(process.env.PREVIEW_DEPLOYED_APPS ?? '')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const projects = execFileSync(
  'yarn',
  ['nx', 'show', 'projects', '--projects=tag:ci-e2e'],
  { encoding: 'utf8' },
)
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const appsOf = (project) => {
  try {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'apps', project, 'project.json'), 'utf8'),
    );
    return manifest.implicitDependencies ?? [];
  } catch {
    return [];
  }
};

const run = [];
const skipped = [];
for (const project of projects) {
  const apps = appsOf(project);
  if (apps.length === 0 || apps.some((app) => deployed.includes(app))) {
    run.push(project);
  } else {
    skipped.push(`${project} (${apps.join(', ')} not deployed for this run)`);
  }
}

for (const reason of skipped) console.error(`Skipping ${reason}.`);
console.log(run.join(','));
