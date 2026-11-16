/**
 * Build-time monitoring env guard shared by the Vite and Expo configs.
 *
 * Callers pass the env object they already loaded (Vite `loadEnv` or Expo
 * `process.env`), so this module never reads `.env` itself. The caller also
 * decides which variables are required for its target.
 */
export function assertMonitoringEnv({ label, required, env, isCI }) {
  const missing = required.filter((name) => !String(env[name] ?? '').trim());
  if (missing.length === 0) return;

  const detail = missing
    .map((name) =>
      name.endsWith('LICENSE_KEY')
        ? `${name} (GitHub secret of the same name)`
        : name,
    )
    .join(', ');
  const message = `[${label}] Missing ${detail}`;

  if (isCI) {
    throw new Error(`${message}. Refusing to build.`);
  }

  console.warn(
    `${message}. Continuing locally; monitoring will stay disabled.`,
  );
}
