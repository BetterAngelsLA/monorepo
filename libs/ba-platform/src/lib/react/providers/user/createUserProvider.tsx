import { useQuery } from '@apollo/client/react';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActiveOrgProvider } from '../activeOrg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Standardised user state exposed via context and the ``useUser`` hook. */
export interface UserState<TUser> {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

/**
 * Configuration for :func:`createUserProvider`.
 *
 * @typeParam TUser  App-specific user type (the value stored in context).
 * @typeParam TQuery The GraphQL operation result type
 *   (e.g. ``CurrentOrgUserQuery``).
 */
export interface UserProviderConfig<TUser, TQuery> {
  /** GraphQL document that fetches the current user. */
  document: TypedDocumentNode<TQuery, Record<string, never>>;

  /**
   * Map the raw GraphQL ``currentUser`` (or ``undefined``) to the
   * app-specific user object.
   */
  parseUser: (data: TQuery['currentUser'] | undefined) => TUser | undefined;

  /**
   * Return ``true`` when the errors indicate the session is expired or
   * the user is not authenticated.
   */
  isUnauthenticated: (
    errors: readonly { message: string; extensions?: Record<string, unknown> }[] | undefined
  ) => boolean;

  /**
   * Optional extra context to merge into the context value exposed by
   * ``useUser``. Useful for app-specific fields like ``isHmisUser``.
   */
  extraContextValue?: (user?: TUser) => Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a fully-typed ``UserProvider`` component and accompanying
 * ``useUser`` hook.
 *
 * The returned provider handles the Apollo query lifecycle,
 * authentication-error detection, and automatically embeds
 * :component:`ActiveOrgProvider` so that permission-aware components
 * can call ``useActiveOrg().hasPermission()`` throughout the tree.
 *
 * ```ts
 * const { UserProvider, useUser } = createUserProvider({
 *   document: CurrentOrgUserDocument,
 *   parseUser: (data) => data ? { id: data.id, ... } : undefined,
 *   isUnauthenticated: (errors) =>
 *     errors?.some((e) => e.message.includes('User is not logged in.')) ?? false,
 * });
 * ```
 */
export function createUserProvider<TUser extends { organizations?: readonly { id: string; name: string }[] | null }, TQuery extends { currentUser?: unknown }>(
  config: UserProviderConfig<TUser, TQuery>
) {
  const {
    document,
    parseUser,
    isUnauthenticated,
    extraContextValue = () => ({}),
  } = config;

  // ---- Context -------------------------------------------------------

  type ContextValue = UserState<TUser> & ReturnType<typeof extraContextValue>;

  const UserContext = createContext<ContextValue | undefined>(undefined);

  // ---- Hook ----------------------------------------------------------

  function useUser(): ContextValue {
    const ctx = useContext(UserContext);
    if (!ctx) {
      throw new Error('useUser must be used within a UserProvider');
    }
    return ctx;
  }

  // ---- Provider ------------------------------------------------------

  function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<TUser | undefined>();
    const [isSettled, setIsSettled] = useState(false);

    const { data, loading, error, refetch } = useQuery(document, {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    });

    const updateUser = useCallback(
      (res: { data?: TQuery; errors?: readonly { message: string; extensions?: Record<string, unknown> }[] }) => {
        if (isUnauthenticated(res.errors)) {
          setUser(undefined);
        } else {
          setUser(parseUser(res.data?.currentUser));
        }
        setIsSettled(true);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    useEffect(() => {
      if (!loading) {
        updateUser({ data, errors: error ? [error] : undefined });
      }
    }, [loading, data, error, updateUser]);

    const refetchUser = useCallback(async () => {
      try {
        const res = await refetch();
        updateUser(res);
      } catch {
        setUser(undefined);
      }
    }, [refetch, updateUser]);

    const contextValue = useMemo<ContextValue>(
      () =>
        ({
          user,
          setUser,
          isLoading: loading,
          refetchUser,
          ...extraContextValue(user),
        }) as ContextValue,
      [user, loading, refetchUser],
    );

    return (
      <UserContext.Provider value={contextValue}>
        <ActiveOrgProvider
          organizations={
            (user?.organizations ?? []) as unknown as {
              id: string;
              name: string;
              permissions: string[];
            }[]
          }
        >
          {children}
        </ActiveOrgProvider>
      </UserContext.Provider>
    );
  }

  return { UserProvider, useUser, UserContext } as const;
}
