/**
 * Vite plugin that reads tsconfig.base.json paths and adds them as resolve.alias.
 *
 * Needed because Vite 8's Rolldown bundler doesn't resolve tsconfig paths from
 * plugins (vite-tsconfig-paths) or the native resolve.tsconfigPaths option during
 * the bundling phase — only during the transform phase. resolve.alias is the only
 * mechanism that Rolldown respects.
 *
 * TODO: Remove when Vite PR #22533 lands and resolve.tsconfigPaths accepts
 *       { configFile: string }, allowing us to do:
 *         resolve: { tsconfigPaths: { configFile: '../../tsconfig.base.json' } }
 *
 * Usage in vite.config.ts:
 *   import { monorepoTsconfigAliases } from '../../tools/vite/monorepo-aliases';
 *   export default defineConfig({
 *     plugins: [...],
 *     resolve: { alias: monorepoTsconfigAliases() },
 *   });
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Alias } from 'vite';

export function monorepoTsconfigAliases(workspaceRoot: string): Alias[] {
  const tsconfigPath = path.resolve(workspaceRoot, 'tsconfig.base.json');

  // Strip comments (JSONC) before parsing
  const raw = fs.readFileSync(tsconfigPath, 'utf-8');
  const json = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const tsconfig = JSON.parse(json);
  const paths: Record<string, string[]> = tsconfig.compilerOptions?.paths ?? {};

  const aliases: Alias[] = [];

  for (const [alias, targets] of Object.entries(paths)) {
    // Wildcard aliases (e.g. @betterangels/*) — use prefix matching
    if (alias.endsWith('/*')) {
      const prefix = alias.slice(0, -2);
      const targetDir = targets[0].replace(/\/\*$/, '');
      aliases.push({
        find: new RegExp(`^${escapeRegex(prefix)}/(.+)`),
        replacement: path.resolve(workspaceRoot, `${targetDir}/$1`),
      });
      continue;
    }

    // Exact aliases — use regex anchored at both ends to prevent prefix collisions
    // e.g. @monorepo/ba-platform must NOT match @monorepo/ba-platform/permissions
    aliases.push({
      find: new RegExp(`^${escapeRegex(alias)}$`),
      replacement: path.resolve(workspaceRoot, targets[0]),
    });
  }

  return aliases;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}
