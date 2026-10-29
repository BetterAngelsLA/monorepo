/**
 * Run with: node --test tools/scripts/preview-builds.test.mjs
 * (the `tools-scripts:test` target globs `tools/scripts/*.test.mjs`).
 *
 * These pin the fallback order the preview comment relies on: a build that
 * exists for the runtime, then the build this run queued (its trigger answer is
 * a valid permalink before `build:list` lists it), then the iOS simulator
 * binary — and never a bare `N/A`.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCell, slackBlocks, slackSection } from './preview-builds.mjs';

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

const update = {
  group: 'group-1',
  branch: 'main',
  runtimeVersion: 'e906c369',
  gitCommitHash: 'e906c3690000000000000000000000000000000',
};

const slack = (overrides = {}) =>
  slackSection({
    title: ':iphone: iOS',
    account,
    slug,
    projectId: 'project-1',
    runtime: 'e906c369',
    update,
    device: undefined,
    triggered: undefined,
    simulator: undefined,
    simulatorTriggered: undefined,
    error: undefined,
    simulatorRow: true,
    ...overrides,
  }).text.text;

describe('slackSection', () => {
  it('renders Update, Build and Simulator Build in that order', () => {
    const text = slack({ device: deviceBuild, simulator: simulatorBuild });

    assert.match(text, /^:iphone: iOS\n\n<https:\/\/expo\.dev\/projects\//);
    assert.match(
      text,
      new RegExp(
        `<https://expo.dev/accounts/${account}/projects/${slug}/builds/device-android\\|Build>`,
      ),
    );
    assert.match(
      text,
      new RegExp(
        `<https://expo.dev/accounts/${account}/projects/${slug}/builds/sim-ios\\|Simulator Build>`,
      ),
    );
    assert.ok(text.indexOf('|Build>') < text.indexOf('|Simulator Build>'));
  });

  it('keeps the row and the link when build:list lags the queued build', () => {
    // The regression this pins: the run had a valid permalink, the listing did
    // not, and the message said "not built for this run" instead of linking it.
    const text = slack({
      triggered: {
        platform: 'ios',
        profile: 'preview',
        runtime: 'e906c369',
        reused: false,
        build: { id: 'queued-ios', runtime: { version: 'e906c369' } },
      },
      simulatorTriggered: {
        platform: 'ios',
        profile: 'development-simulator',
        runtime: 'e906c369',
        reused: false,
        build: { id: 'queued-sim', runtime: { version: 'e906c369' } },
      },
    });

    assert.match(text, /\|Build>/);
    assert.match(text, new RegExp(`builds/queued-ios\\|Build>`));
    assert.match(text, new RegExp(`builds/queued-sim\\|Simulator Build>`));
  });

  it('reports the build this run resolved when the newest update is an older one', () => {
    // A tools-only push publishes no update, so `update:list` answers with another
    // commit's runtime. The build row and the runtime must come from this run's
    // record, and the update row must name the commit it actually came from.
    const text = slack({
      update: {
        group: 'group-1',
        branch: 'main',
        runtimeVersion: 'f96e6a11e37b4f7367eb5223e3f3c38055e582d4',
        gitCommitHash: '96b88652aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
      runtime: 'f96e6a11e37b4f7367eb5223e3f3c38055e582d4',
      triggered: {
        platform: 'ios',
        profile: 'preview',
        runtime: 'e906c369',
        reused: true,
        build: { id: 'resolved-ios', runtime: { version: 'e906c369' } },
      },
    });

    assert.match(text, new RegExp(`builds/resolved-ios\\|Build>`));
    assert.match(text, /_Runtime:_ `e906c369`/);
    assert.doesNotMatch(text, /^Build: No build/m);
  });

  it('blames the runtime the simulator row resolved against', () => {
    // The record exists but EAS answered without a build object, so the row has
    // nothing to link — it must not then point at the older update's runtime.
    const text = slack({
      runtime: 'f96e6a11e37b4f7367eb5223e3f3c38055e582d4',
      device: deviceBuild,
      simulatorTriggered: {
        platform: 'ios',
        profile: 'development-simulator',
        runtime: 'e906c369',
        reused: false,
        build: null,
      },
    });

    assert.match(text, /Simulator Build: No build for `e906c369`/);
  });

  it('reports a failed simulator lookup instead of a missing build', () => {
    const text = slack({ device: deviceBuild, simulatorError: 'EAS is down' });

    assert.match(
      text,
      /Simulator Build: Lookup failed for `e906c369` — see the job log/,
    );
  });

  it('says why the simulator row has no link instead of dropping it', () => {
    const text = slack({ device: deviceBuild });

    assert.match(text, /Simulator Build: No build for `e906c369`/);
    // The device row still renders, and the simulator row is last before runtime.
    assert.match(text, /\|Build>\nSimulator Build:/);
  });

  it('renders a row even with no update at all', () => {
    const text = slack({ update: undefined });

    assert.match(text, /Update: none published for this commit/);
  });

  it('distinguishes a failed lookup from a missing build', () => {
    const text = slack({ error: 'EAS is down' });

    assert.match(text, /Build: Lookup failed for `e906c369` — see the job log/);
    assert.doesNotMatch(text, /^Build: No build/m);
  });
});

const blocks = (overrides = {}) =>
  slackBlocks({
    project: 'betterangels',
    profile: 'preview',
    account,
    slug,
    projectId: 'project-1',
    commit: 'e906c3690000000000000000000000000000000',
    message: 'feat(shelter): filters (SDB-218)',
    updates: { android: update, ios: update },
    devices: {},
    errors: {},
    triggered: {},
    simulator: undefined,
    simulatorError: undefined,
    ...overrides,
  });

const texts = (overrides = {}) =>
  blocks(overrides)
    .filter((block) => block.text?.text)
    .map((block) => block.text.text);
const sectionFor = (platform, overrides) =>
  texts(overrides).find((text) => text.startsWith(platform));

const ANDROID = ':robot_face: Android';
const IOS = ':iphone: iOS';

describe('slackBlocks', () => {
  it('keeps the header, both platform blocks and the divider between them', () => {
    assert.deepEqual(
      blocks().map((block) => block.type),
      ['section', 'section', 'divider', 'section'],
    );
    assert.match(
      texts()[0],
      /^\*New code has landed in main for project betterangels!\*/,
    );
  });

  it('names the environment, so the two legs of a push differ', () => {
    assert.match(texts({ profile: 'preview' })[0], /\*Environment:\* Preview/);
    assert.match(
      texts({ profile: 'production' })[0],
      /\*Environment:\* Production/,
    );
  });

  it('says a production simulator row is not part of that build', () => {
    // Driven by the profile, not by a flag the test sets: a caller that stopped
    // deriving `simulatorProfile` from it fails here.
    assert.match(
      sectionFor(IOS, { profile: 'production', devices: { ios: deviceBuild } }),
      /Simulator Build: not part of a production build/,
    );
  });

  it('links the simulator binary on a preview', () => {
    assert.match(
      sectionFor(IOS, { simulator: simulatorBuild }),
      new RegExp(`builds/sim-ios\\|Simulator Build>`),
    );
  });

  it('gives only iOS a simulator row', () => {
    assert.doesNotMatch(
      sectionFor(ANDROID, { simulator: simulatorBuild }),
      /Simulator Build/,
    );
    assert.match(
      sectionFor(IOS, { simulator: simulatorBuild }),
      /Simulator Build/,
    );
  });

  it('escapes the commit subject', () => {
    const header = texts({
      message: 'feat: <http://evil.test|click> & more',
    })[0];

    assert.match(header, /&lt;http:\/\/evil\.test\|click&gt; &amp; more/);
    assert.doesNotMatch(header, /<http:\/\/evil\.test/);
  });
});
