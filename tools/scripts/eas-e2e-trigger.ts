/**
 * EAS E2E Trigger Script (single-project)
 *
 * Triggers Maestro E2E tests on EAS Workflows for a single NX project.
 * Intended to be wired as an NX target (`eas-e2e`) and invoked via:
 *   yarn nx affected -t eas-e2e          (all affected projects)
 *   yarn nx run betterangels:eas-e2e     (specific project)
 *
 * Flow:
 *   1. Read slug + project ID from deploy results or app.config.js
 *   2. Check for an existing EAS update on the branch (fast path)
 *   3. If none, set up .env, compute fingerprint, publish an update
 *   4. Write .env metadata for the EAS workflow
 *   5. Trigger `eas workflow:run .eas/workflows/e2e-test.yml`
 *   6. Output JSON result to stdout for the CI workflow to consume
 *
 * Usage (via NX target):
 *   yarn nx run <project>:eas-e2e --args="--branch=<ref> --sha=<commit>"
 *
 * Required env vars:
 *   EXPO_TOKEN          - EAS authentication token
 *
 * Optional env vars:
 *   EAS_ACCOUNT         - EAS account name (default: better-angels)
 *
 * EXPO_PUBLIC_* secrets (passed from CI):
 *   Same as eas-deploy.ts — needed when creating a new update.
 */

import {
  EAS_ACCOUNT,
  UpdateResult,
  argv,
  cleanupEnv,
  readProjectConfig,
  resolveProjectDir,
  runJson,
  setupEnvAndFingerprint,
  triggerEasWorkflow,
  writeE2eMetadata,
} from './eas-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UpdateListEntry {
  group: string;
  runtimeVersion: string;
}

interface UpdateListResponse {
  currentPage: UpdateListEntry[];
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(): { project: string; branch: string; sha: string } {
  const { project, branch, sha } = argv;
  if (!project || !branch || !sha) {
    console.error(
      'Usage: eas-e2e-trigger.ts --project <name> --branch <ref> --sha <commit>'
    );
    process.exit(1);
  }
  return { project, branch, sha };
}

// ---------------------------------------------------------------------------
// Check for existing update (fast path)
// ---------------------------------------------------------------------------

function checkExistingUpdate(
  projectDir: string,
  branch: string
): { groupId: string; runtimeVersion: string } | null {
  console.log(`Checking for existing EAS update on branch '${branch}'...`);
  try {
    const result = runJson<UpdateListResponse>(
      `npx eas-cli update:list --branch "${branch}" --limit 1 --json --non-interactive`,
      { cwd: projectDir }
    );
    const entry = result?.currentPage?.[0];
    if (entry?.group && entry?.runtimeVersion) {
      console.log(
        `Found existing update: group=${entry.group}, runtime=${entry.runtimeVersion}`
      );
      return { groupId: entry.group, runtimeVersion: entry.runtimeVersion };
    }
  } catch {
    console.log('No existing update found (or query failed).');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Create update (slow path)
// ---------------------------------------------------------------------------

function createUpdate(
  project: string,
  projectDir: string,
  branch: string
): { groupId: string; runtimeVersion: string } {
  console.log(`Creating EAS update for ${project} on branch '${branch}'...`);

  const updateData = runJson<UpdateResult[]>(
    `yarn nx run ${project}:eas-update --branch "${branch}" --auto --json --interactive false`
  );

  if (!updateData.length) {
    throw new Error('EAS update returned empty result');
  }

  return {
    groupId: updateData[0].group,
    runtimeVersion: updateData[0].runtimeVersion,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { project, branch, sha } = parseArgs();

  const projectDir = resolveProjectDir(project);

  // 1. Read project config (slug, projectId)
  const { slug, projectId } = readProjectConfig(projectDir);
  console.log(`slug=${slug}, projectId=${projectId}`);

  // 2. Check for existing update (fast path)
  let groupId: string;
  let runtimeVersion: string;

  const existing = checkExistingUpdate(projectDir, branch);
  if (existing) {
    groupId = existing.groupId;
    runtimeVersion = existing.runtimeVersion;
  } else {
    // 3. Slow path: setup env, compute fingerprint, create update
    runtimeVersion = setupEnvAndFingerprint(projectDir, 'preview');
    const updateResult = createUpdate(project, projectDir, branch);
    groupId = updateResult.groupId;
    if (updateResult.runtimeVersion) {
      runtimeVersion = updateResult.runtimeVersion;
    }
  }

  // 4. Write metadata + trigger EAS E2E workflow
  writeE2eMetadata(projectDir, {
    runtimeVersion,
    projectId,
    groupId,
    slug,
    sha,
    statusContext: `${project} E2E Tests`,
    account: EAS_ACCOUNT,
  });

  const workflowUrl = triggerEasWorkflow(projectDir, EAS_ACCOUNT, slug);

  // 5. Clean up
  cleanupEnv(projectDir);

  // 6. Output structured result for CI consumption
  const result = { project, workflowUrl: workflowUrl || '' };
  // Emit a tagged JSON line the workflow can parse from combined NX output
  console.log(`E2E_RESULT:${JSON.stringify(result)}`);
}

main();
