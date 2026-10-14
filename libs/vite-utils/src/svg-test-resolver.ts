/**
 * Vite plugin that stubs SVG imports during Vitest runs to avoid
 * cross-package "Denied ID" errors from vite:import-analysis.
 *
 * Must run before vite:import-analysis (enforce: 'pre') and use
 * resolveId (not load) because the Denied ID check happens during
 * module resolution, before the load hook.
 *
 * The stub is served as a virtual module by `load`, so projects don't
 * need their own `src/__mocks__/svgStub.ts` file. SVG loading during
 * dev/build is handled by Vite's native ?raw import support — no plugin
 * needed there.
 */
import type { Plugin } from 'vite';

const SVG_STUB_ID = '\0svg-stub';

/**
 * Returns a Vite plugin that redirects all .svg imports to a shared virtual
 * stub module. Only meant to be used during Vitest runs.
 *
 * Usage (only include during tests):
 *   plugins: [
 *     react(),
 *     ...(process.env.VITEST ? [svgTestResolver()] : []),
 *   ],
 */
export function svgTestResolver(): Plugin {
  return {
    name: 'svg-test-resolver',
    enforce: 'pre' as const,
    resolveId(id: string) {
      // Match .svg and .svg?raw (query params are part of the resolved ID)
      if (id.includes('.svg')) {
        return SVG_STUB_ID;
      }
      return null;
    },
    load(id: string) {
      if (id === SVG_STUB_ID) {
        return 'export default "";';
      }
      return null;
    },
  };
}
