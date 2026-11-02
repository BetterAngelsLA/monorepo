import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';
import { shareTask, taskShareMessage, taskShareUrl } from './shareTask';

const appConfig = vi.hoisted(() => ({
  host: 'outreach.dev.betterangels.la' as string | undefined,
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        get outreachWebHost() {
          return appConfig.host;
        },
      },
    },
  },
}));

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
  appConfig.host = 'outreach.dev.betterangels.la';
  delete process.env['EXPO_PUBLIC_OUTREACH_WEB_URL'];
  vi.mocked(Clipboard.setStringAsync).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  setPlatform('ios');
});

describe('taskShareUrl', () => {
  it('builds the task url from the configured host', () => {
    expect(taskShareUrl('abc')).toBe(
      'https://outreach.dev.betterangels.la/task/abc',
    );
  });

  it('follows the host the app claims, not a second setting', () => {
    appConfig.host = 'outreach.betterangels.la';

    expect(taskShareUrl('abc')).toBe(
      'https://outreach.betterangels.la/task/abc',
    );
  });

  it('fails loudly when app config has no host', () => {
    appConfig.host = undefined;

    expect(() => taskShareUrl('abc')).toThrow('outreachWebHost');
  });

  it('uses a local web url when one is configured', () => {
    process.env['EXPO_PUBLIC_OUTREACH_WEB_URL'] = 'http://localhost:8081/';

    expect(taskShareUrl('abc')).toBe('http://localhost:8081/task/abc');
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
