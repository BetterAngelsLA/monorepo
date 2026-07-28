/**
 * Vite plugin that stubs SVG imports during Vitest runs to avoid
 * cross-package "Denied ID" errors from vite:import-analysis.
 *
 * Must run before vite:import-analysis (enforce: 'pre') and use
 * resolveId (not load) because the Denied ID check happens during
 * module resolution, before the load hook.
 *
 * Only activates when process.env.VITEST is set (Vitest runtime).
 */
import path from 'path';
import type { Plugin } from 'vite';

/**
 * Returns a Vite plugin that redirects all .svg imports to a local
 * stub file during test runs. During dev/build this is a no-op.
 *
 * @param appDir - absolute path to the app directory (e.g. __dirname from vite.config)
 */
export function svgTestResolverPlugin(appDir: string): Plugin {
  return {
    name: 'vitest-svg-resolver',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id.endsWith('.svg')) {
        return path.resolve(appDir, 'src/__mocks__/svgStub.ts');
      }
      return null;
    },
  };
}

/**
 * Conditionally includes the SVG test resolver plugin.
 * Returns an array containing the plugin during Vitest runs,
 * or an empty array during dev/build.
 *
 * Usage:
 *   plugins: [react(), rawSvgPlugin(), ...svgTestResolverIfVitest(__dirname)]
 */
export function svgTestResolverIfVitest(appDir: string): Plugin[] {
  return process.env.VITEST ? [svgTestResolverPlugin(appDir)] : [];
}
