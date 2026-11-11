import assert from 'node:assert/strict';
import { test } from 'node:test';
import './privacy-test-browser';
import { Obfuscator } from '@newrelic/browser-agent/src/common/util/obfuscate.js';
import { EventAggregator } from '@newrelic/browser-agent/src/common/aggregate/event-aggregator.js';
import { Interaction } from '@newrelic/browser-agent/src/features/soft_navigations/aggregate/interaction.js';
import { testLcpPrivacy } from '../../../../tools/shared/browser-lcp-privacy-test';
import { browserPrivacyRules } from './privacy';

const agent = {
  init: { obfuscate: browserPrivacyRules('validation', '1.2.14') },
  info: {
    jsAttributes: {
      environment: 'validation',
      appVersion: '1.2.14',
      platform: 'web',
    },
  },
};
const secret = 'Synthetic Person private case note token=FAKE_SECRET_123';

test('error harvest removes free text and nonempty stacks without losing counts or metadata', () => {
  const events = new EventAggregator();
  for (let i = 0; i < 2; i++) {
    events.add([
      'err',
      'bucket',
      {
        message: secret,
        exceptionClass: secret,
        stack_trace: `Error: ${secret}\n at secretFunction (https://test.invalid/client/123:2:3)`,
        cause: secret,
        request_uri: '/client/123',
      },
      { time: 100 },
      { ...agent.info.jsAttributes, actionText: secret },
    ]);
  }
  const payload = events.get(['err']) as {
    err: Array<{
      metrics: { count: number };
      params: Record<string, string>;
      custom: Record<string, string>;
    }>;
  } | null;
  assert.ok(payload);
  new Obfuscator(agent, 'JavaScriptError').traverseAndObfuscateEvents(
    payload.err,
  );
  assert.equal(payload.err[0].metrics.count, 2);
  assert.equal(payload.err[0].params.stack_trace, '[redacted]');
  assert.equal(payload.err[0].params.message, '[redacted]');
  assert.equal(payload.err[0].custom.actionText, '[redacted]');
  assert.equal(payload.err[0].custom.environment, 'validation');
  assert.equal(payload.err[0].custom.appVersion, '1.2.14');
  assert.ok(!JSON.stringify(payload).includes('FAKE_SECRET'));
});

test('real navigation serializer retains duration and route category while removing text', () => {
  const interaction = new Interaction(
    'click',
    100,
    undefined,
    'https://test.invalid/',
  );
  interaction.initialPageURL = 'https://test.invalid/';
  interaction.newURL = 'https://test.invalid/client/123';
  interaction.end = 850;
  interaction.customAttributes = { actionText: secret };
  const output = interaction.serialize(
    100,
    agent,
    new Obfuscator(agent, 'BrowserInteraction'),
    new Obfuscator(agent, 'AjaxRequest'),
  );
  const fields = output.split(';')[0].split(',');
  assert.equal(parseInt(fields[3], 36), 750);
  assert.equal(fields[11], '1'); // encoded Route change, determined before obfuscation
  assert.ok(output.includes('[redacted]'));
  assert.ok(output.includes('validation'));
  assert.ok(!output.includes('FAKE_SECRET'));
  assert.ok(output.includes('https://test.invalid/client/[id]'));
  assert.ok(!output.includes('/client/123'));
});

test('exact metadata allowlist does not admit appended secrets; other events keep timings and sessions', () => {
  const obfuscator = new Obfuscator(agent, 'BrowserInteraction');
  for (const input of [
    'validation\n' + secret,
    '1x2x14',
    'web ' + secret,
    secret,
  ]) {
    assert.equal(obfuscator.obfuscateString(input), '[redacted]');
  }
  const page = {
    duration: 1.25,
    session: 'opaque-session',
    pageUrl: 'https://test.invalid/client/123',
  };
  new Obfuscator(agent, 'PageView').traverseAndObfuscateEvents(page);
  assert.deepEqual(page, {
    duration: 1.25,
    session: 'opaque-session',
    pageUrl: 'https://test.invalid/client/[id]',
  });
});

