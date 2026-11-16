import { renderHook } from '@testing-library/react-native';

import { NO_ACTIVE_ORG_MESSAGE, useCreateTask } from './useCreateTask';

const { mutate, activeOrgId } = vi.hoisted(() => ({
  mutate: vi.fn(),
  activeOrgId: vi.fn<() => string | null>(),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [mutate],
}));

vi.mock('@monorepo/ba-platform', () => ({
  useActiveOrgId: () => activeOrgId(),
}));

beforeEach(() => {
  mutate.mockReset();
  activeOrgId.mockReset();
});

it('adds the active org to the payload', async () => {
  activeOrgId.mockReturnValue('org-1');
  mutate.mockResolvedValue({
    data: { createTask: { __typename: 'TaskType' } },
  });

  const { result } = await renderHook(() => useCreateTask());

  await expect(result.current({ summary: 'a task' })).resolves.toEqual({
    ok: true,
    result: { data: { createTask: { __typename: 'TaskType' } } },
  });

  expect(mutate).toHaveBeenCalledExactlyOnceWith({
    variables: { data: { summary: 'a task', organizationId: 'org-1' } },
  });
});

it('sends nothing when there is no active org', async () => {
  activeOrgId.mockReturnValue(null);

  const { result } = await renderHook(() => useCreateTask());

  await expect(result.current({ summary: 'a task' })).resolves.toEqual({
    ok: false,
    message: NO_ACTIVE_ORG_MESSAGE,
  });
  expect(mutate).not.toHaveBeenCalled();
});

it('passes refetch options through with the payload', async () => {
  activeOrgId.mockReturnValue('org-1');
  mutate.mockResolvedValue({
    data: { createTask: { __typename: 'TaskType' } },
  });

  const { result } = await renderHook(() => useCreateTask());

  await result.current({ summary: 'a task' }, { awaitRefetchQueries: true });

  expect(mutate).toHaveBeenCalledExactlyOnceWith({
    awaitRefetchQueries: true,
    variables: { data: { summary: 'a task', organizationId: 'org-1' } },
  });
});
