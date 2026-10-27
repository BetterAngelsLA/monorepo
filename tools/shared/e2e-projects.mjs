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
 * The suite/app relationship is Nx's: a suite carries the `ci-e2e` tag and names
 * the app it tests through `implicitDependencies`, so nothing is declared twice
 * and the graph answers both questions. "Was it deployed in *this* run" is
 * runtime state the graph cannot express; that is the one condition applied here.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const deployed = String(process.env.PREVIEW_DEPLOYED_APPS ?? '')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

// The graph, not the project files: it carries the tags and the implicit
// dependencies (including any a plugin contributes) in one query.
const graphFile = join(mkdtempSync(join(tmpdir(), 'nx-graph-')), 'graph.json');
execFileSync('yarn', ['nx', 'graph', '--file', graphFile], { stdio: 'ignore' });
const { graph } = JSON.parse(readFileSync(graphFile, 'utf8'));

const appsOf = (project) =>
  (graph.dependencies[project] ?? [])
    .filter(({ type }) => type === 'implicit' || type === 'static')
    .map(({ target }) => target);

const suites = Object.keys(graph.nodes).filter((name) =>
  (graph.nodes[name].data?.tags ?? []).includes('ci-e2e'),
);

const run = [];
const skipped = [];
for (const project of suites) {
  const apps = appsOf(project);
  if (apps.length === 0 || apps.some((app) => deployed.includes(app))) {
    run.push(project);
  } else {
    skipped.push(`${project} (${apps.join(', ')} not deployed for this run)`);
  }
}

for (const reason of skipped) console.error(`Skipping ${reason}.`);
console.log(run.join(','));
