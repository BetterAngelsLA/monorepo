import path from 'path';
import type { Plugin } from 'vite';

function norm(p: string) {
  return p.split(path.sep).join('/');
}

/**
 * Appends '?react' to .svg requests *only* when the importer is under a given root.
 * This lets RN libs get component SVGs without changing source code.
 */
export function appendReactQueryForRnSvg(rnRootAbs: string): Plugin {
  const rnRoot = norm(rnRootAbs);
  return {
    name: 'append-react-query-for-rn-svg',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!importer || !source.endsWith('.svg')) return null;
      if (/\?(react|raw|url)(?:$|&)/.test(source)) return null; // already explicit
      const imp = norm(importer);
      if (imp.includes(rnRoot)) {
        // Rewrite to request component transform
        return this.resolve(`${source}?react`, importer, { skipSelf: true });
      }
      return null;
    },
  };
}
