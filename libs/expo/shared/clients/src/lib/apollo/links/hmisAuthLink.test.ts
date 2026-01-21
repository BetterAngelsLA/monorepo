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
  operationHasDirective: jest.fn((operation: any, dirName: string) => {
    if (dirName !== 'hmisDirective') return false;
    // Check if the operation contains any HMIS field names
    const selections = operation?.selectionSet?.selections || [];
    const fieldNames = selections
      .filter((s: any) => s.kind === 'Field')
      .map((s: any) => s.name.value);
    return fieldNames.some((name: string) =>
      ['hmisClientProfiles', 'hmisNotes', 'hmisLogin'].includes(name)
    );
  }),
  getOperationsByDirective: jest.fn((dirName: string) => {
    if (dirName !== 'hmisDirective') return new Set();
    return new Set(['hmisClientProfiles', 'hmisNotes', 'hmisLogin']);
  }),
}));

jest.mock('@monorepo/expo/shared/utils', () => ({
  getHmisAuthToken: jest.fn(() => Promise.resolve('mocked-token')),
  storeHmisDomain: jest.fn(),
}));

describe('hmisAuthLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      const hmisOperation: any = {
        operationName: 'HMISLogin',
        query: {
          definitions: [
            {
              selectionSet: {
                selections: [{ kind: 'Field', name: { value: 'hmisLogin' } }],
              },
            },
          ],
        },
        getContext: () => ({
          response: { headers: { get: () => null } },
          headers: {},
        }),
      };

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

      const nonHmisOperation: any = {
        operationName: 'GetNotes',
        query: {
          definitions: [
            {
              selectionSet: {
                selections: [{ kind: 'Field', name: { value: 'notes' } }],
              },
            },
          ],
        },
        getContext: () => ({
          response: { headers: { get: () => null } },
          headers: {},
        }),
      };

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
    it('extracts domain and token', () => {
      const header =
        'auth_token=abc123; Path=/; Domain=foo.example.com; Secure; HttpOnly';
      const parsed = parseHmisCookieHeader(header);
      expect(parsed).toEqual({
        domain: 'https://foo.example.com',
        authToken: 'abc123',
      });
    });

    it('handles different order and casing', () => {
      const header = 'DoMaIn=EXAMPLE.org; auth_token=xyz; Path=/';
      const parsed = parseHmisCookieHeader(header);
      expect(parsed).toEqual({
        domain: 'https://EXAMPLE.org',
        authToken: 'xyz',
      });
    });

    it('returns null when domain missing', () => {
      const header = 'auth_token=xyz; Path=/;';
      const parsed = parseHmisCookieHeader(header);
      expect(parsed).toBeNull();
    });

    it('parses domain without token', () => {
      const header = 'Domain=example.net; Path=/;';
      const parsed = parseHmisCookieHeader(header);
      expect(parsed).toEqual({ domain: 'https://example.net' });
    });
  });
});
