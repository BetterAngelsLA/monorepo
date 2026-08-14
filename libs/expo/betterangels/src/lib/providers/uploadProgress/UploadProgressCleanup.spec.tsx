import { act, render } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { UploadProgressCleanup } from './UploadProgressCleanup';
import {
  completeUploadSession,
  endUploadSession,
  resetUploadProgressAtoms,
  startUploadSession,
  uploadSessionsAtom,
} from './uploadProgressAtoms';

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
    startUploadSession('s1', ['a.pdf']);
    completeUploadSession('s1');

    render(<UploadProgressCleanup />);

    expect(store.get(uploadSessionsAtom)).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
  });

  it('leaves in-flight sessions alone', () => {
    startUploadSession('s1', ['a.pdf']);

    render(<UploadProgressCleanup />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom).map((s) => s.id)).toEqual(['s1']);
  });

  it('clears a pending timer when a session ends before it fires', () => {
    startUploadSession('s1', ['a.pdf']);
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
    startUploadSession('s1', ['a.pdf']);
    startUploadSession('s2', ['b.pdf']);
    completeUploadSession('s1');
    completeUploadSession('s2');

    render(<UploadProgressCleanup />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(store.get(uploadSessionsAtom)).toEqual([]);
  });
});
