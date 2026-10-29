import assert from 'node:assert/strict';
import { test } from 'node:test';
import './privacy-test-browser';
import { Obfuscator } from '@newrelic/browser-agent/src/common/util/obfuscate.js';
import { EventAggregator } from '@newrelic/browser-agent/src/common/aggregate/event-aggregator.js';
import { Interaction } from '@newrelic/browser-agent/src/features/soft_navigations/aggregate/interaction.js';
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
  assert.ok(output.includes('https://test.invalid/[route]'));
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
    session: '[redacted]',
    pageUrl: 'https://test.invalid/[route]',
  });
});

for (const eventType of ['PageView', 'PageAction']) {
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

    assert.equal(event.pageUrl, 'https://test.invalid/[route]');
    assert.equal(event.actionText, '[redacted]');
    assert.equal(event.targetText, '[redacted]');
    assert.equal(event.environment, 'validation');
    assert.equal(event.appVersion, '1.2.14');
    assert.equal(event.duration, 1.25);
    assert.ok(!JSON.stringify(event).includes('Synthetic-Person'));
    assert.ok(!JSON.stringify(event).includes('FAKE_SECRET'));
  });
}
