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

/** A worker who may only view teams (e.g. a role-backed caseworker). */
const VIEW_ONLY_ORG = {
  id: 'org-1',
  name: 'Test Org',
  permissions: [TeamPermissions.View],
};

const TEAM = {
  __typename: 'TeamType',
  id: 'team-1',
  name: 'Drop-in Center',
  isActive: true,
  createdAt: '2026-01-01T00:00:00+00:00',
};

const DELETE_REFUSAL =
  'Cannot delete "Drop-in Center": it is used by 12 notes and 3 tasks. ' +
  'Deactivate it instead — an inactive team is hidden in the app but keeps its history.';

/** Answers by operation name, and records the variables each was issued with. */
function createClient() {
  const variablesByOperation: Record<string, Record<string, unknown>> = {};

  const link = new ApolloLink((operation) => {
    variablesByOperation[operation.operationName] = operation.variables;

    const data =
      operation.operationName === 'DeleteTeam'
        ? {
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
          }
        : {
            teams: {
              __typename: 'TeamTypeOffsetPaginated',
              totalCount: 1,
              results: [TEAM],
            },
          };

    return new Observable((observer) => {
      observer.next({ data } as never);
      observer.complete();
    });
  });

  return {
    variablesByOperation,
    client: new ApolloClient({ link, cache: new InMemoryCache() }),
  };
}

function renderPage(org = ORG) {
  const { client, variablesByOperation } = createClient();

  render(
    <ApolloProvider client={client}>
      <ActiveOrgProvider organizations={[org]}>
        <>
          <TeamsPage />
          <Alert />
        </>
      </ActiveOrgProvider>
    </ApolloProvider>,
  );

  return { variablesByOperation };
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

  it('passes the active organization id as the teams filter', async () => {
    const { variablesByOperation } = renderPage();

    await waitFor(() =>
      expect(variablesByOperation['AdminTeams']).toBeTruthy(),
    );

    const filters = variablesByOperation['AdminTeams']['filters'] as {
      organizationId?: string;
    };
    expect(filters?.organizationId).toBe(ORG.id);
  });

  it('hides edit/delete actions from a view-only holder', async () => {
    renderPage(VIEW_ONLY_ORG);

    await waitFor(() =>
      expect(screen.getAllByText(TEAM.name).length).toBeGreaterThan(0),
    );

    // No Add button and no per-row actions menu for a view-only viewer.
    expect(
      screen.queryByRole('button', { name: 'Add Team' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: `Actions for ${TEAM.name}` }),
    ).toBeNull();
  });

  it('shows the reason a delete was refused', async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getAllByText(TEAM.name).length).toBeGreaterThan(0),
    );

    fireEvent.click(
      screen.getAllByRole('button', { name: `Actions for ${TEAM.name}` })[0],
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => expect(screen.getByText(DELETE_REFUSAL)).toBeTruthy());
  });
});
