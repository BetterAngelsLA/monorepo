import { readFileSync } from 'node:fs';
import { sep } from 'node:path';
import { Plugin } from 'vite';

// treat .svg as raw text
export function rawSvgPlugin(): Plugin {
  return {
    name: 'raw-svg-like-webpack',
    enforce: 'pre', // run before Vite's asset/SVGR handling
    load(id) {
      // ignore node_modules and non-svg files
      if (!id.endsWith('.svg') || id.includes(`${sep}node_modules${sep}`))
        return null;

      const svg = readFileSync(id, 'utf8');
      return { code: `export default ${JSON.stringify(svg)};`, map: null };
    },
  };
}
