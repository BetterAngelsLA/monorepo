// Reads `eas build:list --json` on stdin and exits 0 when a build already
// exists for the runtime, so CI does not queue a duplicate.
//
// Status is deliberately ignored — this matches the pipeline this replaced:
// the fingerprint *is* the identity of a build, so a fingerprint that exists in
// any state is not built again. That includes a failed build (paying twice for
// the same inputs buys nothing) and a queued one (the binary just is not ready
// yet; the update only needs the runtime it will ship with).
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

    // stderr: stdout is not consumed, but the reasoning belongs in the CI log.
    console.error(
      `build statuses: ${builds.map((build) => String(build?.status ?? '?')).join(', ')}`,
    );
    process.exit(0);
  });
