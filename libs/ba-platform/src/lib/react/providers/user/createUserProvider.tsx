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
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import type { StorageAdapter } from '@monorepo/react/shared';

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
 * @typeParam TUser   App-specific user type (the value stored in context).
 * @typeParam TQuery  The GraphQL operation result type
 *   (e.g. ``CurrentOrgUserQuery``).
 */
export interface UserProviderConfig<
  TUser,
  TQuery,
> {
  /** GraphQL document that fetches the current user. */
  document: TypedDocumentNode<TQuery, Record<string, never>>;

  /**
   * Map the raw GraphQL ``currentUser`` (or ``undefined``) to the
   * app-specific user object.
   */
  parseUser: (data: unknown) => TUser | undefined;

  /**
   * Return ``true`` when the errors indicate the session is expired or
   * the user is not authenticated.
   */
  isUnauthenticated: (
    errors:
      | readonly { message: string; extensions?: Record<string, unknown> }[]
      | undefined,
  ) => boolean;

  /**
   * Default storage adapter for the embedded :component:`ActiveOrgProvider`.
   *
   * If provided, consumers do not need to pass ``storage`` as a prop -
   * the provider uses this default. Individual apps can still override
   * via the ``storage`` prop when needed.
   */
  defaultStorage?: StorageAdapter;

  /**
   * Optional custom mapping from user organizations to the
   * :type:`Org` shape expected by :component:`ActiveOrgProvider`.
   *
   * Defaults to spreading ``permissions`` into a new array.
   */
  mapOrganizations?: (
    orgs: readonly OrgLike[],
  ) => { id: string; name: string; permissions: readonly PermissionEnum[] }[];
}

type OrgLike = { id: string; name: string; permissions?: readonly string[] };

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
export function createUserProvider<
  TUser extends {
    organizations?:
      | readonly { id: string; name: string; permissions?: readonly string[] }[]
      | null;
  },
  TQuery extends { currentUser?: unknown },
>(config: UserProviderConfig<TUser, TQuery>) {
  const {
    document,
    parseUser,
    isUnauthenticated,
    defaultStorage,
    mapOrganizations: customMapOrganizations,
  } = config;

  // ---- Helpers -------------------------------------------------------

  const defaultMapOrganizations = (
    orgs: readonly OrgLike[],
  ) =>
    orgs.map((org) => ({
      id: org.id,
      name: org.name,
      permissions: [...(org.permissions ?? [])] as PermissionEnum[],
    }));

  const mapOrganizations = customMapOrganizations ?? defaultMapOrganizations;

  // ---- Context -------------------------------------------------------

  type ContextValue = UserState<TUser>;

  const UserContext = createContext<ContextValue | undefined>(undefined);

  // ---- Hook ----------------------------------------------------------

  function useUser(): ContextValue {
    const ctx = useContext(UserContext);
    if (!ctx) {
      throw new Error('useUser must be used within a UserProvider');
    }
    return ctx;
  }

  function UserProvider({
    children,
    storage,
  }: {
    children: ReactNode;
    /** Storage adapter — defaults to :attr:`defaultStorage` from config. */
    storage?: StorageAdapter;
  }) {
    const resolvedStorage = storage ?? defaultStorage;
    if (!resolvedStorage) {
      throw new Error(
        'UserProvider requires a storage adapter. Pass it as a prop or set defaultStorage in createUserProvider config.',
      );
    }
    const [user, setUser] = useState<TUser | undefined>();

    const { data, loading, error, refetch } = useQuery(document, {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    });

    const updateUser = useCallback(
      (res: {
        data?: TQuery;
        errors?: readonly {
          message: string;
          extensions?: Record<string, unknown>;
        }[];
      }) => {
        if (isUnauthenticated(res.errors)) {
          setUser(undefined);
        } else {
          setUser(parseUser(res.data?.currentUser));
        }
      },
      // parseUser and isUnauthenticated are factory-level params — they're
      // stable references captured once at module init, so omitting them from
      // the dep array is intentional and safe.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    useEffect(() => {
      if (!loading) {
        // error is typed as ErrorLike but is an ApolloError at runtime
        // with graphQLErrors — narrow via runtime check.
        const gqlErrors =
          error && 'graphQLErrors' in error
            ? (error.graphQLErrors as readonly { message: string; extensions?: Record<string, unknown> }[])
            : undefined;
        updateUser({ data, errors: gqlErrors?.length ? gqlErrors : undefined });
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
      () => ({
        user,
        setUser,
        isLoading: loading,
        refetchUser,
      }),
      [user, loading, refetchUser],
    );

    return (
      <UserContext.Provider value={contextValue}>
        <ActiveOrgProvider
          storage={resolvedStorage}
          organizations={user?.organizations ? mapOrganizations(user.organizations) : []}
        >
          {children}
        </ActiveOrgProvider>
      </UserContext.Provider>
    );
  }

  UserProvider.displayName = 'UserProvider';

  return { UserProvider, useUser, UserContext } as const;
}
