import { BaPermissionError } from '../../../errors/BaPermissionError';
import { DEFAULT_GENERIC_ERROR_MESSAGE } from '../constants';
import { throwOnMutationFail } from './throwOnMutationFail';
import type { GraphQLResponse } from './types';

function responseWithOpInfo(
  ...messages: Array<{
    kind: string;
    field?: string | null;
    message?: string;
  }>
) {
  return {
    data: {
      defaultOperationName: {
        __typename: 'OperationInfo',
        messages: messages.map((m) => ({
          __typename: 'OperationMessage',
          kind: m.kind,
          field: m.field ?? null,
          message: m.message ?? '',
        })),
      },
    },
  };
}

function responseWithErrors(
  ...errors: Array<{ message?: string; extensions?: Record<string, unknown> }>
) {
  return { data: null, errors: errors };
}

function successResponse(typename = 'defaultTestType') {
  return {
    data: { defaultOperationName: { __typename: typename } },
  };
}

const defaultParams = {
  operationKey: 'defaultOperationName',
  successTypename: 'defaultTestType',
};

type TestCase = {
  name: string;
  response: GraphQLResponse;
  params?: Record<string, unknown>;
  throws?: { type: new (msg: string) => Error; message?: string };
};

function runScenarios(cases: TestCase[]) {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (_, tc) => {
    const mergedParams = { ...defaultParams, ...tc.params };

    if (tc.throws) {
      expect(() =>
        throwOnMutationFail({
          response: tc.response,
          ...mergedParams,
        }),
      ).toThrow(tc.throws.type);

      try {
        throwOnMutationFail({
          response: tc.response,
          ...mergedParams,
        });
      } catch (e) {
        if (tc.throws.message) {
          expect((e as Error).message).toContain(tc.throws.message);
        }
      }
    } else {
      expect(() =>
        throwOnMutationFail({
          response: tc.response,
          ...mergedParams,
        }),
      ).not.toThrow();
    }
  });
}

describe('throwOnMutationFail', () => {
  describe('does not throw', () => {
    describe('success', () => {
      const testCases: TestCase[] = [
        {
          name: 'when __typename matches successTypename',
          response: successResponse('HelloSuccessType'),
          params: { successTypename: 'HelloSuccessType' },
        },
      ];

      runScenarios(testCases);
    });
  });

  describe('throws BaPermissionError', () => {
    describe('with response errors', () => {
      describe('UNAUTHENTICATED', () => {
        const testCases: TestCase[] = [
          {
            name: 'with message: throws BaPermissionError with server message',
            response: responseWithErrors({
              message: 'server msg',
              extensions: { code: 'UNAUTHENTICATED' },
            }),
            throws: { type: BaPermissionError, message: 'server msg' },
          },
          {
            name: 'missing message: throws default BaPermissionError',
            response: responseWithErrors({
              extensions: { code: 'UNAUTHENTICATED' },
            }),
            throws: {
              type: BaPermissionError,
              message: 'You are not authorized to perform this operation',
            },
          },
        ];

        runScenarios(testCases);
      });
    });

    describe('with OperationInfo', () => {
      describe('PERMISSION kind', () => {
        const testCases: TestCase[] = [
          {
            name: 'with message: throws BaPermissionError with server message',
            response: responseWithOpInfo({
              kind: 'PERMISSION',
              message: 'server msg',
            }),
            throws: { type: BaPermissionError, message: 'server msg' },
          },
          {
            name: 'missing message: throws BaPermissionError with default msg',
            response: responseWithOpInfo({ kind: 'PERMISSION' }),
            throws: {
              type: BaPermissionError,
              message: 'You are not authorized to perform this operation',
            },
          },
          {
            name: 'field without message: throws BaPermissionError with default msg',
            response: responseWithOpInfo({ kind: 'PERMISSION', field: 'id' }),
            throws: {
              type: BaPermissionError,
              message: 'You are not authorized to perform this operation',
            },
          },
        ];

        runScenarios(testCases);
      });
    });
  });

  describe('throws Error', () => {
    describe('with response errors', () => {
      describe('with server message', () => {
        const testCases: TestCase[] = [
          {
            name: 'throws Error with server message',
            response: responseWithErrors({ message: 'Invalid upload token' }),
            throws: { type: Error, message: 'Invalid upload token' },
          },
        ];

        runScenarios(testCases);
      });

      describe('NOT_FOUND', () => {
        const testCases: TestCase[] = [
          {
            name: 'throws Error with the message',
            response: responseWithErrors({
              message: 'Not Found.',
              extensions: { code: 'NOT_FOUND' },
            }),
            throws: { type: Error, message: 'Not Found.' },
          },
        ];

        runScenarios(testCases);
      });

      describe('empty', () => {
        const testCases: TestCase[] = [
          {
            name: 'throws Error with fallback',
            response: responseWithErrors({}),
            throws: { type: Error, message: DEFAULT_GENERIC_ERROR_MESSAGE },
          },
        ];

        runScenarios(testCases);
      });

      describe('with multiple messages', () => {
        const testCases: TestCase[] = [
          {
            name: 'joins server error messages',
            response: responseWithErrors(
              { message: 'server error 1' },
              { message: 'server error 2' },
            ),
            throws: { type: Error, message: 'server error 1; server error 2' },
          },
        ];

        runScenarios(testCases);
      });
    });

    describe('with OperationInfo', () => {
      describe('non-PERMISSION kind', () => {
        const testCases: TestCase[] = [
          {
            name: 'VALIDATION kind: throws Error with message',
            response: responseWithOpInfo({
              kind: 'VALIDATION',
              message: 'Something failed',
            }),
            throws: { type: Error, message: 'Something failed' },
          },
          {
            name: 'ERROR kind: throws Error with message',
            response: responseWithOpInfo({
              kind: 'ERROR',
              message: 'Something failed',
            }),
            throws: { type: Error, message: 'Something failed' },
          },
          {
            name: 'multiple messages: joins all messages',
            response: responseWithOpInfo(
              { kind: 'ERROR', message: 'first' },
              { kind: 'VALIDATION', message: 'second' },
            ),
            throws: { type: Error, message: 'first; second' },
          },
          {
            name: 'empty messages: throws Error with fallback',
            response: responseWithOpInfo({ kind: 'ERROR' }),
            throws: { type: Error, message: DEFAULT_GENERIC_ERROR_MESSAGE },
          },
        ];

        runScenarios(testCases);
      });
    });

    describe('unclassifiable response', () => {
      const testCases: TestCase[] = [
        {
          name: 'data present but typename is neither success nor OperationInfo',
          response: {
            data: { defaultOperationName: { __typename: 'SomethingElse' } },
          },
          throws: { type: Error, message: DEFAULT_GENERIC_ERROR_MESSAGE },
        },
        {
          name: 'no data and no errors',
          response: {},
          throws: { type: Error, message: DEFAULT_GENERIC_ERROR_MESSAGE },
        },
      ];

      runScenarios(testCases);
    });
  });
});
