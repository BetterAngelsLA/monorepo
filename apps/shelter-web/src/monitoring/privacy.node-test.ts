import assert from 'node:assert/strict';
import { test } from 'node:test';
import './privacy-test-browser';
import { Obfuscator } from '@newrelic/browser-agent/src/common/util/obfuscate.js';
import { browserPrivacyRules } from './privacy';

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
    const sessions = ['053135a581efa3c3', '153135a581efa3c3'];
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
