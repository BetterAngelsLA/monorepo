// Reads `eas build:list --json` from stdin and exits 0 when at least one
// finished build exists. EAS prints notices (e.g. "eas-cli is now available")
// before the JSON, so slice from the first `[` to the last `]`.
let raw = '';

process.stdin
  .on('data', (chunk) => {
    raw += chunk;
  })
  .on('end', () => {
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start < 0 || end < start) process.exit(1);
    try {
      const builds = JSON.parse(raw.slice(start, end + 1));
      process.exit(Array.isArray(builds) && builds.length > 0 ? 0 : 1);
    } catch {
      process.exit(1);
    }
  });
