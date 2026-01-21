import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateTaskDocument } from '../../../ui-components/TaskForm/__generated__/createTask.generated';
import { DeleteTaskDocument } from '../../../ui-components/TaskForm/__generated__/deleteTask.generated';
import { UpdateTaskDocument } from '../../../ui-components/TaskForm/__generated__/updateTask.generated';
import type { DraftTask } from '../HmisProgramNoteForm';
import splitTasks from './splitTasks';

export function useApplyTasks() {
  const [createTask] = useMutation(CreateTaskDocument);
  const [updateTask] = useMutation(UpdateTaskDocument);
  const [deleteTask] = useMutation(DeleteTaskDocument);

  const applyTasks = useCallback(
    async (
      tasks: DraftTask[] | undefined,
      hmisNoteId: string,
      hmisClientProfileId: string
    ) => {
      console.log('Applying tasks...');
      const { toCreateTask, toUpdateTask, toDeleteTask } = splitTasks(tasks);

      for (const s of toCreateTask) {
        console.log('CREATING A TASK');
        await createTask({
          variables: {
            data: {
              summary: s.summary || '',
              team: s.team || null,
              description: s.description,
              status: s.status,
              hmisClientProfile: hmisClientProfileId,
              hmisNote: hmisNoteId,
            },
          },
        });
      }

      for (const s of toDeleteTask) {
        console.log('DELETING A TASK');
        await deleteTask({
          variables: { id: String(s.id) },
        });
      }

      for (const s of toUpdateTask) {
        console.log('UPDATING A TASK');
        await updateTask({
          variables: {
            data: {
              id: s.id!,
              summary: s.summary,
              team: s.team || null,
              description: s.description,
              status: s.status,
            },
          },
        });
      }
    },
    [createTask, deleteTask, updateTask]
  );

  return { applyTasks };
}
