/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from '@apollo/client/utilities';
import { createCookieExtractorLink, createHmisAuthLink } from './hmisAuthLink';

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
  HMIS_API_URL_COOKIE_NAME: 'api_url',
  getHmisAuthToken: jest.fn(() => Promise.resolve('mocked-token')),
  storeHmisApiUrl: jest.fn(),
  storeHmisAuthToken: jest.fn(() => Promise.resolve()),
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

  it('createCookieExtractorLink stores auth token and api_url from response headers', async () => {
    const mockStoreHmisApiUrl = jest.requireMock('@monorepo/expo/shared/utils')
      .storeHmisApiUrl as jest.Mock;
    const mockStoreHmisAuthToken = jest.requireMock(
      '@monorepo/expo/shared/utils'
    ).storeHmisAuthToken as jest.Mock;

    const setCookies = [
      'auth_token=token123; Domain=example.com; Path=/; HttpOnly; Secure',
      'api_url=https%3A%2F%2Fapi.example.com; Domain=example.com; Path=/',
    ];

    const response: any = {
      headers: {
        getSetCookie: () => setCookies,
        get: (name: string) =>
          name.toLowerCase() === 'set-cookie' ? setCookies[0] : null,
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

    expect(mockStoreHmisAuthToken).toHaveBeenCalledWith('token123');
    expect(mockStoreHmisApiUrl).toHaveBeenCalledWith('https://api.example.com');
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
});
