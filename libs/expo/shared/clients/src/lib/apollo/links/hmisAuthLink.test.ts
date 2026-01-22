/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock native modules before any imports
import { Observable } from '@apollo/client/utilities';
import {
  createCookieExtractorLink,
  createHmisAuthLink,
  parseHmisCookieHeader,
} from './hmisAuthLink';

jest.mock('react-native-nitro-cookies', () => ({
  __esModule: true,
  default: {
    setFromResponse: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock('react-native-mmkv');

// Ensure React Native global exists in Jest environment
(globalThis as any).__DEV__ = false;

// Mock the schema directives utility
jest.mock('../utils/schemaDirectives', () => ({
  operationHasDirective: jest.fn(),
  getOperationsByDirective: jest.fn(),
}));

jest.mock('@monorepo/expo/shared/utils', () => ({
  HMIS_AUTH_COOKIE_NAME: 'auth_token',
  getHmisAuthToken: jest.fn(() => Promise.resolve('mocked-token')),
  storeHmisDomain: jest.fn(),
}));

describe('hmisAuthLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOperationHasDirective = jest.requireMock(
    '../utils/schemaDirectives'
  ).operationHasDirective as jest.Mock;

  const makeOperation = (operationName: string, selectionName: string) => ({
    operationName,
    query: {
      definitions: [
        {
          selectionSet: {
            selections: [{ kind: 'Field', name: { value: selectionName } }],
          },
        },
      ],
    },
    getContext: () => ({
      response: { headers: { get: () => null } },
      headers: {},
    }),
  });

  it('createCookieExtractorLink stores domain and sets cookies from response header', async () => {
    const setCookieHeader = 'auth_token=token123; Domain=example.com; Path=/;';
    const response: any = {
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'set-cookie' ? setCookieHeader : null,
      },
    };

    const operation: any = {
      getContext: () => ({ response }),
    };

    const forward: any = jest.fn(
      () =>
        new Observable((observer) => {
          observer.next({});
          observer.complete();
        })
    );

    const observer: any = {
      next: jest.fn(),
      error: jest.fn(),
      complete: jest.fn(),
    };

    const link = createCookieExtractorLink();
    link.request(operation, forward)?.subscribe(observer);

    await new Promise((resolve) => setImmediate(resolve));
  });

  it('createCookieExtractorLink does nothing when set-cookie header is missing', async () => {
    const response: any = {
      headers: {
        get: (_name: string) => null,
      },
    };

    const operation: any = {
      getContext: () => ({ response }),
    };

    const forward: any = jest.fn(
      () =>
        new Observable((observer) => {
          observer.next({});
          observer.complete();
        })
    );

    const observer: any = {
      next: jest.fn(),
      error: jest.fn(),
      complete: jest.fn(),
    };

    const link = createCookieExtractorLink();
    link.request(operation, forward)?.subscribe(observer);

    await new Promise((resolve) => setImmediate(resolve));
  });

  describe('createHmisAuthLink', () => {
    it('applies auth link to HMIS operations based on schema', async () => {
      const link = createHmisAuthLink();
      mockOperationHasDirective.mockReturnValue(true);

      const hmisOperation: any = makeOperation('HMISLogin', 'hmisLogin');

      const forward: any = jest.fn((_op) => {
        return new Observable((observer) => {
          observer.next({ data: {} });
          observer.complete();
        });
      });

      await new Promise<void>((resolve) => {
        link.request(hmisOperation, forward as any)?.subscribe({
          next: () => {
            // Empty handler for test
          },
          complete: () => resolve(),
        });
      });

      expect(forward).toHaveBeenCalled();
    });

    it('bypasses auth for non-HMIS operations', async () => {
      const link = createHmisAuthLink();
      mockOperationHasDirective.mockReturnValue(false);

      const nonHmisOperation: any = makeOperation('GetNotes', 'notes');

      const forward: any = jest.fn((_op) => {
        return new Observable((observer) => {
          observer.next({ data: {} });
          observer.complete();
        });
      });

      await new Promise<void>((resolve) => {
        link.request(nonHmisOperation, forward as any)?.subscribe({
          complete: () => resolve(),
        });
      });

      expect(forward).toHaveBeenCalled();
    });
  });

  describe('parseHmisCookieHeader', () => {
    const cases = [
      {
        name: 'extracts domain and token',
        header:
          'auth_token=abc123; Path=/; Domain=foo.example.com; Secure; HttpOnly',
        expected: { domain: 'https://foo.example.com', authToken: 'abc123' },
      },
      {
        name: 'handles different order and casing',
        header: 'DoMaIn=EXAMPLE.org; auth_token=xyz; Path=/',
        expected: { domain: 'https://EXAMPLE.org', authToken: 'xyz' },
      },
      {
        name: 'returns null when domain missing',
        header: 'auth_token=xyz; Path=/;',
        expected: null,
      },
      {
        name: 'parses domain without token',
        header: 'Domain=example.net; Path=/;',
        expected: { domain: 'https://example.net' },
      },
      {
        name: 'ignores when header is empty',
        header: '',
        expected: null,
      },
    ];

    it.each(cases)('%s', ({ header, expected }) => {
      expect(parseHmisCookieHeader(header)).toEqual(expected);
    });
  });
});

describe('createCookieExtractorLink - Domain Storage Fix', () => {
  const mockStoreHmisDomain = jest.requireMock('@monorepo/expo/shared/utils')
    .storeHmisDomain as jest.Mock;

  it('REGRESSION TEST: only stores domain when auth token is present', async () => {
    const setCookieHeaderWithToken =
      'auth_token=valid123; Domain=hmis.example.com; Path=/;';
    const response: any = {
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'set-cookie' ? setCookieHeaderWithToken : null,
      },
    };

    const operation: any = {
      operationName: 'HMISLogin',
      getContext: () => ({ response }),
    };

    const forward: any = jest.fn(
      () =>
        new Observable((observer) => {
          observer.next({});
          observer.complete();
        })
    );

    const observer: any = {
      next: jest.fn(),
      error: jest.fn(),
      complete: jest.fn(),
    };

    const link = createCookieExtractorLink();
    link.request(operation, forward)?.subscribe(observer);

    await new Promise((resolve) => setImmediate(resolve));

    // When auth token is present, domain SHOULD be stored
    expect(mockStoreHmisDomain).toHaveBeenCalledWith(
      'https://hmis.example.com'
    );
  });

  it('REGRESSION TEST: does NOT store domain when auth token is missing', async () => {
    // This test prevents regression of the bug where CSRF cookies from the app server
    // would overwrite the HMIS domain, causing subsequent HMIS operations to fail
    const setCookieHeaderWithoutToken =
      'csrftoken=xyz789; Domain=.dev.example.com; Path=/; expires=Thu, 21 Jan 2027';
    const response: any = {
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'set-cookie'
            ? setCookieHeaderWithoutToken
            : null,
      },
    };

    const operation: any = {
      operationName: 'hmisClientProfile',
      getContext: () => ({ response }),
    };

    const forward: any = jest.fn(
      () =>
        new Observable((observer) => {
          observer.next({});
          observer.complete();
        })
    );

    const observer: any = {
      next: jest.fn(),
      error: jest.fn(),
      complete: jest.fn(),
    };

    mockStoreHmisDomain.mockClear();

    const link = createCookieExtractorLink();
    link.request(operation, forward)?.subscribe(observer);

    await new Promise((resolve) => setImmediate(resolve));

    // When auth token is NOT present, domain should NOT be stored
    expect(mockStoreHmisDomain).not.toHaveBeenCalled();
  });
});
