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

  it('renders nothing', () => {
    const { toJSON } = render(<UploadProgressCleanup />);

    expect(toJSON()).toBeNull();
  });

  it('prunes completed sessions after the cleanup delay', () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');

    render(<UploadProgressCleanup />);

    expect(store.get(uploadSessionsAtom)).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
  });

  it('leaves in-flight sessions alone', () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });

    render(<UploadProgressCleanup />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom).map((s) => s.id)).toEqual(['s1']);
  });

  it('clears a pending timer when a session ends before it fires', () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');

    render(<UploadProgressCleanup />);

    // The session ends early (e.g. user retried it) → the timer is pruned.
    act(() => {
      endUploadSession('s1');
    });

    // Advancing past the delay must not end anything else or leak timers.
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(store.get(uploadSessionsAtom)).toEqual([]);
  });

  it('prunes each completed session exactly once', () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    startUploadSession('s2', ['b.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');
    completeUploadSession('s2');

    render(<UploadProgressCleanup />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom)).toEqual([]);
  });

  it('keeps completed sessions while the upload stage is open', () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');
    setUploadStageVisible(true);

    render(<UploadProgressCleanup />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(1);
  });

  it('clears pending timers when the stage opens, then prunes after it closes', () => {
    startUploadSession('s1', ['a.pdf'], { refIds: ['r0'] });
    completeUploadSession('s1');

    render(<UploadProgressCleanup />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // The stage opens: the pending prune timer is cleared.
    act(() => {
      setUploadStageVisible(true);
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(1);

    // The stage closes: pruning is scheduled again.
    act(() => {
      setUploadStageVisible(false);
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
  });
});
