import { readFileSync } from 'fs';

try {
  const raw = readFileSync(process.argv[2], 'utf8');
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start < 0 || end < start) process.exit(1);
  const builds = JSON.parse(raw.slice(start, end + 1));
  process.exit(Array.isArray(builds) && builds.length > 0 ? 0 : 1);
} catch {
  process.exit(1);
}
