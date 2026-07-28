/**
 * Vite plugin that stubs SVG imports during Vitest runs to avoid
 * cross-package "Denied ID" errors from vite:import-analysis.
 *
 * Must run before vite:import-analysis (enforce: 'pre') and use
 * resolveId (not load) because the Denied ID check happens during
 * module resolution, before the load hook.
 *
 * SVG loading during dev/build is handled by Vite's native ?raw import
 * support — no plugin needed.
 */
import path from 'path';
import type { Plugin } from 'vite';

/**
 * Returns a Vite plugin that redirects all .svg imports to a local
 * stub file. Only meant to be used during Vitest runs.
 *
 * Usage (only include during tests):
 *   plugins: [
 *     react(),
 *     ...(process.env.VITEST ? [svgTestResolver(__dirname)] : []),
 *   ],
 */
export function svgTestResolver(appDir: string): Plugin {
  return {
    name: 'svg-test-resolver',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id.endsWith('.svg')) {
        return path.resolve(appDir, 'src/__mocks__/svgStub.ts');
      }
      return null;
    },
  };
}
