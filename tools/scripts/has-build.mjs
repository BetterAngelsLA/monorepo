// Reads `eas build:list --json` from stdin and exits 0 when a usable build
// exists for the runtime, so CI does not queue a duplicate.
//
// Statuses matter. EAS reports them upper-case ("FINISHED", "IN_QUEUE",
// "ERRORED"): a finished or queued build is reusable, a failed or canceled one
// is not — and the list is not filtered by status, so a failed newest build
// must not hide an older finished one. Rank rather than look at [0].
const FINISHED = 'FINISHED';
const QUEUED = new Set(['NEW', 'IN_QUEUE', 'IN_PROGRESS']);

const rank = (status) => {
  const value = String(status ?? '').toUpperCase();
  if (value === FINISHED) return 2;
  if (QUEUED.has(value)) return 1;
  return 0;
};

let raw = '';

process.stdin
  .on('data', (chunk) => {
    raw += chunk;
  })
  .on('end', () => {
    // EAS prints notices (e.g. "eas-cli is now available") before the JSON.
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start < 0 || end < start) process.exit(1);

    let builds;
    try {
      builds = JSON.parse(raw.slice(start, end + 1));
    } catch {
      process.exit(1);
    }
    if (!Array.isArray(builds) || builds.length === 0) process.exit(1);

    const statuses = builds.map((build) => String(build?.status ?? '?'));
    const best = Math.max(...builds.map((build) => rank(build.status)));
    // stderr: stdout is not consumed, but the reasoning belongs in the CI log.
    console.error(`build statuses: ${statuses.join(', ')}`);
    process.exit(best > 0 ? 0 : 1);
  });
