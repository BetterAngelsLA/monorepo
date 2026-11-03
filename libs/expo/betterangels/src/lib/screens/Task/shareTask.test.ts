import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';
import { shareTask, taskShareMessage, taskShareUrl } from './shareTask';

vi.mock('expo-clipboard', () => ({ setStringAsync: vi.fn() }));

const setPlatform = (os: string) =>
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });

const task = (overrides: Record<string, unknown> = {}) => ({
  id: 'task-1',
  summary: 'Follow up on TAP card',
  ...overrides,
});

beforeEach(() => {
  setPlatform('ios');
  vi.stubEnv('EXPO_PUBLIC_OUTREACH_HOST', 'outreach.dev.betterangels.la');
  vi.mocked(Clipboard.setStringAsync).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  setPlatform('ios');
});

describe('taskShareUrl', () => {
  it('builds the task url from the configured host', () => {
    expect(taskShareUrl('abc')).toBe(
      'https://outreach.dev.betterangels.la/task/abc',
    );
  });

  it('fails loudly when the host is not configured', () => {
    vi.stubEnv('EXPO_PUBLIC_OUTREACH_HOST', '');

    expect(() => taskShareUrl('abc')).toThrow('EXPO_PUBLIC_OUTREACH_HOST');
  });

  it('follows a branch preview base path on web', () => {
    setPlatform('web');
    vi.stubGlobal('window', {
      location: {
        origin: 'https://outreach.dev.betterangels.la',
        host: 'outreach.dev.betterangels.la',
        pathname: '/branches/feature-x/task/task-1',
      },
    });

    expect(taskShareUrl('task-2')).toBe(
      'https://outreach.dev.betterangels.la/branches/feature-x/task/task-2',
    );
  });

  it('falls back to the configured host when the page is served elsewhere', () => {
    setPlatform('web');
    vi.stubGlobal('window', {
      location: {
        origin: 'https://preview.example.com',
        host: 'preview.example.com',
        pathname: '/task/task-1',
      },
    });

    expect(taskShareUrl('task-2')).toBe(
      'https://outreach.dev.betterangels.la/task/task-2',
    );
  });
});

describe('taskShareMessage', () => {
  const url = 'https://outreach.dev.betterangels.la/task/task-1';

  it('includes the summary when no client is attached', () => {
    expect(taskShareMessage(task(), url)).toBe(
      `Follow up on TAP card — ${url}`,
    );
  });

  it('shares only the link for a client-attached task', () => {
    expect(taskShareMessage(task({ hasClient: true }), url)).toBe(url);
  });

  it('shares only the link when the summary is blank', () => {
    expect(taskShareMessage(task({ summary: '   ' }), url)).toBe(url);
  });
});

describe('shareTask', () => {
  it('shares the message and reports success', async () => {
    vi.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

    await expect(shareTask(task())).resolves.toBe('shared');
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('/task/task-1'),
      }),
      expect.anything(),
    );
  });

  it('treats a dismissal as a user decision', async () => {
    vi.spyOn(Share, 'share').mockResolvedValue({
      action: Share.dismissedAction,
    });

    await expect(shareTask(task())).resolves.toBe('dismissed');
  });

  it('copies the link on web when the share sheet is unavailable', async () => {
    setPlatform('web');
    vi.spyOn(Share, 'share').mockRejectedValue(new Error('no web share'));

    await expect(shareTask(task())).resolves.toBe('copied');
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
      'https://outreach.dev.betterangels.la/task/task-1',
    );
  });

  it('treats a web dismissal (AbortError) as dismissed, not copied', async () => {
    setPlatform('web');
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    vi.spyOn(Share, 'share').mockRejectedValue(abort);

    await expect(shareTask(task())).resolves.toBe('dismissed');
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  });

  it('rethrows native failures so the caller can show an error', async () => {
    vi.spyOn(Share, 'share').mockRejectedValue(new Error('boom'));

    await expect(shareTask(task())).rejects.toThrow('boom');
  });
});
