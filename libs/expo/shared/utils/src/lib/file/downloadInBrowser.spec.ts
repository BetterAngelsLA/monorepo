import { downloadInBrowser } from './downloadInBrowser';

describe('downloadInBrowser', () => {
  const clicks: string[] = [];
  let appended: unknown[] = [];
  let removed: unknown[] = [];

  const makeAnchor = () => {
    const anchor = {
      href: '',
      download: '',
      rel: '',
      style: {} as Record<string, string>,
      click: () => clicks.push(anchor.download),
    };
    return anchor;
  };

  beforeEach(() => {
    clicks.length = 0;
    appended = [];
    removed = [];

    const anchor = makeAnchor();

    (globalThis as { document?: unknown }).document = {
      createElement: () => anchor,
      body: {
        appendChild: (el: unknown) => appended.push(el),
        removeChild: (el: unknown) => removed.push(el),
      },
    };
  });

  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  it('clicks an anchor carrying the url and suggested filename', () => {
    downloadInBrowser('https://files.test/report.pdf', 'report.pdf');

    expect(clicks).toEqual(['report.pdf']);
  });

  it('attaches the anchor to the document for the click, then detaches it', () => {
    downloadInBrowser('https://files.test/report.pdf', 'report.pdf');

    expect(appended).toHaveLength(1);
    expect(removed).toHaveLength(1);
    // The same node both ways — nothing is left dangling in the DOM.
    expect(appended[0]).toBe(removed[0]);
  });

  it('does not navigate the current page', () => {
    downloadInBrowser('https://files.test/report.pdf', 'report.pdf');

    const anchor = appended[0] as { rel: string; href: string };
    expect(anchor.rel).toBe('noopener');
    expect(anchor.href).toBe('https://files.test/report.pdf');
  });

  it('reports that the download was dispatched', () => {
    expect(
      downloadInBrowser('https://files.test/report.pdf', 'report.pdf'),
    ).toBe(true);
  });

  it('returns false and touches nothing when there is no DOM', () => {
    // This module is re-exported from a platform-neutral barrel, so a native
    // caller must get `false` rather than `ReferenceError: document is not
    // defined` at runtime.
    delete (globalThis as { document?: unknown }).document;

    expect(
      downloadInBrowser('https://files.test/report.pdf', 'report.pdf'),
    ).toBe(false);
    expect(clicks).toEqual([]);
    expect(appended).toEqual([]);
  });
});
