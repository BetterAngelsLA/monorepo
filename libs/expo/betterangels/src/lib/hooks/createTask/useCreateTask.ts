import { useMutation } from '@apollo/client/react';
import { useActiveOrgId } from '@monorepo/ba-platform';
import type { DocumentNode } from 'graphql';
import { useCallback } from 'react';

import type { CreateTaskInput } from '../../apollo';
import { CreateTaskDocument } from '../../ui-components/TaskForm/__generated__/createTask.generated';

export const NO_ACTIVE_ORG_MESSAGE = 'Select an organization to create a task.';

export const TASK_CREATE_FAILED_MESSAGE = 'Error creating a task.';

type TCreateTaskData = Omit<CreateTaskInput, 'organizationId'>;

type TCreateTaskOptions = {
  refetchQueries?: DocumentNode[];
  awaitRefetchQueries?: boolean;
};

/**
 * Create a task at the active organization.
 *
 * The org is not the caller's to pass: the server requires one, so it is added
 * here and nowhere else. A refusal — no org locally, or a server-side
 * OperationInfo — comes back as `ok: false` with the sentence to show, so the
 * caller's message and its early return sit in the same branch instead of one
 * layer apart. `ok` means the server accepted the task, not merely that the
 * mutation resolved.
 */
export function useCreateTask() {
  const activeOrgId = useActiveOrgId();
  const [createTask] = useMutation(CreateTaskDocument);

  return useCallback(
    async (data: TCreateTaskData, options?: TCreateTaskOptions) => {
      if (!activeOrgId) {
        return {
          ok: false as const,
          message: NO_ACTIVE_ORG_MESSAGE,
          result: undefined,
        };
      }

      const result = await createTask({
        ...options,
        variables: { data: { ...data, organizationId: activeOrgId } },
      });

      const created = result.data?.createTask;

      if (created?.__typename === 'OperationInfo') {
        return {
          ok: false as const,
          message: created.messages[0]?.message ?? TASK_CREATE_FAILED_MESSAGE,
          result,
        };
      }

      return { ok: true as const, result };
    },
    [activeOrgId, createTask],
  );
}
