import {
  ApolloLink,
  Observable as ApolloObservable,
  FetchResult,
  execute,
  gql,
} from '@apollo/client';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../constants';
import { getItem, setItem } from '../../storage';
import { csrfLink } from './csrf';

jest.mock('../../storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

const TEST_CSRF_TOKEN_VALUE = 'test-token';
const TEST_QUERY = gql`
  query TestQuery {
    test
  }
`;

const mockForward = () =>
  new ApolloObservable<FetchResult>((observer) => {
    observer.next({ data: {}, errors: [], extensions: {}, context: {} });
    observer.complete();
  });

const apolloObservableToPromise = (
  observable: ApolloObservable<FetchResult>
) => {
  return new Promise<FetchResult>((resolve, reject) => {
    observable.subscribe(
      (value) => resolve(value),
      (error) => reject(error)
    );
  });
};

describe('csrfLink', () => {
  const apiUrl = 'https://api.example.com';

  beforeEach(() => {
    jest.resetAllMocks();
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
    const assertLink = new ApolloLink((operation) => {
      const result = testLink.request(operation, mockForward);
      expect(result).not.toBeNull();
      if (result) {
        apolloObservableToPromise(result).then(() => {
          expect(setItem).toHaveBeenCalledWith(
            CSRF_COOKIE_NAME,
            TEST_CSRF_TOKEN_VALUE
          );
        });
      }
      return null;
    });
    execute(assertLink, {
      query: TEST_QUERY,
    });
  });

  it('should not store CSRF token if Set-Cookie header is absent', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });
    const testLink = csrfLink(apiUrl, mockFetch);
    const assertLink = new ApolloLink((operation) => {
      const result = testLink.request(operation, mockForward);
      expect(result).not.toBeNull();
      if (result) {
        apolloObservableToPromise(result).then(() => {
          expect(setItem).not.toHaveBeenCalled();
        });
      }
      return null;
    });
    execute(assertLink, {
      query: TEST_QUERY,
    });
  });

  it('should add CSRF token to request headers if available', async () => {
    (getItem as jest.Mock).mockResolvedValue(TEST_CSRF_TOKEN_VALUE);
    const testLink = csrfLink(apiUrl);
    const assertLink = new ApolloLink((operation) => {
      const result = testLink.request(operation, mockForward);
      expect(result).not.toBeNull();
      if (result) {
        apolloObservableToPromise(result).then(() => {
          const headers = operation.getContext()['headers'];
          expect(headers[CSRF_HEADER_NAME]).toEqual(TEST_CSRF_TOKEN_VALUE);
        });
      }
      return null;
    });
    execute(assertLink, {
      query: TEST_QUERY,
    });
  });

  it('should not add CSRF token to request headers if not available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({}),
    });

    const testLink = csrfLink(apiUrl, mockFetch);
    const assertLink = new ApolloLink((operation) => {
      const result = testLink.request(operation, mockForward);
      expect(result).not.toBeNull();
      if (result) {
        apolloObservableToPromise(result).then(() => {
          const headers = operation.getContext()['headers'];
          expect(headers[CSRF_HEADER_NAME]).toBeUndefined();
        });
      }
      return null;
    });
    execute(assertLink, {
      query: TEST_QUERY,
    });
  });
});
