// Reads `eas build:list --json` from stdin and exits 0 when a usable build
// exists. Queued builds count; errored and canceled ones do not. EAS prints
// notices (e.g. "eas-cli is now available") before the JSON, so slice from the
// first `[` to the last `]`.
const UNUSABLE = new Set(['errored', 'canceled']);

let raw = '';

process.stdin
  .on('data', (chunk) => {
    raw += chunk;
  })
  .on('end', () => {
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start < 0 || end < start) process.exit(1);
    let builds;
    try {
      builds = JSON.parse(raw.slice(start, end + 1));
    } catch {
      process.exit(1);
    }
    if (!Array.isArray(builds)) process.exit(1);
    process.exit(
      builds.some((build) => !UNUSABLE.has(build?.status)) ? 0 : 1,
    );
  });
