/**
 * Script: generate-storybook-head.js
 * -----------------------------------
 * This script generates the Storybook head files (`manager-head.html` and `preview-head.html`)
 * with the appropriate <base href="..."> tag, based on the VITE_APP_BASE_PATH set in `.env.local`.
 * The manager/preview-head.html files are used by Storybook to inject <base href=VITE_APP_BASE_PATH />
 * into the main html document.
 *
 * It is intended to be run as an Nx target using the environment variable `NX_TASK_TARGET_PROJECT`,
 * which is automatically set by Nx when you run the script as a target for a specific project.
 *
 * Prerequisites:
 * - `.env.local` must exist at `apps/<project>/.env.local` and contain a valid `VITE_APP_BASE_PATH`.
 * - The project must be a Storybook app with `.storybook/` directory.
 *
 * Example usage (via Nx target):
 *   nx run storybook-react:generate-head
 */

import { config } from 'dotenv';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const project = process.env.NX_TASK_TARGET_PROJECT;
if (!project) {
  console.error('❌ NX_TASK_TARGET_PROJECT not found. Must be run via Nx.');
  process.exit(1);
}

const envPath = resolve(process.cwd(), `apps/${project}/.env.local`);
config({ path: envPath });

const basePath = process.env.VITE_APP_BASE_PATH;
if (!basePath) {
  console.error(`❌ VITE_APP_BASE_PATH not set in ${envPath}`);
  process.exit(1);
}

const headDir = resolve(process.cwd(), `apps/${project}/.storybook`);

if (!existsSync(headDir)) {
  console.error(`❌ .storybook folder not found at: ${headDir}`);
  process.exit(1);
}

const baseTag = `<base href="${
  basePath.endsWith('/') ? basePath : basePath + '/'
}" />\n`;

['manager-head.html', 'preview-head.html'].forEach((file) => {
  const outPath = resolve(headDir, file);
  writeFileSync(outPath, baseTag, 'utf8');
  console.log(`✅ [${project}] wrote ${file} with basePath [${basePath}]`);
});
