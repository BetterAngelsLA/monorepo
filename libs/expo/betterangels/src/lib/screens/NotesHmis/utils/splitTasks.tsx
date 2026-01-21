import { DraftTask } from '../HmisProgramNoteForm';

export default function splitTasks(tasks?: DraftTask[]) {
  const draftTasks = tasks ?? [];

  // CREATE tasks: (no id), not marked for deletion
  const toCreateTask = draftTasks.filter(
    (s) => s.id?.includes('tmp-') && !s.markedForDeletion
  );

  // UPDATE tasks: persisted (has id), not marked for deletion
  const toUpdateTask = draftTasks.filter(
    (s) => !!s.id && !s.id?.includes('tmp-') && !s.markedForDeletion
  );

  // DELETE tasks: persisted rows (has id) explicitly marked for deletion
  const toDeleteTask = draftTasks.filter(
    (s) => !!s.id && !!s.markedForDeletion
  );

  return { toCreateTask, toUpdateTask, toDeleteTask };
}
