/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from '@apollo/client/utilities';
import { createHmisAuthLink } from './hmisAuthLink';

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
  authStorage: {
    getHmisAuthToken: jest.fn(() => 'mocked-token'),
    storeHmisApiUrl: jest.fn(),
    storeHmisAuthToken: jest.fn(),
  },
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
