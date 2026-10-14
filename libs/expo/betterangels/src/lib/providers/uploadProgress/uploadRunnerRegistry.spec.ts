import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelAllUploadRunners,
  registerUploadRunner,
  resetUploadRunners,
  type TUploadRunner,
} from './uploadRunnerRegistry';

const createRunner = (
  overrides: Partial<TUploadRunner> = {},
): TUploadRunner => ({
  cancelItem: vi.fn(),
  rerun: vi.fn(),
  cancelAll: vi.fn(),
  ...overrides,
});

describe('cancelAllUploadRunners', () => {
  beforeEach(() => {
    resetUploadRunners();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetUploadRunners();
  });

  it('cancels every registered runner', () => {
    const first = createRunner();
    const second = createRunner();

    registerUploadRunner('session-1', first);
    registerUploadRunner('session-2', second);

    cancelAllUploadRunners();

    expect(first.cancelAll).toHaveBeenCalledTimes(1);
    expect(second.cancelAll).toHaveBeenCalledTimes(1);
  });

  it('keeps cancelling the remaining runners when one throws', () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const throwing = createRunner({
      cancelAll: vi.fn(() => {
        throw new Error('abort failed');
      }),
    });
    const next = createRunner();

    registerUploadRunner('session-1', throwing);
    registerUploadRunner('session-2', next);

    expect(() => cancelAllUploadRunners()).not.toThrow();
    expect(next.cancelAll).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
