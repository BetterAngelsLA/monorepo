import { renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DraftTask } from '../NoteFormHmis';

import { useApplyTasks } from './useApplyTasks';

const mocks = vi.hoisted(() => ({
  activeOrgId: null as string | null,
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('../../../hooks', () => ({
  useActiveOrgId: () => mocks.activeOrgId,
}));

// Identify the mutation by the generated document's operation name.  The real
// documents are static objects, so this keeps the test from mocking three
// generated modules just to tell the hooks apart.
vi.mock('@apollo/client/react', () => ({
  useMutation: (document: {
    definitions?: Array<{ name?: { value?: string } }>;
  }) => {
    switch (document?.definitions?.[0]?.name?.value) {
      case 'CreateTask':
        return [mocks.createTask, { loading: false, error: undefined }];
      case 'UpdateTask':
        return [mocks.updateTask, { loading: false, error: undefined }];
      case 'DeleteTask':
        return [mocks.deleteTask, { loading: false, error: undefined }];
      default:
        throw new Error('Unexpected mutation document in useApplyTasks test');
    }
  },
}));

function draftTask(overrides: Partial<DraftTask> = {}): DraftTask {
  return {
    id: 'tmp-1',
    summary: 'A task',
    description: null,
    status: 'TO_DO' as DraftTask['status'],
    teamId: null,
    assigneeId: null,
    ...overrides,
  };
}

beforeEach(() => {
  mocks.activeOrgId = null;
  mocks.createTask.mockReset().mockResolvedValue({ data: {} });
  mocks.updateTask.mockReset().mockResolvedValue({ data: {} });
  mocks.deleteTask.mockReset().mockResolvedValue({ data: {} });
});

describe('useApplyTasks', () => {
  it('rejects instead of silently dropping creates when no org is active', async () => {
    const { result } = await renderHook(() => useApplyTasks());

    // A note save runs this inside its try/catch, so a rejection is what puts a
    // "failed to save" in front of the user.  Resolving here discards the task
    // with no signal at all.
    await expect(
      result.current.applyTasks([draftTask()], 'hmis-note-1', 'hmis-client-1'),
    ).rejects.toThrow(/organization/i);

    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it('still applies updates and deletes without an active org', async () => {
    const { result } = await renderHook(() => useApplyTasks());

    // These name a row, so they do not need the create org and must keep
    // working; the fix for the case above must not block them.
    await result.current.applyTasks(
      [
        draftTask({ id: '42', summary: 'existing task' }),
        draftTask({
          id: '43',
          summary: 'deleted task',
          markedForDeletion: true,
        }),
      ],
      'hmis-note-1',
      'hmis-client-1',
    );

    expect(mocks.updateTask).toHaveBeenCalledTimes(1);
    expect(mocks.deleteTask).toHaveBeenCalledTimes(1);
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it('sends the active organization on creates', async () => {
    mocks.activeOrgId = 'org-1';
    const { result } = await renderHook(() => useApplyTasks());

    await result.current.applyTasks(
      [draftTask()],
      'hmis-note-1',
      'hmis-client-1',
    );

    expect(mocks.createTask).toHaveBeenCalledTimes(1);
    expect(mocks.createTask).toHaveBeenCalledWith({
      variables: {
        data: expect.objectContaining({
          organizationId: 'org-1',
          hmisNote: 'hmis-note-1',
          hmisClientProfile: 'hmis-client-1',
          summary: 'A task',
        }),
      },
    });
  });
});
