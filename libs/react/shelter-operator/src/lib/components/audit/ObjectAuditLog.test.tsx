import { AuditEventKind, AuditTargetType } from '@monorepo/ba-platform/types';
import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ObjectAuditLog } from './ObjectAuditLog';
import { ObjectAuditLogDocument } from '../../hooks/useObjectAuditLog/__generated__/useObjectAuditLog.generated';

afterEach(() => {
  vi.restoreAllMocks();
});

vi.mock('@monorepo/ba-platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/ba-platform')>()),
  useActiveOrg: () => ({
    activeOrg: undefined,
    organizations: [],
    setActiveOrgId: () => undefined,
    hasPermission: () => false,
  }),
}));

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
  it('hides actions with no renderable content', async () => {
    renderLog([
      page(
        baseVariables,
        [
          makeAction({
            actor: 'System',
            summary: 'System modified bed 7',
            fieldChanges: {},
            events: [],
          }),
          makeAction(),
        ],
        null,
        false,
      ),
    ]);

    await screen.findByText('Name:');
    expect(screen.queryByText('System')).toBeNull();
  });

  it('shows the empty state when every action is empty', async () => {
    renderLog([
      page(
        baseVariables,
        [
          makeAction({
            summary: 'System modified bed 7',
            fieldChanges: {},
            events: [],
          }),
        ],
        null,
        false,
      ),
    ]);

    await screen.findByText('No activity yet.');
  });

  it('keeps the loaded rows and offers a retry when loading more fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const failingPage = {
      request: {
        query: ObjectAuditLogDocument,
        variables: { ...baseVariables, after: 'c1' },
      },
      error: new Error('network down'),
    };

    renderLog([page(baseVariables, [makeAction()], 'c1', true), failingPage]);

    await screen.findByText('Name:');
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    await screen.findByText('Unable to load more activity.');
    expect(screen.getByText('Name:')).not.toBeNull();
    expect(screen.getByRole('button', { name: /retry/i })).not.toBeNull();
    // The actual error is logged; the user only sees the generic message.
    expect(consoleError).toHaveBeenCalled();
  });

  it('does not append the same page twice on a double click', async () => {
    const pageTwo = (id: number) =>
      page(
        { ...baseVariables, after: 'c1' },
        [
          makeAction({
            fieldChanges: { name: ['Bed A', 'PAGE2'] },
          }),
        ],
        `c2-${id}`,
        false,
      );

    renderLog([
      page(baseVariables, [makeAction()], 'c1', true),
      pageTwo(1),
      pageTwo(2),
    ]);

    await screen.findByText('Name:');
    const button = screen.getByRole('button', { name: /load more/i });
    fireEvent.click(button);
    fireEvent.click(button);

    await screen.findByText('PAGE2');
    await waitFor(() => expect(screen.getAllByText('PAGE2')).toHaveLength(1));
  });
});
