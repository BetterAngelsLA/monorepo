/**
 * Parse the JSON a CLI printed, past whatever it printed around it.
 *
 * `eas`, `nx` and `expo` print notices, ANSI styling and trailing summaries
 * around their `--json` payload, so stdout is not JSON. Scan for the first
 * bracket that opens a value which parses — from there to the end of the output,
 * or to the last matching close bracket when a summary follows.
 *
 * No dependencies: `node --test` runs the modules that import this directly.
 */

// CSI sequences (colours, cursor moves). A raw ESC contains `[`, which would
// otherwise look like the start of a JSON array.
const ANSI = /\u001B\[[0-?]*[ -/]*[@-~]/g;

export function parseJsonOutput(raw) {
  const text = String(raw).replace(ANSI, '');
  for (let i = 0; i < text.length; i++) {
    const open = text[i];
    if (open !== '[' && open !== '{') continue;
    const lastClose = text.lastIndexOf(open === '[' ? ']' : '}');
    if (lastClose <= i) continue;
    // Fast path: nothing but the payload (and whitespace) follows.
    try {
      return JSON.parse(text.slice(i));
    } catch {
      // A summary line trails the payload; fall back to the bracket range.
    }
    try {
      return JSON.parse(text.slice(i, lastClose + 1));
    } catch {
      // Not a value start after all — keep scanning.
    }
  }
  throw new Error(`No JSON in output: ${text.slice(0, 200)}`);
}

/**
 * The update groups in an `eas update:list --json` payload.
 *
 * That command does not print the groups as the payload: it prints the branch
 * wrapper `{ name, id, currentPage: [...] }`. The naive first-`[`-to-last-`]`
 * slice every caller used to do happened to grab that inner array, so parsing
 * the object properly means unwrapping it here.
 */
export function updateGroups(payload) {
  return Array.isArray(payload) ? payload : (payload?.currentPage ?? []);
}
