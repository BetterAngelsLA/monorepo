import { AuditEventKind, AuditTargetType } from '@monorepo/ba-platform/types';
import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ObjectAuditLog } from './ObjectAuditLog';
import { ObjectAuditLogDocument } from '../../hooks/useObjectAuditLog/__generated__/useObjectAuditLog.generated';

const baseVariables = {
  targetType: AuditTargetType.Bed,
  objectId: '7',
  limit: 25,
};

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'AuditEventType',
    timestamp: '2026-07-01T12:00:00Z',
    actor: 'Ada Lovelace',
    kind: AuditEventKind.Update,
    action: 'bed.update',
    targetType: AuditTargetType.Bed,
    targetId: '7',
    summary: null,
    context: null,
    fieldChanges: { name: ['Bed A', 'Bed B'] },
    ...overrides,
  };
}

function makeAction(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'AuditActionType',
    timestamp: '2026-07-01T12:00:00Z',
    actor: 'Ada Lovelace',
    summary: 'Ada Lovelace modified bed 7',
    truncated: false,
    fieldChanges: { name: ['Bed A', 'Bed B'] },
    events: [makeEvent()],
    ...overrides,
  };
}

function page(
  variables: Record<string, unknown>,
  results: Array<Record<string, unknown>>,
  endCursor: string | null,
  hasNextPage: boolean,
) {
  return {
    request: { query: ObjectAuditLogDocument, variables },
    result: {
      data: {
        objectAuditLog: {
          __typename: 'AuditActionPage',
          endCursor,
          hasNextPage,
          results,
        },
      },
    },
  };
}

function renderLog(mocks: ReadonlyArray<unknown>) {
  return render(
    <MockedProvider mocks={mocks as never} showWarnings={false}>
      <ObjectAuditLog targetType={AuditTargetType.Bed} objectId="7" />
    </MockedProvider>,
  );
}

describe('ObjectAuditLog', () => {
  it('renders grouped actions with their field changes', async () => {
    renderLog([page(baseVariables, [makeAction()], null, false)]);

    expect(await screen.findByText('Ada Lovelace')).not.toBeNull();
    expect(screen.getByText('Name:')).not.toBeNull();
    expect(screen.getByText('Bed B')).not.toBeNull();
  });

  it('shows the empty state when there are no actions', async () => {
    renderLog([page(baseVariables, [], null, false)]);

    await screen.findByText('No activity yet.');
  });

  it('appends the next page when loading more', async () => {
    renderLog([
      page(baseVariables, [makeAction()], 'c1', true),
      page(
        { ...baseVariables, after: 'c1' },
        [makeAction({ fieldChanges: { name: ['Bed A', 'PAGE2'] } })],
        null,
        false,
      ),
    ]);

    await screen.findByText('Name:');
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    expect(await screen.findByText('PAGE2')).not.toBeNull();
  });
});
