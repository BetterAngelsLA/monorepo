import { Share } from 'react-native';
import {
  shareReferralPng,
  shareReferralText,
  shareReferralTextFile,
} from './shareReferralText';

const native = vi.hoisted(() => ({
  files: new Map<string, { text: string; modified: number }>(),
  available: vi.fn(),
  handoff: vi.fn(),
  fault: '',
}));
vi.mock('expo-sharing', () => ({
  isAvailableAsync: native.available,
  shareAsync: native.handoff,
}));
vi.mock('expo-crypto', () => ({ randomUUID: () => 'new-id' }));
vi.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(directory: { uri: string }, name: string) {
      this.uri = `${directory.uri}/${name}`;
    }
    get exists() {
      return native.files.has(this.uri);
    }
    get modificationTime() {
      return native.files.get(this.uri)?.modified ?? null;
    }
    create() {
      if (native.fault === 'create') throw new Error('Create failed');
      native.files.set(this.uri, { text: '', modified: Date.now() });
    }
    write(text: string, options?: { encoding?: string }) {
      if (native.fault === 'write') throw new Error('Write failed');
      native.files.set(this.uri, {
        text: options?.encoding === 'base64' ? atob(text) : text,
        modified: Date.now(),
      });
    }
    delete() {
      native.files.delete(this.uri);
    }
  }
  return {
    Paths: { cache: '/cache' },
    File,
    Directory: class {
      uri: string;
      constructor(root: string, name: string) {
        this.uri = `${root}/${name}`;
      }
      create() {
        if (native.fault === 'directory') throw new Error('Directory failed');
      }
      list() {
        return [...native.files.keys()]
          .filter((key) => key.startsWith(`${this.uri}/`))
          .map((key) => new File(this, key.slice(this.uri.length + 1)));
      }
    },
  };
});
const copy = {
  title: 'Referral summary',
  text: 'Ana Muñoz\nA readable fictional referral',
};
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRz8AAAAASUVORK5CYII=';

it('writes real PNG bytes using the existing file API and hands off an image, not base64 text', async () => {
  await shareReferralPng(
    async () => png,
    () => true,
  );
  expect(
    native.files.get('/cache/referral-exports/referral-new-id.png')?.text,
  ).toBe(atob(png));
  expect(native.handoff).toHaveBeenCalledWith(
    '/cache/referral-exports/referral-new-id.png',
    expect.objectContaining({ mimeType: 'image/png', UTI: 'public.png' }),
  );
});

it('discards a delayed image if the preview or account closes during capture', async () => {
  let current = true;
  await shareReferralPng(
    async () => {
      current = false;
      return png;
    },
    () => current,
  );
  expect(native.files.size).toBe(0);
  expect(native.handoff).not.toHaveBeenCalled();
});

it.each(['not a PNG', 'iVBORw0KGgo'])(
  'rejects invalid capture results without creating a misleading attachment: %s',
  async (value) => {
    await expect(
      shareReferralPng(
        async () => value,
        () => true,
      ),
    ).rejects.toThrow(/valid PNG/);
    expect(native.files.size).toBe(0);
    expect(native.handoff).not.toHaveBeenCalled();
  },
);

it('cleans up failed image handoffs and never captures if sharing is unavailable', async () => {
  native.handoff.mockRejectedValueOnce(new Error('Synthetic failure'));
  await expect(
    shareReferralPng(
      async () => png,
      () => true,
    ),
  ).rejects.toThrow('Synthetic failure');
  expect(native.files.size).toBe(0);
  native.available.mockResolvedValueOnce(false);
  const capture = vi.fn(async () => png);
  await expect(shareReferralPng(capture, () => true)).rejects.toThrow(
    /unavailable/,
  );
  expect(capture).not.toHaveBeenCalled();
});
beforeEach(() => {
  native.files.clear();
  native.fault = '';
  native.available.mockReset().mockResolvedValue(true);
  native.handoff.mockReset().mockResolvedValue(undefined);
});

it.each([Share.sharedAction, Share.dismissedAction])(
  'returns no delivery assertion for native action %s',
  async (action) => {
    const share = vi.spyOn(Share, 'share').mockResolvedValue({ action });
    await expect(shareReferralText(copy)).resolves.toBeUndefined();
    expect(share).toHaveBeenCalledWith(
      { title: copy.title, message: copy.text },
      expect.objectContaining({ subject: copy.title }),
    );
    share.mockRestore();
  },
);

it('hands off a UTF-8 text file and keeps it available after the native chooser returns', async () => {
  await shareReferralTextFile(copy, () => true);
  expect(
    native.files.get('/cache/referral-exports/referral-new-id.txt')?.text,
  ).toBe(copy.text);
  expect(native.handoff).toHaveBeenCalledWith(
    '/cache/referral-exports/referral-new-id.txt',
    expect.objectContaining({
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
    }),
  );
});

it.each(['directory', 'create', 'write'])(
  'reports %s failures without handing off an incomplete file',
  async (fault) => {
    native.fault = fault;
    await expect(shareReferralTextFile(copy, () => true)).rejects.toThrow();
    expect(native.handoff).not.toHaveBeenCalled();
    expect(native.files.size).toBe(0);
  },
);

it('cleans up a failed native handoff and reports sharing unavailable without creating a file', async () => {
  native.handoff.mockRejectedValueOnce(new Error('Handoff failed'));
  await expect(shareReferralTextFile(copy, () => true)).rejects.toThrow(
    'Handoff failed',
  );
  expect(native.files.size).toBe(0);
  native.available.mockResolvedValueOnce(false);
  await expect(shareReferralTextFile(copy, () => true)).rejects.toThrow(
    'unavailable',
  );
  expect(native.files.size).toBe(0);
});

it('cancels file creation if the preview/account is closed before or during availability checking', async () => {
  await shareReferralTextFile(copy, () => false);
  expect(native.available).not.toHaveBeenCalled();
  let current = true;
  native.available.mockImplementationOnce(async () => {
    current = false;
    return true;
  });
  await shareReferralTextFile(copy, () => current);
  expect(native.files.size).toBe(0);
  expect(native.handoff).not.toHaveBeenCalled();
});

it('prunes only expired export-cache files, keeping recent handoffs and other cached files', async () => {
  native.files.set('/cache/referral-exports/old.txt', {
    text: 'old',
    modified: Date.now() - 25 * 60 * 60 * 1000,
  });
  native.files.set('/cache/referral-exports/recent.txt', {
    text: 'recent',
    modified: Date.now(),
  });
  native.files.set('/cache/other.txt', { text: 'other feature', modified: 0 });
  await shareReferralTextFile(copy, () => true);
  expect(native.files.has('/cache/referral-exports/old.txt')).toBe(false);
  expect(native.files.has('/cache/referral-exports/recent.txt')).toBe(true);
  expect(native.files.has('/cache/other.txt')).toBe(true);
});
