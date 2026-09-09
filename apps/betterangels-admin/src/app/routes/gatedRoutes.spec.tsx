import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { UserProvider } from '@monorepo/ba-platform';
import { TeamPermissions } from '@monorepo/ba-platform/permissions';
import { AuthProvider } from '@monorepo/react/betterangels-admin';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppLayout } from '../Layout/AppLayout';
import { PermissionGuard } from './PermissionGuard';

/**
 * ``PermissionGuard`` reads permissions off the active organization, which
 * arrive with the user query -- so it reads "not known yet" as "denied" and
 * redirects. What stops that is ``AuthProvider``: it renders nothing until the
 * query has both settled *and* produced a user, and `/teams` is covered by it
 * because ``routeAccess`` has no entry for that path and ``getRouteAccess``
 * falls through ``startsWith`` to ``'/': 'safe'``.
 *
 * Both halves matter. ``isLoading`` alone is not enough: ``UserProvider`` sets
 * ``user`` in an effect, so there is one commit where the query has settled and
 * ``user`` is still undefined.
 */

const USER_RESULT = {
  data: {
    currentUser: {
      __typename: 'UserType',
      id: 'user-1',
      username: 'someone',
      firstName: 'Some',
      lastName: 'One',
      email: 'someone@example.com',
      organizations: [
        {
          __typename: 'OrganizationType',
          id: 'org-1',
          name: 'Org One',
          permissions: [TeamPermissions.View],
        },
      ],
    },
  },
};

/** A client whose only operation stays in flight until ``resolve`` is called. */
function createDeferredClient() {
  let emit: (() => void) | undefined;

  const link = new ApolloLink(
    () =>
      new Observable((observer) => {
        emit = () => {
          observer.next(USER_RESULT as never);
          observer.complete();
        };
      }),
  );

  return {
    client: new ApolloClient({ link, cache: new InMemoryCache() }),
    resolve: () => emit?.(),
  };
}

function renderAtTeams() {
  const { client, resolve } = createDeferredClient();

  render(
    <ApolloProvider client={client}>
      <MemoryRouter initialEntries={['/teams']}>
        <UserProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route path="/" element={<div>home stand-in</div>} />
                <Route
                  path="/teams"
                  element={
                    <PermissionGuard permission={TeamPermissions.View}>
                      <div>teams stand-in</div>
                    </PermissionGuard>
                  }
                />
              </Route>
            </Routes>
          </AuthProvider>
        </UserProvider>
      </MemoryRouter>
    </ApolloProvider>,
  );

  return { resolve };
}

describe('permission-gated routes', () => {
  it('are not rendered, or redirected, until the user is known', async () => {
    const { resolve } = renderAtTeams();

    expect(screen.queryByText('teams stand-in')).toBeNull();
    expect(screen.queryByText('home stand-in')).toBeNull();

    resolve();

    // The route that was asked for, not whichever one Home would forward to.
    await waitFor(() => expect(screen.getByText('teams stand-in')).toBeTruthy());
    expect(screen.queryByText('home stand-in')).toBeNull();
  });
});
