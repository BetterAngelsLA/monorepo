import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { useActiveOrgId } from '../../../hooks';
import { CreateTaskDocument } from '../../../ui-components/TaskForm/__generated__/createTask.generated';
import { DeleteTaskDocument } from '../../../ui-components/TaskForm/__generated__/deleteTask.generated';
import { UpdateTaskDocument } from '../../../ui-components/TaskForm/__generated__/updateTask.generated';
import type { DraftTask } from '../NoteFormHmis';
import splitTasks from './splitTasks';

export function useApplyTasks() {
  const [createTask] = useMutation(CreateTaskDocument);
  const [updateTask] = useMutation(UpdateTaskDocument);
  const [deleteTask] = useMutation(DeleteTaskDocument);
  const activeOrgId = useActiveOrgId();

  const applyTasks = useCallback(
    async (
      tasks: DraftTask[] | undefined,
      hmisNoteId: string,
      hmisClientProfileId: string,
    ) => {
      const { toCreateTask, toUpdateTask, toDeleteTask } = splitTasks(tasks);

      // No active org to anchor creates to (none remembered / none to join).
      if (!activeOrgId) return;

      for (const s of toCreateTask) {
        await createTask({
          variables: {
            data: {
              summary: s.summary || '',
              teamId: s.teamId ?? undefined,
              description: s.description,
              status: s.status,
              hmisClientProfile: hmisClientProfileId,
              hmisNote: hmisNoteId,
              organizationId: activeOrgId,
            },
          },
        });
      }

      for (const s of toDeleteTask) {
        await deleteTask({
          variables: { id: String(s.id) },
        });
      }

      for (const s of toUpdateTask) {
        await updateTask({
          variables: {
            data: {
              // safe: splitTasks guarantees id for update tasks
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              id: s.id!,
              summary: s.summary,
              teamId: s.teamId ?? undefined,
              description: s.description,
              status: s.status,
            },
          },
        });
      }
    },
    [activeOrgId, createTask, deleteTask, updateTask],
  );

  return { applyTasks };
}
