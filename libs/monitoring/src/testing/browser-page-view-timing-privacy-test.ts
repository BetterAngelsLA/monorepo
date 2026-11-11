import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Aggregate as SourceAggregate } from '@newrelic/browser-agent/src/features/page_view_timing/aggregate/index.js';
import { generateRandomHexString } from '@newrelic/browser-agent/src/common/ids/unique-id.js';
// @ts-expect-error Internal dist build; no declarations are published.
import { Aggregate as EsmAggregate } from '@newrelic/browser-agent-dist/esm/features/page_view_timing/aggregate/index.js';
// @ts-expect-error Internal dist build; no declarations are published.
import { Aggregate as CjsAggregate } from '@newrelic/browser-agent-dist/cjs/features/page_view_timing/aggregate/index.js';

export function testPageViewTimingPrivacy(obfuscate: unknown[]) {
  for (const [format, Aggregate] of Object.entries({
    source: SourceAggregate,
    esm: EsmAggregate,
    cjs: CjsAggregate,
  })) {
    test(`${format} serializer keeps only safe PageViewTiming attributes`, () => {
      const aggregate = new Aggregate({
        init: { obfuscate },
        info: {
          jsAttributes: { environment: 'preview', appVersion: 'abc123' },
        },
        ee: { on: () => undefined },
      });
      const attrs = {
        elUrl:
          'https://cdn.example.invalid/imgproxy/SIGNATURE/ENCODED_PRIVATE_PATH',
        eid: 'PRIVATE_DOM_ID',
        element: '#PRIVATE_SELECTOR',
        eventTarget: 'BUTTON#PRIVATE_DOM_ID',
        interactionTarget: 'DIV#PRIVATE_DOM_ID',
        largestShiftTarget: 'DIV#PRIVATE_DOM_ID',
        navigationEntry: {
          name: 'https://test.invalid/private/123?token=SECRET',
        },
        futureAttribution: 'FUTURE_SENTINEL',
        size: 176800,
        elTag: 'IMG',
        resourceLoadDuration: 107.25,
        pageUrl: 'https://test.invalid/private/shelter/123?token=SECRET',
      };
      const sessions = [
        generateRandomHexString(16),
        generateRandomHexString(16),
      ];
      for (const session of sessions) {
        aggregate.agentRef.info.jsAttributes.session = session;
        const payload = aggregate.serializer([
          { name: 'lcp', value: 1112, attrs },
        ]);
        assert.ok(payload.includes("'lcp"));
        assert.ok(
          !/elUrl|eid|element|eventTarget|interactionTarget|largestShiftTarget|navigationEntry|PRIVATE|SIGNATURE|ENCODED_PRIVATE_PATH|FUTURE_SENTINEL|SECRET|\/123/.test(
            payload,
          ),
        );
        assert.ok(payload.includes('[route]') || payload.includes('/[id]'));
        for (const value of [
          'preview',
          'abc123',
          'IMG',
          '176800',
          '107.25',
          session,
        ]) {
          assert.ok(
            payload.includes(value),
            `${format} lost ${value}: ${payload}`,
          );
        }
        assert.equal(attrs.eid, 'PRIVATE_DOM_ID');
      }

      const fi = aggregate.serializer([
        {
          name: 'fi',
          value: 100,
          attrs: {
            type: 'pointerdown',
            eventTarget: 'BUTTON#PRIVATE_DOM_ID',
            loadState: 'complete',
            pageUrl: '/private/123?token=SECRET',
          },
        },
      ]);
      assert.ok(fi.includes("'fi"));
      assert.ok(!/eventTarget|BUTTON|PRIVATE_DOM_ID|SECRET|\/123/.test(fi));
      for (const value of ['pointerdown', 'complete']) {
        assert.ok(fi.includes(value), `${format} lost ${value}: ${fi}`);
      }

      const inp = aggregate.serializer([
        {
          name: 'inp',
          value: 200,
          attrs: {
            metricId: 'v6-inp',
            eventTarget: 'DIV#PRIVATE_DOM_ID',
            interactionTarget: 'DIV#PRIVATE_DOM_ID',
            interactionTime: 12.5,
            inputDelay: 3,
            nextPaintTime: 20,
            processingDuration: 4,
            presentationDelay: 5,
            interactionType: 'pointer',
            loadState: 'complete',
            pageUrl: '/private/123?token=SECRET',
          },
        },
      ]);
      assert.ok(inp.includes("'inp"));
      assert.ok(
        !/eventTarget|interactionTarget|PRIVATE_DOM_ID|SECRET|\/123/.test(inp),
      );
      for (const value of ['v6-inp', 'pointer', 'complete', '12.5']) {
        assert.ok(inp.includes(value), `${format} lost ${value}: ${inp}`);
      }

      const cls = aggregate.serializer([
        {
          name: 'cls',
          value: 500,
          attrs: {
            metricId: 'v6-cls',
            largestShiftTarget: 'DIV#PRIVATE_DOM_ID',
            largestShiftTime: 1,
            largestShiftValue: 0.5,
            loadState: 'complete',
            pageUrl: '/private/123?token=SECRET',
          },
        },
      ]);
      assert.ok(cls.includes("'cls"));
      assert.ok(!/largestShiftTarget|PRIVATE_DOM_ID|SECRET|\/123/.test(cls));
      for (const value of ['v6-cls', 'complete']) {
        assert.ok(cls.includes(value), `${format} lost ${value}: ${cls}`);
      }

      const ttfb = aggregate.serializer([
        {
          name: 'ttfb',
          value: 50,
          attrs: {
            navigationEntry: {
              name: 'https://test.invalid/private/123?token=SECRET',
            },
          },
        },
      ]);
      assert.ok(ttfb.includes("'ttfb"));
      assert.ok(!/navigationEntry|SECRET|\/123/.test(ttfb));

      const pageHide = aggregate.serializer([
        { name: 'pageHide', value: 15000, attrs: { pageUrl: '/safe' } },
      ]);
      assert.ok(pageHide.includes("'pageHide"));
      assert.ok(pageHide.includes((15000).toString(36)));
    });
  }
}
