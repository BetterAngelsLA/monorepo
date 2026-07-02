import type { Plugin } from 'vite';

/**
 * Injects <base href> into the HTML head using VITE_APP_BASE_PATH.
 *
 * Vite's `base` option rewrites asset paths but does NOT inject a <base href>
 * tag. This plugin bridges the gap — it inserts the tag before </head> during
 * the build, reading the base path from Nx-loaded environment variables.
 */
export function baseHrefPlugin(): Plugin {
  return {
    name: 'html-base-href',
    transformIndexHtml(html) {
      const basePath = process.env.VITE_APP_BASE_PATH || '/';
      return html.replace(
        '</head>',
        `  <base href="${basePath}" />\n  </head>`
      );
    },
  };
}
