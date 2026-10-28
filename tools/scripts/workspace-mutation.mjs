/**
 * Files CI rewrites in the working tree for EAS.
 *
 * One list, because `restore-workspace.mjs` has to undo exactly this — a file
 * mutated but not restored leaks an EAS-shaped workspace into later steps.
 * `copy-lockfile` rewrites the manifests; `write-eas-env` rewrites the tracked
 * `.env` with the profile's values.
 */
export const workspaceMutations = (project) => [
  'package.json',
  `apps/${project}/package.json`,
  `apps/${project}/.env`,
];
