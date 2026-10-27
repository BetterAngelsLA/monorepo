/**
 * Run with: node --test tools/scripts/build-rank.test.mjs
 * (the `tools-scripts:test` target globs `tools/scripts/*.test.mjs`).
 *
 * These cover the rule that decides which build of a fingerprint gets reported
 * and reused: a fingerprint can hold a failed attempt, a retry, and a canceled
 * duplicate, all sharing one runtime.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { bestBuild, isDeadBuild, rankBuild } from './build-rank.mjs';

describe('rankBuild', () => {
  it('prefers a finished build over anything else', () => {
    assert.ok(rankBuild('FINISHED') > rankBuild('IN_PROGRESS'));
    assert.ok(rankBuild('FINISHED') > rankBuild('ERRORED'));
  });

  it('treats in-flight states equally, above dead ones', () => {
    for (const status of ['NEW', 'IN_QUEUE', 'IN_PROGRESS']) {
      assert.equal(rankBuild(status), rankBuild('NEW'));
      assert.ok(rankBuild(status) > rankBuild('CANCELED'));
    }
  });

  it('is case-insensitive and tolerant of missing statuses', () => {
    assert.equal(rankBuild('finished'), rankBuild('FINISHED'));
    assert.equal(rankBuild(undefined), 0);
    assert.equal(rankBuild(null), 0);
  });
});

describe('bestBuild', () => {
  it('ignores a newer canceled duplicate in favour of the finished build', () => {
    // EAS lists newest first, so the canceled duplicate comes first — exactly the
    // state that produced a "CANCELED" preview comment and an undefined update
    // link.
    const builds = [
      { id: 'canceled', status: 'CANCELED' },
      { id: 'finished', status: 'FINISHED' },
    ];
    assert.equal(bestBuild(builds).id, 'finished');
  });

  it('keeps the first (newest) build within the same rank', () => {
    const builds = [
      { id: 'newer', status: 'IN_PROGRESS' },
      { id: 'older', status: 'IN_QUEUE' },
    ];
    assert.equal(bestBuild(builds).id, 'newer');
  });

  it('falls back to a dead build rather than nothing', () => {
    const builds = [{ id: 'failed', status: 'ERRORED' }];
    assert.equal(bestBuild(builds).id, 'failed');
  });
});

describe('isDeadBuild', () => {
  it('flags only terminal failures', () => {
    assert.equal(isDeadBuild('ERRORED'), true);
    assert.equal(isDeadBuild('canceled'), true);
    assert.equal(isDeadBuild('FINISHED'), false);
    assert.equal(isDeadBuild('IN_PROGRESS'), false);
    assert.equal(isDeadBuild(undefined), false);
  });
});
