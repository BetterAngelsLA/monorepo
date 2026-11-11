import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Aggregate as SourceAggregate } from '@newrelic/browser-agent/src/features/page_view_timing/aggregate/index.js';
import { Aggregate as EsmAggregate } from '../../node_modules/@newrelic/browser-agent/dist/esm/features/page_view_timing/aggregate/index.js';
import { Aggregate as CjsAggregate } from '../../node_modules/@newrelic/browser-agent/dist/cjs/features/page_view_timing/aggregate/index.js';

export function testLcpPrivacy(obfuscate: unknown[]) {
  for (const [format, Aggregate] of Object.entries({
    source: SourceAggregate,
    esm: EsmAggregate,
    cjs: CjsAggregate,
  })) {
    test(`${format} serializer omits LCP attribution and preserves measurements and sessions`, () => {
      const aggregate = new Aggregate({
        init: { obfuscate },
        info: { jsAttributes: { environment: 'preview', appVersion: 'abc123' } },
        ee: { on() {} },
      });
      const attrs = {
        elUrl: 'https://cdn.example.invalid/imgproxy/SIGNATURE/ENCODED_PRIVATE_PATH',
        eid: 'PRIVATE_DOM_ID',
        element: '#PRIVATE_SELECTOR',
        size: 176800,
        elTag: 'IMG',
        resourceLoadDuration: 107.25,
        pageUrl: 'https://test.invalid/private/shelter/123?token=SECRET',
      };
      for (const session of ['053135a581efa3c3', '153135a581efa3c3']) {
        aggregate.agentRef.info.jsAttributes.session = session;
        const payload = aggregate.serializer([{ name: 'lcp', value: 1112, attrs }]);
        assert.ok(payload.includes("'lcp"));
        assert.ok(!/elUrl|eid|element|PRIVATE|SIGNATURE|ENCODED_PRIVATE_PATH|SECRET|\/123/.test(payload));
        assert.ok(payload.includes('[route]') || payload.includes('/[id]'));
        for (const value of ['preview', 'abc123', 'IMG', '176800', '107.25']) {
          if (value === '[route]') assert.ok(payload.includes(value));
          else assert.ok(payload.includes(value), `${format} lost ${value}: ${payload}`);
        }
        assert.equal(attrs.eid, 'PRIVATE_DOM_ID');
      }
      const pageHide = aggregate.serializer([{ name: 'pageHide', value: 15000, attrs: { pageUrl: '/safe' } }]);
      assert.ok(pageHide.includes("'pageHide"));
      assert.ok(pageHide.includes((15000).toString(36)));
    });
  }
}
