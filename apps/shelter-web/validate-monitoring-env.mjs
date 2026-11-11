import { loadEnv } from 'vite';

const required = [
  'VITE_SHELTER_WEB_NEW_RELIC_LICENSE_KEY',
  'VITE_SHELTER_APP_ENV',
  'VITE_SHELTER_APP_VERSION',
];
const env = loadEnv('production', import.meta.dirname, 'VITE_SHELTER_');
const missing = required.filter(
  (key) => !(process.env[key] || env[key])?.trim(),
);

if (!missing.length) process.exit(0);

const message = `[monitoring] Missing ${missing.join(', ')}`;
if (['true', '1'].includes(process.env.CI ?? '')) {
  console.error(message);
  process.exit(1);
}

console.warn(message);
