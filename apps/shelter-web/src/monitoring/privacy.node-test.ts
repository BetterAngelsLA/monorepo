import assert from 'node:assert/strict';
import { test } from 'node:test';
import '@monorepo/monitoring/testing';
import { Obfuscator } from '@newrelic/browser-agent/src/common/util/obfuscate.js';
import { generateRandomHexString } from '@newrelic/browser-agent/src/common/ids/unique-id.js';
import { browserPrivacyRules } from './privacy';
import { testPageViewTimingPrivacy } from '@monorepo/monitoring/testing/helper';

const agent = { init: { obfuscate: browserPrivacyRules('preview', 'abc123') } };
for (const type of [
  'PageView',
  'PageViewTiming',
  'AjaxRequest',
  'JavaScriptError',
  'BrowserInteraction',
]) {
  test(`${type}: distinct sessions and metrics survive URL redaction`, () => {
    const obfuscator = new Obfuscator(agent, type);
    const sessions = [generateRandomHexString(16), generateRandomHexString(16)];
    for (const session of sessions) {
      for (const url of [
        'https://user:password@test.invalid/operator/shelter/123?token=SECRET#name',
        '/shelter/private-person/gallery?token=SECRET',
        'api.invalid/graphql?address=SECRET',
      ]) {
        const event = {
          session,
          duration: 1.25,
          environment: 'preview',
          appVersion: 'abc123',
          pageUrl: url,
        };
        obfuscator.traverseAndObfuscateEvents(event);
        assert.equal(event.session, session);
        assert.equal(event.duration, 1.25);
        assert.equal(event.environment, 'preview');
        assert.equal(event.appVersion, 'abc123');
        assert.ok(!JSON.stringify(event).includes('SECRET'));
        assert.ok(!event.pageUrl.includes('private-person'));
        assert.ok(!event.pageUrl.includes('password'));
      }
    }
  });
}
test('errors and interactions redact free text without allowing metadata prefixes', () => {
  for (const type of ['JavaScriptError', 'BrowserInteraction']) {
    const obfuscator = new Obfuscator(agent, type);
    for (const text of [
      'Patient Name',
      'preview\nSECRET',
      'Error: private data\n at https://test.invalid/123',
    ]) {
      assert.equal(obfuscator.obfuscateString(text), '[redacted]');
    }
  }
});

// Check the patched serializer in source, ESM and CommonJS package formats.
testPageViewTimingPrivacy(browserPrivacyRules('validation', '1.2.14'));
