/**
 * Computes the EAS runtime version before any workspace-mutating task runs.
 *
 * `sync-deps` and `copy-lockfile` change the app tree, and the EAS builds are
 * keyed to the fingerprint of the pre-sync tree. Running this as its own Nx
 * target, ordered before those tasks, keeps the runtime stable while still
 * letting `eas-deploy` and the web `deploy` share one parallel graph.
 *
 * It also writes apps/<project>/.env for the profile. `eas-deploy` reads the
 * runtime from .nx/eas-fingerprint/<project>-<profile>.runtime.
 *
 * Usage:
 *   npx ts-node tools/scripts/eas-fingerprint.ts --project betterangels --profile preview
 */
import * as fs from 'fs';
import * as path from 'path';

import { argv, resolveProjectDir, setupEnvAndFingerprint } from './eas-utils';

function main(): void {
  const { project, profile } = argv;

  if (!project || !profile) {
    console.error(
      'Usage: eas-fingerprint.ts --project <name> --profile <profile>',
    );
    process.exit(1);
  }

  const projectDir = resolveProjectDir(project);
  const runtimeVersion = setupEnvAndFingerprint(projectDir, profile);

  const outDir = path.resolve(process.cwd(), '.nx/eas-fingerprint');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${project}-${profile}.runtime`);
  fs.writeFileSync(outFile, `${runtimeVersion}\n`);

  console.log(
    `EAS runtime version (${project}, ${profile}): ${runtimeVersion}`,
  );
  console.log(`Wrote ${outFile}`);
}

main();
