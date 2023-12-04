import {
  ApolloLink,
  Observable as ApolloObservable,
  FetchResult,
  Operation,
  execute,
  gql,
} from '@apollo/client';
import { Observable as RxObservable, lastValueFrom } from 'rxjs';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../constants';
import { getItem, setItem } from '../../storage';
import { csrfLink } from './csrf';

const TEST_CSRF_TOKEN_VALUE = 'test-token';
const TEST_QUERY = gql`
  query TestQuery {
    test
  }
`;

const createMockOperation = (
  cookieHeader: string | null,
  requestHeaders: Record<string, string> = {}
) =>
  ({
    query: TEST_QUERY,
    variables: {},
    operationName: 'TestQuery',
    extensions: {},
    getContext: () => ({
      response: {
        headers: new Headers(
          cookieHeader ? { 'Set-Cookie': cookieHeader } : {}
        ),
      },
      headers: new Headers(requestHeaders),
    }),
    setContext: jest.fn(),
  } as Operation);

function executeRequest(link: ApolloLink) {
  execute(link, { query: TEST_QUERY }).subscribe(() => {
    /* not our concern within this test */
  });
}

const mockForward = () =>
  new ApolloObservable<FetchResult>((observer) => {
    observer.next({ data: {}, errors: [], extensions: {}, context: {} });
    observer.complete();
  });

jest.mock('../../storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe('csrfLink', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should extract and store CSRF token from Set-Cookie header', async () => {
    const operation = createMockOperation(
      `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN_VALUE};`
    );
    const assertLink = new ApolloLink(() => {
      const result = csrfLink.request(operation, mockForward);
      expect(result).toBeDefined();
      // The below type is kind of gross... is there a better way?
      lastValueFrom(result as unknown as RxObservable<FetchResult>).then(() => {
        expect(setItem).toHaveBeenCalledWith(
          CSRF_COOKIE_NAME,
          TEST_CSRF_TOKEN_VALUE
        );
      });
      return null;
    });
    const link = ApolloLink.from([assertLink]);
    executeRequest(link);
  });

  it('should not store CSRF token if Set-Cookie header is absent', async () => {
    const operation = createMockOperation(null);
    const assertLink = new ApolloLink(() => {
      const result = csrfLink.request(operation, mockForward);
      expect(result).toBeDefined();
      // The below type is kind of gross... is there a better way?
      lastValueFrom(result as unknown as RxObservable<FetchResult>).then(() => {
        expect(setItem).not.toHaveBeenCalled();
      });
      return null;
    });
    const link = ApolloLink.from([assertLink]);
    executeRequest(link);
  });

  it('should add CSRF token to request headers if available', async () => {
    const testToken = 'test-token';
    (getItem as jest.Mock).mockResolvedValue(testToken);
    const assertLink = new ApolloLink((operation) => {
      const headers = operation.getContext()['headers'];
      expect(headers[CSRF_HEADER_NAME]).toEqual(testToken);
      return null;
    });
    const link = ApolloLink.from([csrfLink, assertLink]);
    executeRequest(link);
  });

  it('should not add CSRF token to request headers if not available', async () => {
    const assertLink = new ApolloLink((operation) => {
      const headers = operation.getContext()['headers'];
      expect(headers).toBeUndefined();
      return null;
    });
    const link = ApolloLink.from([csrfLink, assertLink]);
    executeRequest(link);
  });
});
