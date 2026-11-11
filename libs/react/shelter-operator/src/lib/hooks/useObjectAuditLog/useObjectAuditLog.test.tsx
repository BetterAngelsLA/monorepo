import { MockedProvider } from '@apollo/client/testing/react';
import { AuditTargetType } from '@monorepo/ba-platform/types';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useObjectAuditLog } from './useObjectAuditLog';
import { ObjectAuditLogDocument } from './__generated__/useObjectAuditLog.generated';

/** `AuditEventFilter` ANDs its predicates, so both must reach the request. */
const bothFilters = { systemOnly: true, actorId: 'user-1' };

const page = {
  request: {
    query: ObjectAuditLogDocument,
    variables: {
      targetType: AuditTargetType.Bed,
      objectId: '7',
      limit: 25,
      filters: bothFilters,
    },
  },
  result: {
    data: {
      objectAuditLog: {
        __typename: 'AuditActionPage',
        endCursor: null,
        hasNextPage: false,
        results: [
          {
            __typename: 'AuditActionType',
            timestamp: '2026-07-01T12:00:00Z',
            actor: 'AND ROW',
            truncated: false,
            fieldChanges: {},
            events: [],
          },
        ],
      },
    },
  },
};

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MockedProvider mocks={[page] as never} showWarnings={false}>
      {children}
    </MockedProvider>
  );
}

describe('useObjectAuditLog', () => {
  it('sends actorId and systemOnly together', async () => {
    // The mock only matches when the request carries both, so receiving its
    // rows proves the two filters compose instead of one being dropped.
    const { result } = renderHook(
      () =>
        useObjectAuditLog({
          targetType: AuditTargetType.Bed,
          objectId: '7',
          ...bothFilters,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.actions).toHaveLength(1));
    expect(result.current.actions[0].actor).toBe('AND ROW');
  });
});
