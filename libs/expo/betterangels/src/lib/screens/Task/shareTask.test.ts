import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';
import { shareTask, taskShareUrl } from './shareTask';

vi.mock('expo-clipboard', () => ({ setStringAsync: vi.fn() }));

const setPlatform = (os: string) =>
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });

// Carries a summary and a client so a conditional leak can't pass as link-only.
const task = (
  overrides: Partial<{
    summary: string;
    clientProfile: { firstName: string; lastName: string };
  }> = {},
) => ({
  id: 'task-1',
  summary: 'Follow up with Jordan Rivera about housing',
  clientProfile: { firstName: 'Jordan', lastName: 'Rivera' },
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

  it('keeps a branch base on another betterangels.la host', () => {
    setPlatform('web');
    vi.stubGlobal('window', {
      location: {
        origin: 'https://preview.betterangels.la',
        host: 'preview.betterangels.la',
        pathname: '/branches/feature-x/task/task-1',
      },
    });

    expect(taskShareUrl('task-2')).toBe(
      'https://preview.betterangels.la/branches/feature-x/task/task-2',
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

describe('shareTask', () => {
  it('shares only the link and reports success', async () => {
    vi.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

    await expect(shareTask(task())).resolves.toBe('shared');
    expect(Share.share).toHaveBeenCalledWith(
      {
        title: 'Task',
        message: 'https://outreach.dev.betterangels.la/task/task-1',
      },
      expect.objectContaining({ subject: 'Task' }),
    );
  });

  it('never puts the summary or the client name in the shared message', async () => {
    vi.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const share = vi.mocked(Share.share);

    await shareTask(
      task({
        summary: 'Call Jordan Rivera about the housing application',
      }),
    );

    const [content] = share.mock.calls[0];
    expect(content).toStrictEqual({
      title: 'Task',
      message: 'https://outreach.dev.betterangels.la/task/task-1',
    });
    expect(JSON.stringify(content)).not.toContain('Jordan Rivera');
    expect(JSON.stringify(content)).not.toContain('Call Jordan');
  });

  // react-native-web forwards to navigator.share, whose promise resolves
  // `undefined` — a completed share, not a fallback to the clipboard.
  it('reports success on web when the sheet completes', async () => {
    setPlatform('web');
    vi.spyOn(Share, 'share').mockResolvedValue(undefined as never);

    await expect(shareTask(task())).resolves.toBe('shared');
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  });

  it('anchors the iOS sheet when given a source node', async () => {
    vi.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

    await shareTask(task(), 42);

    expect(Share.share).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ anchor: 42 }),
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
