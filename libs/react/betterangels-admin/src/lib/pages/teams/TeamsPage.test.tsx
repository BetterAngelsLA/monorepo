import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ActiveOrgProvider } from '@monorepo/ba-platform';
import { TeamPermissions } from '@monorepo/ba-platform/permissions';
import { Alert } from '@monorepo/react/components';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsPage } from './TeamsPage';

const ORG = {
  id: 'org-1',
  name: 'Test Org',
  permissions: [
    TeamPermissions.View,
    TeamPermissions.Add,
    TeamPermissions.Change,
    TeamPermissions.Delete,
  ],
};

const TEAM_IN_USE = {
  __typename: 'TeamType',
  id: 'team-1',
  name: 'Drop-in Center',
  isActive: true,
  isInUse: true,
  createdAt: '2026-01-01T00:00:00+00:00',
};

const TEAM_FREE = {
  __typename: 'TeamType',
  id: 'team-2',
  name: 'Morning Outreach',
  isActive: true,
  isInUse: false,
  createdAt: '2026-01-02T00:00:00+00:00',
};

const DELETE_REFUSAL =
  'Cannot delete "Morning Outreach": it is used by 12 notes and 3 tasks. ' +
  'Deactivate it instead — an inactive team is hidden in the app but keeps its history.';

/** Answers by operation name, and records the variables each was issued with. */
function createClient() {
  const variablesByOperation: Record<string, Record<string, unknown>> = {};

  const answers: Record<string, unknown> = {
    DeleteTeam: {
      deleteTeam: {
        __typename: 'OperationInfo',
        messages: [
          {
            __typename: 'OperationMessage',
            kind: 'VALIDATION',
            field: null,
            message: DELETE_REFUSAL,
          },
        ],
      },
    },
    UpdateTeam: {
      updateTeam: { ...TEAM_IN_USE, isActive: false },
    },
    AdminTeams: {
      teams: {
        __typename: 'TeamTypeOffsetPaginated',
        totalCount: 2,
        results: [TEAM_IN_USE, TEAM_FREE],
      },
    },
  };

  const link = new ApolloLink((operation) => {
    variablesByOperation[operation.operationName] = operation.variables;

    return new Observable((observer) => {
      observer.next({ data: answers[operation.operationName] } as never);
      observer.complete();
    });
  });

  return {
    variablesByOperation,
    client: new ApolloClient({ link, cache: new InMemoryCache() }),
  };
}

function renderPage() {
  const { client, variablesByOperation } = createClient();

  render(
    <ApolloProvider client={client}>
      <ActiveOrgProvider organizations={[ORG]}>
        <>
          <TeamsPage />
          <Alert />
        </>
      </ActiveOrgProvider>
    </ApolloProvider>,
  );

  return { variablesByOperation };
}

/** Open the row menu for `name`. Card and table layouts each render one, hence `getAllBy`. */
async function openMenu(name: string) {
  await waitFor(() =>
    expect(screen.getAllByText(name).length).toBeGreaterThan(0),
  );

  fireEvent.click(
    screen.getAllByRole('button', { name: `Actions for ${name}` })[0],
  );
}

describe('TeamsPage', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks for every team, since it searches and sorts client-side', async () => {
    const { variablesByOperation } = renderPage();

    await waitFor(() =>
      expect(variablesByOperation['AdminTeams']).toBeTruthy(),
    );

    const pagination = variablesByOperation['AdminTeams']['pagination'] as {
      limit?: number;
    };

    expect(pagination?.limit).toBeGreaterThan(100);
  });

  it('offers Deactivate and not Delete for a team in use', async () => {
    renderPage();

    await openMenu(TEAM_IN_USE.name);

    expect(
      screen.getAllByRole('button', { name: 'Deactivate' }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('offers Delete for a team nothing holds', async () => {
    renderPage();

    await openMenu(TEAM_FREE.name);

    expect(
      screen.getAllByRole('button', { name: 'Delete' }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Deactivate' })).toBeNull();
  });

  it('deactivating asks the server to clear isActive', async () => {
    const { variablesByOperation } = renderPage();

    await openMenu(TEAM_IN_USE.name);
    fireEvent.click(screen.getAllByRole('button', { name: 'Deactivate' })[0]);

    await waitFor(() =>
      expect(variablesByOperation['UpdateTeam']).toBeTruthy(),
    );

    expect(variablesByOperation['UpdateTeam']['data']).toEqual({
      id: TEAM_IN_USE.id,
      isActive: false,
    });
  });

  it('shows the reason the server refused a delete', async () => {
    renderPage();

    await openMenu(TEAM_FREE.name);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => expect(screen.getByText(DELETE_REFUSAL)).toBeTruthy());
  });
});
