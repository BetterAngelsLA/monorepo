import { ApolloLink, Observable } from '@apollo/client';

// ---------------------------------------------------------------------------
// Token provider
// ---------------------------------------------------------------------------

/** Platform-specific CSRF token reading. Handles refresh internally. */
export interface CsrfTokenProvider {
  getToken(cookieName: string, apiUrl?: string): string | null | Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Options for :func:`createCsrfLink`. */
export interface CsrfLinkOptions {
  cookieName: string;
  headerName: string;
}

/**
 * Create an Apollo Link that injects a CSRF header into every outgoing
 * request. The token is obtained from the given ``tokenProvider`` which
 * handles platform-specific cookie reading and server refresh.
 *
 * Pattern matched from :func:`createOrgLink` — the factory is
 * platform-agnostic; convenience instances are platform-specific.
 */
export function createCsrfLink(
  tokenProvider: CsrfTokenProvider,
  options: CsrfLinkOptions
): ApolloLink {
  const { cookieName, headerName } = options;

  return new ApolloLink(
    (operation, forward) =>
      new Observable((observer) => {
        const processOperation = async () => {
          try {
            const token = await tokenProvider.getToken(cookieName);

            operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
              headers: {
                ...headers,
                ...(token ? { [headerName]: token } : {}),
              },
            }));

            const subscription = forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });

            return () => subscription.unsubscribe();
          } catch (err) {
            console.error('Error in CSRF Apollo Link:', err);
            observer.error(err);
            return undefined;
          }
        };

        processOperation();
      })
  );
}
