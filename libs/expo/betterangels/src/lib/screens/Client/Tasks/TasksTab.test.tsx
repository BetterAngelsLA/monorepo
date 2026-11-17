import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClientProfileQuery } from '../__generated__/Client.generated';

import { TasksTab } from './TasksTab';

afterEach(cleanup);

const mocks = vi.hoisted(() => ({
  activeOrgId: 'org-1' as string | null,
  createTask: vi.fn(),
  navigate: vi.fn(),
  showModalScreen: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  PlusIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  IconButton: ({
    accessibilityLabel,
    onPress,
    children,
  }: {
    accessibilityLabel?: string;
    onPress?: () => void;
    children?: ReactNode;
  }) => (
    <Pressable
      accessibilityHint="opens Task form"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      {children}
    </Pressable>
  ),
  SearchBar: () => null,
  TextRegular: ({ children }: { children?: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

vi.mock('expo-router', () => ({
  router: { navigate: mocks.navigate },
}));

vi.mock('../../../hooks', () => ({
  TASK_CREATE_FAILED_MESSAGE: 'Error creating a task.',
  useActiveOrgId: () => mocks.activeOrgId,
  useCreateTask: () => mocks.createTask,
  useSnackbar: () => ({ showSnackbar: mocks.showSnackbar }),
}));

vi.mock('../../../providers', () => ({
  useModalScreen: () => ({ showModalScreen: mocks.showModalScreen }),
}));

vi.mock('../../../state', () => ({
  useUserTeamPreference: () => [null],
}));

vi.mock('../../../ui-components', () => ({
  ModelFilters: () => null,
  TaskCard: () => null,
  TaskForm: ({
    onSubmit,
  }: {
    onSubmit: (data: { summary: string }) => void;
  }) => (
    <Pressable
      accessibilityRole="button"
      testID="task-form-submit"
      onPress={() => onSubmit({ summary: 'New task' })}
    >
      <Text>Save</Text>
    </Pressable>
  ),
  TaskList: ({
    renderHeader,
  }: {
    renderHeader?: (visible: number, total?: number) => ReactNode;
  }) => <>{renderHeader?.(0, 0)}</>,
  toModelFilterValues: () => ({}),
}));

async function renderTab() {
  const client = {
    clientProfile: { id: 'client-1' },
  } as unknown as ClientProfileQuery;

  return await render(<TasksTab client={client} />);
}

async function openTaskForm(tab: Awaited<ReturnType<typeof renderTab>>) {
  fireEvent.press(tab.getByLabelText('open Task form'));

  expect(mocks.showModalScreen).toHaveBeenCalledTimes(1);

  const [{ renderContent }] = mocks.showModalScreen.mock.calls[0] as [
    {
      renderContent: (args: { close: () => void }) => ReactElement;
    },
  ];
  const close = vi.fn();
  const modal = await render(renderContent({ close }));

  return { close, modal };
}

beforeEach(() => {
  mocks.activeOrgId = 'org-1';
  mocks.createTask.mockReset();
  mocks.navigate.mockReset();
  mocks.showModalScreen.mockReset();
  mocks.showSnackbar.mockReset();
});

describe('TasksTab task form', () => {
  it('keeps the form open on refusal and closes after a successful retry', async () => {
    mocks.createTask.mockResolvedValue({
      ok: false,
      message: 'You cannot add tasks.',
      result: undefined,
    });

    const tab = await renderTab();
    const { close, modal } = await openTaskForm(tab);

    await act(async () => {
      fireEvent.press(modal.getByTestId('task-form-submit'));
    });

    await waitFor(() =>
      expect(mocks.showSnackbar).toHaveBeenCalledWith({
        message: 'You cannot add tasks.',
        type: 'error',
      }),
    );
    expect(close).not.toHaveBeenCalled();

    mocks.createTask.mockResolvedValue({
      ok: true,
      result: { data: { createTask: { __typename: 'TaskType' } } },
    });

    await act(async () => {
      fireEvent.press(modal.getByTestId('task-form-submit'));
    });

    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });
});
