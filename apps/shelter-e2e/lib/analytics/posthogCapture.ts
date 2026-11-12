import type { Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

/**
 * The analytics this site sends, read from the network.
 *
 * Asserting the UI cannot tell whether a handoff was *accepted* — only the
 * capture payload can. Two things make this observable at all:
 *
 *   - the dev build opts out of the SDK's bot filter (`import.meta.env.DEV` in
 *     `buildInitConfig`), which otherwise drops every event from a test browser;
 *   - capture requests are fulfilled here instead of reaching PostHog, so a test
 *     run never writes into the project it is asserting on.
 */
export type CapturedEvent = {
  event: string;
  properties: Record<string, unknown>;
};

/**
 * Capture, batch and snapshot delivery. `/s/` is replay: left out, a test run
 * writes its recordings into the project it is asserting on.
 */
const CAPTURE_PATH = /\/(s|e|i\/v0\/e|batch|capture)\/?$/;

/**
 * Whether the site under test can send events at all.
 *
 * A deployed preview always can — its build requires the key. A local dev server
 * can only when `apps/shelter-web/.env` has one, which is what the sample ships
 * empty; without this the specs spend 30s each failing on an event that could
 * never arrive, and say nothing about the missing key.
 */
export function analyticsConfigured(env = process.env): boolean {
  if (env.BASE_URL || env.PREVIEW_DEPLOYED_APPS) return true;
  if (env.VITE_POSTHOG_API_KEY) return true;

  return Boolean(localApiKey());
}

function localApiKey(): string | undefined {
  // The Playwright config runs from the project dir; tolerating the workspace
  // root as well keeps this honest when a target changes its cwd.
  for (const file of ['../shelter-web/.env', 'apps/shelter-web/.env']) {
    if (!existsSync(file)) continue;

    const match = readFileSync(file, 'utf8').match(
      /^VITE_POSTHOG_API_KEY=(.*)$/m,
    );

    return match?.[1].trim().replace(/^["']|["']$/g, '') || undefined;
  }

  return undefined;
}

/** A UUIDv7 — the only version the SDK accepts for a bootstrapped session. */
export function uuidv7(): string {
  const ms = Date.now();
  const bytes = randomBytes(16);

  // 48 bits of milliseconds fit a double exactly, so no BigInt is needed — and
  // bitwise operators would truncate to 32 bits.
  for (let index = 0; index < 6; index += 1) {
    bytes[index] = Math.floor(ms / 2 ** (8 * (5 - index))) % 256;
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

  const hex = bytes.toString('hex');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Collects every event the page sends, for the lifetime of the page. */
export function recordPostHog(page: Page): CapturedEvent[] {
  const events: CapturedEvent[] = [];

  void page.route('https://k.betterangels.la/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    // `/flags/` and `/decide/` are left alone: the SDK needs their real answers.
    if (!CAPTURE_PATH.test(pathname)) {
      return route.continue();
    }

    for (const item of decode(request.postDataBuffer())) {
      events.push({ event: item.event, properties: item.properties ?? {} });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });

  return events;
}

/** Resolves with the first event of that name, or throws with what did arrive. */
export async function waitForEvent(
  events: CapturedEvent[],
  name: string,
  timeoutMs = 30_000,
): Promise<CapturedEvent> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const found = events.find((event) => event.event === name);

    if (found) {
      return found;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `no ${name} within ${timeoutMs}ms; saw ${JSON.stringify(events.map((event) => event.event))}`,
  );
}

function decode(
  buffer: Buffer | null,
): Array<{ event: string; properties?: Record<string, unknown> }> {
  if (!buffer) return [];

  // The SDK posts raw gzip when the browser supports CompressionStream.
  for (const decoded of [buffer, tryGunzip(buffer)]) {
    if (!decoded) continue;

    try {
      const parsed = JSON.parse(decoded.toString('utf8'));

      if (Array.isArray(parsed?.batch)) return parsed.batch;
      if (parsed?.event) return [parsed];
      return [];
    } catch {
      // Try the next reading.
    }
  }

  return [];
}

function tryGunzip(buffer: Buffer): Buffer | null {
  try {
    return gunzipSync(buffer);
  } catch {
    return null;
  }
}
