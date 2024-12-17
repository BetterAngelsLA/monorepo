/**
 * stringifies content from raw .svg files
 */
import fs from 'fs';
import { Plugin } from 'vite';

export function rawSvgPlugin(): Plugin {
  return {
    name: 'raw-svg-plugin',
    enforce: 'pre', // Ensure this runs before default asset processing
    load(id) {
      if (id.endsWith('.svg')) {
        // Read the content of the SVG file and return it as a raw string
        const svgContent = fs.readFileSync(id, 'utf-8');

        return `export default ${JSON.stringify(svgContent)}`;
      }

      return null; // Ensure non-SVG files are handled normally
    },
  };
}
