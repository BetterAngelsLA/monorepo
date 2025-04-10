import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Get the Nx project name (set automatically by Nx)
const project = process.env.NX_TASK_TARGET_PROJECT;
if (!project) {
  console.error('❌ NX_TASK_TARGET_PROJECT not found. Must be run via Nx.');
  process.exit(1);
}

// Get the current git branch name, used if in non-production mode.
function getBranchName() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD')
      .toString()
      .trim();
    return branch.replace(/\//g, '-');
  } catch {
    return 'main';
  }
}

// If the configuration indicates development or preview, set a branch‑based base path; else default to '/'
const basePath = `/branches/${getBranchName()}`;

// Determine the path to the project's .env.local file
const envPath = resolve(process.cwd(), `apps/${project}/.env.local`);
if (!existsSync(resolve(process.cwd(), `apps/${project}`))) {
  console.error(`❌ App folder not found at apps/${project}`);
  process.exit(1);
}

// Write the environment variable to .env.local
writeFileSync(envPath, `VITE_APP_BASE_PATH=${basePath}\n`, 'utf8');
console.log(`✅ [${project}] wrote VITE_APP_BASE_PATH=${basePath}`);
