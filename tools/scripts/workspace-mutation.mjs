/**
 * Files `eas-build-pre-install.mjs` rewrites for EAS Build.
 *
 * One list, because `restore-workspace.mjs` has to undo exactly this — a file
 * mutated but not restored leaks an EAS-shaped workspace into later steps.
 */
export const workspaceMutations = (project) => [
  'package.json',
  `apps/${project}/package.json`,
];
