/**
 * Executes a Node.js script in a **separate process** with a given `TZ` (time zone)
 * environment variable, and returns its standard output as a trimmed string.
 *
 * This helper is used mainly for **time zone–sensitive tests**, e.g. verifying that
 * `Date` formatting or parsing logic behaves consistently across different zones.
 *
 * Example:
 * ```ts
 * const out = runInTZ('America/New_York', require.resolve('./roundTripLocal.cjs'));
 * expect(out).toBe('2026-10-21');
 * ```
 *
 * ## How it works
 * - Spawns a new Node process using the current Node binary (`process.execPath`).
 * - Passes the target script as an argument.
 * - Injects `TZ=<timezone>` into the environment so that all `Date` operations
 *   inside the child process use that zone.
 * - Captures the script's `stdout` and trims it before returning.
 *
 * ## Notes
 * - Works reliably on **Unix/Linux/macOS**, where Node honors the `TZ` variable.
 * - On **Windows**, `TZ` may be ignored by Node, so results can differ or tests
 *   should be skipped.
 * - The target script must print its output to `stdout` and exit cleanly.
 * - Always pass an **absolute path** (e.g. `require.resolve(...)`) to avoid path
 *   resolution errors under Jest/Vitest.
 *
 * ## Typical use case
 * Useful for multi–time zone snapshot tests, ensuring that calendar dates
 * (like "2026-10-21") render the same way in all supported zones.
 */

import { execFileSync } from 'node:child_process';

type TProps = {
  tz: string;
  absScriptPath: string;
  extraEnv?: Record<string, string>;
};

export function runInTZ(props: TProps): string {
  const { tz, absScriptPath, extraEnv = {} } = props;

  const out = execFileSync(process.execPath, [absScriptPath], {
    env: { ...process.env, TZ: tz, ...extraEnv },
    encoding: 'utf8',
  });

  return out.trim();
}
