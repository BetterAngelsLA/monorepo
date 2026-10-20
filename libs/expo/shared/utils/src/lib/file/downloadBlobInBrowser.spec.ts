import { downloadBlobInBrowser } from './downloadBlobInBrowser';

describe('downloadBlobInBrowser', () => {
  const clicks: string[] = [];
  const created: string[] = [];
  const revoked: string[] = [];
  let appended: unknown[] = [];
  let removed: unknown[] = [];
  let blobArgs: { parts: BlobPart[]; type?: string } | undefined;

  class FakeBlob {
    constructor(parts: BlobPart[], options?: { type?: string }) {
      blobArgs = { parts, type: options?.type };
    }
  }

  const originalBlob = globalThis.Blob;
  const originalURL = globalThis.URL;

  beforeEach(() => {
    clicks.length = 0;
    created.length = 0;
    revoked.length = 0;
    appended = [];
    removed = [];
    blobArgs = undefined;

    const anchor = {
      href: '',
      download: '',
      rel: '',
      style: {} as Record<string, string>,
      click: () => clicks.push(anchor.download),
    };

    (globalThis as { document?: unknown }).document = {
      createElement: () => anchor,
      body: {
        appendChild: (element: unknown) => appended.push(element),
        removeChild: (element: unknown) => removed.push(element),
      },
    };
    (globalThis as { Blob?: unknown }).Blob = FakeBlob;
    (globalThis as { URL?: unknown }).URL = {
      createObjectURL: () => {
        const url = `blob:${created.length + 1}`;
        created.push(url);
        return url;
      },
      revokeObjectURL: (url: string) => revoked.push(url),
    };
  });

  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
    (globalThis as { Blob?: unknown }).Blob = originalBlob;
    (globalThis as { URL?: unknown }).URL = originalURL;
  });

  it('downloads the blob with the suggested filename', () => {
    expect(downloadBlobInBrowser('hello', 'note.txt', 'text/plain')).toBe(true);

    expect(clicks).toEqual(['note.txt']);
    expect(blobArgs).toEqual({ parts: ['hello'], type: 'text/plain' });
  });

  it('accepts bytes for a binary export', () => {
    const bytes = new Uint8Array([1, 2, 3]);

    expect(downloadBlobInBrowser(bytes, 'image.png', 'image/png')).toBe(true);

    expect(blobArgs?.parts[0]).toBe(bytes);
    expect(blobArgs?.type).toBe('image/png');
  });

  it('revokes the object URL only after the browser has had time to read it', () => {
    vi.useFakeTimers();
    try {
      downloadBlobInBrowser('hello', 'note.txt', 'text/plain');
      expect(revoked).toEqual([]);

      // Safari/WebViews can still be reading the blob immediately after the
      // click, so a 0 ms revoke intermittently cancels the download.
      vi.advanceTimersByTime(999);
      expect(revoked).toEqual([]);

      vi.advanceTimersByTime(1);
      expect(revoked).toEqual(created);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns false and touches nothing when there is no DOM', () => {
    delete (globalThis as { document?: unknown }).document;

    expect(downloadBlobInBrowser('hello', 'note.txt', 'text/plain')).toBe(
      false,
    );
    expect(clicks).toEqual([]);
    expect(created).toEqual([]);
  });
});
