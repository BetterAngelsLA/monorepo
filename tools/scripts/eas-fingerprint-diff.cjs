const fs = require('fs');

const lines = fs.readFileSync('/tmp/phase.log', 'utf8').split('\n');
for (const line of lines) {
  if (!line.trim() || line[0] !== '{') continue;
  let e;
  try { e = JSON.parse(line); } catch { continue; }
  const msg = e.msg || '';
  if (!msg.includes('Difference between local and EAS fingerprints')) continue;
  const start = msg.indexOf('[');
  const end = msg.lastIndexOf(']');
  if (start < 0 || end < start) continue;
  let ops;
  try { ops = JSON.parse(msg.slice(start, end + 1)); } catch (err) {
    console.log('could not parse diff:', err.message);
    continue;
  }
  for (const op of ops) {
    const src = op.beforeSource || op.source || {};
    const before = src.contents;
    const after = (op.afterSource || {}).contents;
    const walk = (a, b, path) => {
      const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
      for (const k of keys) {
        const p = path ? `${path}.${k}` : k;
        const av = a ? a[k] : undefined;
        const bv = b ? b[k] : undefined;
        if (av && bv && typeof av === 'object' && typeof bv === 'object') walk(av, bv, p);
        else if (JSON.stringify(av) !== JSON.stringify(bv))
          console.log(`  ${p}: local=${JSON.stringify(av)} eas=${JSON.stringify(bv)}`);
      }
    };
    if (before && after && typeof before === 'object') {
      console.log('op', op.op, 'source', src.id);
      walk(before, after, '');
    } else {
      console.log('op', op.op, 'source', src.id, 'type', src.type, 'text', JSON.stringify(before).slice(0, 200), '->', JSON.stringify(after).slice(0, 200));
    }
  }
}
