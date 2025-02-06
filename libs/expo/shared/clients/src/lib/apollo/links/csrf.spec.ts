import {
  ApolloLink,
  Observable as ApolloObservable,
  FetchResult,
  execute,
  gql,
} from '@apollo/client';
import { getItem, setItem } from '@monorepo/expo/shared/utils';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './constants';
import { csrfLink } from './csrf';
import { csrfManager } from './csrf-manager';

jest.mock('@monorepo/expo/shared/utils', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

const TEST_CSRF_TOKEN_VALUE = 'test-token';
const TEST_QUERY = gql`
  query TestQuery {
    test
  }
`;

// Based on our manager's key-generation logic for "https://api.example.com"
const expectedKey = `${CSRF_COOKIE_NAME}_https___api_example_com`;

// A terminal forward link that passes along the operation context.
const mockForward = new ApolloLink(
  (operation) =>
    new ApolloObservable<FetchResult>((observer) => {
      observer.next({
        data: {},
        errors: [],
        extensions: {},
        context: operation.getContext(),
      });
      observer.complete();
    })
);

// Helper to await the resolution of an observable.
const apolloObservableToPromise = (
  observable: ApolloObservable<FetchResult>
): Promise<FetchResult> =>
  new Promise((resolve, reject) => {
    observable.subscribe({
      next: resolve,
      error: reject,
    });
  });

describe('csrfLink', () => {
  const apiUrl = 'https://api.example.com';

  beforeEach(async () => {
    jest.resetAllMocks();
    await csrfManager.clearToken(apiUrl);
    jest.clearAllMocks();
  });

  it('should fetch and store CSRF token from login endpoint', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({
        'Set-Cookie': `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN_VALUE};`,
      }),
    });
    const testLink = csrfLink(apiUrl, mockFetch);
    const composedLink = ApolloLink.from([testLink, mockForward]);
    const result = execute(composedLink, { query: TEST_QUERY });
    await apolloObservableToPromise(result);
    expect(setItem).toHaveBeenCalledWith(expectedKey, TEST_CSRF_TOKEN_VALUE);
  });

  it('should extract and store CSRF token from GraphQL Response Set-Cookie header', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });
    const testLink = csrfLink(apiUrl, mockFetch);
    const op = {
      query: TEST_QUERY,
      context: {
        response: {
          headers: new Headers({
            'Set-Cookie': `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN_VALUE};`,
          }),
        },
      },
    };
    const composedLink = ApolloLink.from([testLink, mockForward]);
    const result = execute(composedLink, op);
    await apolloObservableToPromise(result);
    expect(setItem).toHaveBeenCalledWith(expectedKey, TEST_CSRF_TOKEN_VALUE);
  });

  it('should extract and store CSRF token from Rest Response Set-Cookie header', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });
    const testLink = csrfLink(apiUrl, mockFetch);
    const op = {
      query: TEST_QUERY,
      context: {
        restResponses: [
          {
            headers: new Headers({
              'Set-Cookie': `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN_VALUE};`,
            }),
          },
        ],
      },
    };
    const composedLink = ApolloLink.from([testLink, mockForward]);
    const result = execute(composedLink, op);
    await apolloObservableToPromise(result);
    expect(setItem).toHaveBeenCalledWith(expectedKey, TEST_CSRF_TOKEN_VALUE);
  });

  it('should not store CSRF token if Set-Cookie header is absent', async () => {
    (getItem as jest.Mock).mockResolvedValue(undefined);
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({}),
    });
    const testLink = csrfLink(apiUrl, mockFetch);
    const composedLink = ApolloLink.from([testLink, mockForward]);
    const result = execute(composedLink, { query: TEST_QUERY });
    await apolloObservableToPromise(result);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('should add CSRF token to request headers if available', async () => {
    (getItem as jest.Mock).mockResolvedValue(TEST_CSRF_TOKEN_VALUE);
    const testLink = csrfLink(apiUrl);
    let capturedHeaders: Record<string, string> | undefined;
    const captureLink = new ApolloLink((operation, forward) => {
      capturedHeaders = operation.getContext()['headers'] as Record<
        string,
        string
      >;
      return forward(operation);
    });
    const composedLink = ApolloLink.from([testLink, captureLink, mockForward]);
    const result = execute(composedLink, { query: TEST_QUERY });
    await apolloObservableToPromise(result);
    expect(capturedHeaders?.[CSRF_HEADER_NAME]).toEqual(TEST_CSRF_TOKEN_VALUE);
  });

  it('should not add CSRF token to request headers if not available', async () => {
    (getItem as jest.Mock).mockResolvedValue(undefined);
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({}),
    });
    const testLink = csrfLink(apiUrl, mockFetch);
    let capturedHeaders: Record<string, string> | undefined;
    const captureLink = new ApolloLink((operation, forward) => {
      capturedHeaders = operation.getContext()['headers'] as Record<
        string,
        string
      >;
      return forward(operation);
    });
    const composedLink = ApolloLink.from([testLink, captureLink, mockForward]);
    const result = execute(composedLink, { query: TEST_QUERY });
    await apolloObservableToPromise(result);
    expect(capturedHeaders?.[CSRF_HEADER_NAME]).toBeUndefined();
  });
});