for (const eventType of ['PageAction']) {
  test(`${eventType} redacts free-form text and sanitizes URL paths`, () => {
    const obfuscator = new Obfuscator(agent, eventType);
    const event = {
      pageUrl: 'https://test.invalid/client/123?name=Synthetic-Person',
      actionText: secret,
      targetText: secret,
      environment: 'validation',
      appVersion: '1.2.14',
      duration: 1.25,
    };

    obfuscator.traverseAndObfuscateEvents(event);

    assert.equal(event.pageUrl, 'https://test.invalid/client/[id]');
    assert.equal(event.actionText, '[redacted]');
    assert.equal(event.targetText, '[redacted]');
    assert.equal(event.environment, 'validation');
    assert.equal(event.appVersion, '1.2.14');
    assert.equal(event.duration, 1.25);
    assert.ok(!JSON.stringify(event).includes('Synthetic-Person'));
    assert.ok(!JSON.stringify(event).includes('FAKE_SECRET'));
  });
}

const uuid = '550e8400-e29b-41d4-a716-446655440000';

// Route shape per event type: the app's dynamic segments are integer ids
// (accounts) or UUIDs (clients, notes), so the route skeleton survives and only
// the identifiers are replaced. This is what makes per-route dashboards possible
// without shipping client ids to New Relic.
for (const eventType of ['PageView', 'AjaxRequest', 'PageViewTiming']) {
  test(`${eventType} keeps the route skeleton and masks ids, query and fragment`, () => {
    const obfuscator = new Obfuscator(agent, eventType);
    for (const [url, expected] of [
      [
        'https://test.invalid/clients/123/edit?token=FAKE_SECRET#private',
        'https://test.invalid/clients/[id]/edit',
      ],
      [
        `https://test.invalid/client/${uuid}?name=Synthetic-Person`,
        'https://test.invalid/client/[id]',
      ],
      [
        'https://fakeuser:fakepassword@test.invalid/?name=Synthetic-Person',
        'https://test.invalid/',
      ],
      [
        '/clients/123/relations/456/edit?token=FAKE_SECRET',
        '/clients/[id]/relations/[id]/edit',
      ],
      [
        'test.invalid/clients/123?token=FAKE_SECRET',
        'test.invalid/clients/[id]',
      ],
      // Static segments survive so API endpoints stay distinguishable.
      ['/graphql', '/graphql'],
      ['http://localhost:8081/__api/graphql', 'http://localhost:8081/__api/graphql'],
    ] as Array<[string, string]>) {
      const event = {
        url,
        duration: 1.25,
        session: '053135a581efa3c3',
        timingName: 'largestContentfulPaint',
        httpMethod: 'POST',
        environment: 'validation',
        appVersion: '1.2.14',
      };
      obfuscator.traverseAndObfuscateEvents(event);
      assert.deepEqual(event, {
        url: expected,
        duration: 1.25,
        session: '053135a581efa3c3',
        timingName: 'largestContentfulPaint',
        httpMethod: 'POST',
        environment: 'validation',
        appVersion: '1.2.14',
      });
    }
  });
}

test('KNOWN LIMITATION: a non-id path segment is preserved verbatim', () => {
  // Route-level masking trades the old blanket "[route]" for a route skeleton.
  // That is only safe while every dynamic segment is an id. If a route ever
  // starts carrying a name or slug, this test is the tripwire: it will keep
  // passing, but the value below shows exactly what would ship.
  const obfuscator = new Obfuscator(agent, 'PageView');
  const event = { pageUrl: 'https://test.invalid/clients/Synthetic-Person' };
  obfuscator.traverseAndObfuscateEvents(event);
  assert.equal(event.pageUrl, 'https://test.invalid/clients/Synthetic-Person');
});

test('JavaScriptError keeps the route for request_uri but redacts free text', () => {
  const obfuscator = new Obfuscator(agent, 'JavaScriptError');
  assert.equal(obfuscator.obfuscateString('/client/123'), '/client/[id]');
  assert.equal(obfuscator.obfuscateString('https://test.invalid/client/123'), 'https://test.invalid/client/[id]');
  assert.equal(obfuscator.obfuscateString(secret), '[redacted]');
  // A URL that is the entire message keeps its route; query is dropped.
  assert.equal(
    obfuscator.obfuscateString('https://test.invalid/client/123?token=FAKE_SECRET'),
    'https://test.invalid/client/[id]',
  );
  assert.equal(
    obfuscator.obfuscateString(`Error: ${secret}\n at f (https://test.invalid/client/123:2:3)`),
    '[redacted]',
  );
});

// Check the patched serializer in source, ESM and CommonJS package formats.
testLcpPrivacy(browserPrivacyRules('validation', '1.2.14'));
