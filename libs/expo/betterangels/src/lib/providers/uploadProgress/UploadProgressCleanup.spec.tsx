import { act, render } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { UploadProgressCleanup } from './UploadProgressCleanup';
import {
  completeUploadSession,
  endUploadSession,
  resetUploadProgressAtoms,
  setUploadStageVisible,
  startUploadSession,
  uploadSessionsAtom,
} from './uploadProgressAtoms';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
    },
  };
});

const store = getDefaultStore();

describe('UploadProgressCleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetUploadProgressAtoms();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetUploadProgressAtoms();
  });

  it('renders nothing', async () => {
    const { toJSON } = await render(<UploadProgressCleanup />);

    expect(toJSON()).toBeNull();
  });

  it('prunes completed sessions after the cleanup delay', async () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');

    await render(<UploadProgressCleanup />);

    expect(store.get(uploadSessionsAtom)).toHaveLength(1);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
  });

  it('leaves in-flight sessions alone', async () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });

    await render(<UploadProgressCleanup />);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom).map((s) => s.id)).toEqual(['s1']);
  });

  it('clears a pending timer when a session ends before it fires', async () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');

    await render(<UploadProgressCleanup />);

    // The session ends early (e.g. user retried it) → the timer is pruned.
    await act(async () => {
      endUploadSession('s1');
    });

    // Advancing past the delay must not end anything else or leak timers.
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(store.get(uploadSessionsAtom)).toEqual([]);
  });

  it('prunes each completed session exactly once', async () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    startUploadSession('s2', ['b.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');
    completeUploadSession('s2');

    await render(<UploadProgressCleanup />);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom)).toEqual([]);
  });

  it('keeps completed sessions while the upload stage is open', async () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');
    setUploadStageVisible(true);

    await render(<UploadProgressCleanup />);

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(1);
  });

  it('clears pending timers when the stage opens, then prunes after it closes', async () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');

    await render(<UploadProgressCleanup />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // The stage opens: the pending prune timer is cleared.
    await act(async () => {
      setUploadStageVisible(true);
    });

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(1);

    // The stage closes: pruning is scheduled again.
    await act(async () => {
      setUploadStageVisible(false);
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
  });
});
