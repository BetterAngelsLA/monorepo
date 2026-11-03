import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSnackbar } from '../../hooks';
import { ShareTaskButton } from './ShareTaskButton';
import { shareTask } from './shareTask';

vi.mock('../../hooks', () => ({ useSnackbar: vi.fn() }));
vi.mock('../../navigation', () => ({
  HeaderSlot: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@monorepo/expo/shared/icons', () => ({ ShareIcon: () => null }));
vi.mock('./shareTask', () => ({ shareTask: vi.fn() }));

const showSnackbar = vi.fn();

beforeEach(() => {
  vi.mocked(useSnackbar).mockReturnValue({ showSnackbar } as ReturnType<
    typeof useSnackbar
  >);
  vi.mocked(shareTask).mockReset();
  showSnackbar.mockReset();
});

describe('ShareTaskButton', () => {
  it('confirms a copied link', async () => {
    vi.mocked(shareTask).mockResolvedValue('copied');

    await render(<ShareTaskButton task={{ id: 'task-1' }} />);
    await fireEvent.press(screen.getByTestId('share-task'));

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith({
        message: 'Link copied',
        type: 'success',
      }),
    );
  });

  it('reports a failure without logging the error payload', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.mocked(shareTask).mockRejectedValue(new Error('boom'));

    await render(<ShareTaskButton task={{ id: 'task-1' }} />);
    await fireEvent.press(screen.getByTestId('share-task'));

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith({
        message: "Couldn't share this task",
        type: 'error',
      }),
    );
    // `toHaveBeenCalledWith` passes on any single matching call, so it would
    // stay green if the component also logged the raw error. Pin the whole call
    // list instead: exactly one call carrying nothing but the task id.
    expect(consoleError.mock.calls).toStrictEqual([
      ['share_task_failed', { taskId: 'task-1' }],
    ]);
  });

  it('disables the button while a share is pending', async () => {
    let resolve!: (value: 'shared') => void;
    vi.mocked(shareTask).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );

    await render(<ShareTaskButton task={{ id: 'task-1' }} />);
    const button = screen.getByTestId('share-task');

    fireEvent.press(button);

    await waitFor(() =>
      expect(
        screen.getByTestId('share-task').props.accessibilityState,
      ).toMatchObject({ disabled: true }),
    );

    fireEvent.press(button);
    expect(shareTask).toHaveBeenCalledTimes(1);

    resolve('shared');

    await waitFor(() =>
      expect(
        screen.getByTestId('share-task').props.accessibilityState,
      ).toMatchObject({ disabled: false }),
    );
  });
});
