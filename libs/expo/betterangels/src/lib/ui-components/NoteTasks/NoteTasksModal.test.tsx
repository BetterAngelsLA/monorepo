import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NoteTasksModal from './NoteTasksModal';

afterEach(cleanup);

const mocks = vi.hoisted(() => ({
  closeModal: vi.fn(),
  onSubmit: vi.fn(),
  refetch: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock('../TaskForm', () => ({
  TaskForm: ({
    onSubmit,
  }: {
    onSubmit: (data: { summary: string }) => void;
  }) => (
    <Pressable
      accessibilityRole="button"
      testID="task-form-submit"
      onPress={() => onSubmit({ summary: 'A task' })}
    >
      <Text>Save</Text>
    </Pressable>
  ),
}));

vi.mock('../../hooks', () => ({
  useCreateTask: () => vi.fn(),
  useSnackbar: () => ({ showSnackbar: mocks.showSnackbar }),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn()],
}));

beforeEach(() => {
  mocks.closeModal.mockReset();
  mocks.onSubmit.mockReset();
  mocks.refetch.mockReset();
  mocks.showSnackbar.mockReset();
});

async function renderModal() {
  return await render(
    <NoteTasksModal
      refetch={mocks.refetch}
      onSubmit={mocks.onSubmit}
      closeModal={mocks.closeModal}
    />,
  );
}

describe('NoteTasksModal onSubmit', () => {
  it('stays open when the save is refused', async () => {
    mocks.onSubmit.mockResolvedValue(false);

    const modal = await renderModal();
    fireEvent.press(modal.getByTestId('task-form-submit'));

    await waitFor(() => expect(mocks.onSubmit).toHaveBeenCalledTimes(1));
    expect(mocks.closeModal).not.toHaveBeenCalled();
  });

  it('closes when the save succeeds', async () => {
    mocks.onSubmit.mockResolvedValue(true);

    const modal = await renderModal();
    fireEvent.press(modal.getByTestId('task-form-submit'));

    await waitFor(() => expect(mocks.closeModal).toHaveBeenCalledTimes(1));
  });

  it('closes for the legacy void return', async () => {
    mocks.onSubmit.mockResolvedValue(undefined);

    const modal = await renderModal();
    fireEvent.press(modal.getByTestId('task-form-submit'));

    await waitFor(() => expect(mocks.closeModal).toHaveBeenCalledTimes(1));
  });
});
