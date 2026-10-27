/**
 * Run with: node --test tools/scripts/preview-builds.test.mjs
 * (the `tools-scripts:test` target globs `tools/scripts/*.test.mjs`).
 *
 * These pin the fallback order the preview comment relies on: a build that
 * exists for the runtime, then the build this run queued (its trigger answer is
 * a valid permalink before `build:list` lists it), then the iOS simulator
 * binary — and never a bare `N/A`, which is what #2455 showed for iOS.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCell } from './preview-builds.mjs';

const account = 'better-angels';
const slug = 'betterangels';
const url = (id) =>
  `https://expo.dev/accounts/${account}/projects/${slug}/builds/${id}`;

const deviceBuild = {
  id: 'device-android',
  status: 'FINISHED',
  distribution: 'INTERNAL',
  buildProfile: 'preview',
  runtime: { version: '96b88652' },
  appVersion: '1.2.15',
  gitCommitHash: 'ee66cdc',
};

const simulatorBuild = {
  id: 'sim-ios',
  status: 'FINISHED',
  distribution: 'INTERNAL',
  buildProfile: 'development-simulator',
  runtime: { version: 'e906c369' },
  appVersion: '1.2.15',
  gitCommitHash: 'ee66cdc',
};

const render = (overrides = {}) =>
  buildCell({
    account,
    slug,
    runtime: 'e906c369',
    device: undefined,
    triggered: undefined,
    simulator: undefined,
    error: undefined,
    ...overrides,
  });

describe('buildCell', () => {
  it('links an existing device build for the runtime', () => {
    const cell = render({ device: deviceBuild });

    assert.match(
      cell,
      new RegExp(`\\[Build Permalink\\]\\(${url(deviceBuild.id)}\\)`),
    );
    assert.match(cell, /Source: `existing build for this runtime`/);
    assert.match(cell, /Runtime version: `96b88652`/);
  });

  it('says when this run queued the build it found', () => {
    const cell = render({
      runtime: '96b88652',
      device: deviceBuild,
      triggered: {
        platform: 'android',
        profile: 'preview',
        runtime: '96b88652',
        build: deviceBuild,
        reused: false,
      },
    });

    assert.match(cell, /Source: `queued by this run`/);
  });

  it('says when the build was reused from an earlier run', () => {
    const cell = render({
      runtime: '96b88652',
      device: deviceBuild,
      triggered: {
        platform: 'android',
        profile: 'preview',
        runtime: '96b88652',
        build: deviceBuild,
        reused: true,
      },
    });

    assert.match(cell, /Source: `reused — built for this runtime earlier`/);
  });

  it('falls back to the link the build trigger returned', () => {
    // `build:list` has not listed the queued build yet: the recorded id is still
    // a working permalink, and this is the case that used to render N/A.
    const cell = render({
      triggered: {
        platform: 'ios',
        profile: 'preview',
        runtime: 'e906c369',
        reused: false,
        build: {
          id: 'queued-ios',
          buildProfile: 'preview',
          runtime: { version: 'e906c369' },
        },
      },
    });

    assert.match(
      cell,
      new RegExp(`\\[Build Permalink\\]\\(${url('queued-ios')}\\)`),
    );
    assert.match(cell, /Source: `queued by this run — not listed by EAS yet`/);
    assert.match(cell, /Build profile: `preview`/);
    assert.match(cell, /Runtime version: `e906c369`/);
  });

  it('falls back to the iOS simulator binary when no device build exists', () => {
    const cell = render({ simulator: simulatorBuild });

    assert.match(
      cell,
      new RegExp(`\\[Build Permalink\\]\\(${url(simulatorBuild.id)}\\)`),
    );
    assert.match(
      cell,
      /Source: `simulator build — no device build for this runtime`/,
    );
    assert.match(cell, /Build profile: `development-simulator`/);
  });

  it('prefers a device build over the simulator binary', () => {
    const iosDevice = { ...deviceBuild, id: 'device-ios' };
    const cell = render({ device: iosDevice, simulator: simulatorBuild });

    assert.match(
      cell,
      new RegExp(`\\[Build Permalink\\]\\(${url(iosDevice.id)}\\)`),
    );
    assert.doesNotMatch(cell, /simulator build/);
    assert.match(cell, /Source: `existing build for this runtime`/);
  });

  it('ignores a recorded build for a different runtime', () => {
    // The record file outlives a CI job on a laptop; a stale id would link a
    // binary this update can never reach.
    const cell = render({
      triggered: {
        platform: 'ios',
        profile: 'preview',
        runtime: 'deadbeef',
        reused: false,
        build: { id: 'stale-ios' },
      },
    });

    assert.equal(cell, 'No build for `e906c369`');
    assert.doesNotMatch(cell, /stale-ios/);
  });

  it('uses a recorded simulator build, but only for this runtime', () => {
    const record = {
      platform: 'ios',
      profile: 'development-simulator',
      runtime: 'e906c369',
      reused: false,
      build: {
        id: 'sim-queued',
        buildProfile: 'development-simulator',
        runtime: { version: 'e906c369' },
      },
    };

    assert.match(
      render({ simulatorTriggered: record }),
      new RegExp(`\\[Build Permalink\\]\\(${url('sim-queued')}\\)`),
    );
    assert.equal(
      render({ simulatorTriggered: { ...record, runtime: 'deadbeef' } }),
      'No build for `e906c369`',
    );
  });

  it('names the runtime when nothing exists, instead of N/A', () => {
    const cell = render();

    assert.equal(cell, 'No build for `e906c369`');
    assert.doesNotMatch(cell, /N\/A/);
  });

  it('says the lookup failed when it falls back to the simulator', () => {
    const cell = render({ simulator: simulatorBuild, error: 'EAS is down' });

    assert.match(
      cell,
      new RegExp(`\\[Build Permalink\\]\\(${url(simulatorBuild.id)}\\)`),
    );
    assert.match(
      cell,
      /Source: `simulator build — device-build lookup failed`/,
    );
  });

  it('reports a failed lookup when the runtime is unknown', () => {
    // `update:list` failed, so there is nothing to filter the build lookup by.
    const cell = render({
      runtime: undefined,
      error: 'no ios runtime from the update',
    });

    assert.equal(cell, 'Lookup failed for this runtime — see the job log');
  });

  it('does not report a failed lookup as a missing build', () => {
    const cell = render({ error: 'EAS is down' });

    assert.equal(cell, 'Lookup failed for `e906c369` — see the job log');
    assert.doesNotMatch(cell, /No build/);
  });
});
