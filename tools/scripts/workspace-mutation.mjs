/**
 * Files CI rewrites in the working tree for EAS.
 *
 * One list, because `restore-workspace.mjs` has to undo exactly this — a file
 * mutated but not restored leaks an EAS-shaped workspace into later steps.
 * `copy-lockfile` rewrites the manifests. The tracked `.env` is no longer
 * rewritten for EAS; the profile env comes from the EAS environment.
 */
export const workspaceMutations = (project) => [
  'package.json',
  `apps/${project}/package.json`,
];
