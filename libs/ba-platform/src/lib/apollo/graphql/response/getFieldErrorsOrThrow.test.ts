import { BaPermissionError } from '../../../errors/BaPermissionError';
import { DEFAULT_GQL_ERROR_MESSAGE } from '../constants';
import { getFieldErrorsOrThrow } from './getFieldErrorsOrThrow';
import type { FieldError, GraphQLResponse } from './types';

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

function resonseWithErors(
  ...errors: Array<{ message?: string; extensions?: Record<string, unknown> }>
) {
  return { data: null, errors: errors };
}

const defaultParams = {
  operationKey: 'defaultOperationName',
  successTypename: 'defaultTestType',
  fields: ['defaultField'],
};

type TestCase = {
  name: string;
  response: GraphQLResponse;
  params?: Record<string, unknown>;
  throws?: { type: new (msg: string) => Error; message?: string };
  returns?: FieldError[];
};

function runScenarios(cases: TestCase[]) {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (_, tc) => {
    const mergedParams = { ...defaultParams, ...tc.params };

    if (tc.throws) {
      expect(() =>
        getFieldErrorsOrThrow({
          response: tc.response,
          ...mergedParams,
        })
      ).toThrow(tc.throws.type);

      try {
        getFieldErrorsOrThrow({
          response: tc.response,
          ...mergedParams,
        });
      } catch (e) {
        if (tc.throws.message) {
          expect((e as Error).message).toContain(tc.throws.message);
        }
      }
    } else {
      expect(
        getFieldErrorsOrThrow({
          response: tc.response,
          ...mergedParams,
        })
      ).toEqual(tc.returns ?? []);
    }
  });
}

describe('getFieldErrorsOrThrow', () => {
  describe('returns []', () => {
    describe('success', () => {
      const testCases: TestCase[] = [
        {
          name: 'when __typename matches successTypename',
          response: {
            data: { defaultOperationName: { __typename: 'HelloSuccessType' } },
          },
          params: { fields: ['name'], successTypename: 'HelloSuccessType' },
        },
      ];

      runScenarios(testCases);
    });
  });

  describe('returns FieldError[]', () => {
    describe('with extensions.errors', () => {
      describe('all errors match fields filter', () => {
        const testCases: TestCase[] = [
          {
            name: 'recognized errorCode: returns mapped message',
            response: resonseWithErors({
              extensions: {
                errors: [{ field: 'email', errorCode: 'EMAIL_INVALID' }],
              },
            }),
            params: { fields: ['email', 'other'] },
            returns: [
              { field: 'email', message: 'Enter a valid email address' },
            ],
          },
          {
            name: 'unrecognized errorCode: falls back to server message',
            response: resonseWithErors({
              extensions: {
                errors: [
                  {
                    field: 'anyField',
                    errorCode: 'UNRECOGNIZED_CODE',
                    message: 'server msg',
                  },
                ],
              },
            }),
            params: { fields: ['anyField'] },
            returns: [{ field: 'anyField', message: 'server msg' }],
          },
          {
            name: 'no errorCode or message: returns "Invalid value"',
            response: resonseWithErors({
              extensions: { errors: [{ field: 'anyField' }] },
            }),
            params: { fields: ['anyField'] },
            returns: [{ field: 'anyField', message: 'Invalid value' }],
          },
          {
            name: 'multiple errors: returns all mapped messages',
            response: resonseWithErors({
              extensions: {
                errors: [
                  { field: 'email', errorCode: 'EMAIL_INVALID' },
                  {
                    field: 'name',
                    errorCode: 'UNRECOGNIZED_CODE',
                    message: 'server msg',
                  },
                ],
              },
            }),
            params: { fields: ['email', 'name'] },
            returns: [
              { field: 'email', message: 'Enter a valid email address' },
              { field: 'name', message: 'server msg' },
            ],
          },
        ];

        runScenarios(testCases);
      });
    });

    describe('with OperationInfo', () => {
      describe('VALIDATION kind: all messages match fields filter', () => {
        const testCases: TestCase[] = [
          {
            name: 'single message: returns message',
            response: responseWithOpInfo({
              kind: 'VALIDATION',
              field: 'name',
              message: 'Required',
            }),
            params: { fields: ['name', 'other'] },
            returns: [{ field: 'name', message: 'Required' }],
          },
          {
            name: 'multiple messages: returns matching messages',
            response: responseWithOpInfo(
              { kind: 'VALIDATION', field: 'name', message: 'Required' },
              { kind: 'VALIDATION', field: 'email', message: 'Invalid' }
            ),
            params: { fields: ['name', 'email', 'other'] },
            returns: [
              { field: 'name', message: 'Required' },
              { field: 'email', message: 'Invalid' },
            ],
          },
        ];

        runScenarios(testCases);
      });
    });
  });

  describe('throws BaError', () => {
    describe('BaPermissionError', () => {
      describe('with response errors', () => {
        describe('UNAUTHENTICATED', () => {
          const testCases: TestCase[] = [
            {
              name: 'with message: throws BaPermissionError with server message',
              response: resonseWithErors({
                message: 'server msg',
                extensions: { code: 'UNAUTHENTICATED' },
              }),
              params: { fields: ['name'] },
              throws: { type: BaPermissionError, message: 'server msg' },
            },
            {
              name: 'missing message: throws default BaPermissionError',
              response: resonseWithErors({
                extensions: { code: 'UNAUTHENTICATED' },
              }),
              params: { fields: ['name'] },
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
              params: { fields: ['name'] },
              throws: {
                type: BaPermissionError,
                message: 'server msg',
              },
            },
            {
              name: 'with field: throws BaPermissionError with contextual message',
              response: responseWithOpInfo({
                kind: 'PERMISSION',
                field: 'name',
              }),
              params: { fields: ['name'] },
              throws: {
                type: BaPermissionError,
                message: 'You do not have permission to edit the "name" field',
              },
            },
            {
              name: 'missing message: throws BaPermissionError with default msg',
              response: responseWithOpInfo({ kind: 'PERMISSION' }),
              params: { fields: ['name'] },
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
  });

  describe('throws Error', () => {
    describe('with extensions.errors', () => {
      describe('with field', () => {
        const testCases: TestCase[] = [
          {
            name: 'non-field error present: throws Error',
            response: resonseWithErors({
              extensions: {
                errors: [
                  { field: 'email', errorCode: 'EMAIL_INVALID' },
                  { errorCode: 'SOME_CODE', message: 'General error' },
                ],
              },
            }),
            params: { fields: ['email'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
          {
            name: 'no fields matching filter: throws Error',
            response: resonseWithErors({
              extensions: {
                errors: [{ field: 'email', errorCode: 'EMAIL_INVALID' }],
              },
            }),
            params: { fields: ['unmatchedField'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
        ];

        runScenarios(testCases);
      });

      describe('without field', () => {
        const testCases: TestCase[] = [
          {
            name: 'throws Error with fallback message',
            response: resonseWithErors({
              extensions: {
                errors: [{ errorCode: 'EMAIL_INVALID' }],
              },
            }),
            params: { fields: ['name'] },
            throws: { type: Error, message: 'An unexpected error occurred.' },
          },
        ];

        runScenarios(testCases);
      });
    });

    describe('with response errors', () => {
      describe('NOT_FOUND', () => {
        const testCases: TestCase[] = [
          {
            name: 'throws Error with the message',
            response: resonseWithErors({
              message: 'Not Found.',
              extensions: { code: 'NOT_FOUND' },
            }),
            params: { fields: ['name'] },
            throws: { type: Error, message: 'Not Found.' },
          },
        ];

        runScenarios(testCases);
      });

      describe('with server message', () => {
        const testCases: TestCase[] = [
          {
            name: 'throws Error with server message',
            response: resonseWithErors({ message: 'Invalid upload token' }),
            params: { fields: ['name'] },
            throws: { type: Error, message: 'Invalid upload token' },
          },
        ];

        runScenarios(testCases);
      });

      describe('empty', () => {
        const testCases: TestCase[] = [
          {
            name: 'throws Error with fallback',
            response: resonseWithErors({}),
            params: { fields: ['name'] },
            throws: { type: Error, message: DEFAULT_GQL_ERROR_MESSAGE },
          },
        ];

        runScenarios(testCases);
      });

      describe('with multiple messages', () => {
        const testCases: TestCase[] = [
          {
            name: 'joins server error messages',
            response: resonseWithErors(
              { message: 'server error 1' },
              { message: 'server error 2' }
            ),
            params: { fields: ['name'] },
            throws: { type: Error, message: 'server error 1; server error 2' },
          },
        ];

        runScenarios(testCases);
      });
    });

    describe('with OperationInfo', () => {
      describe('VALIDATION kind', () => {
        const testCases: TestCase[] = [
          {
            name: 'non-VALIDATION message present: throws Error',
            response: responseWithOpInfo(
              { kind: 'ERROR', message: 'Something failed' },
              { kind: 'VALIDATION', field: 'name', message: 'Required' }
            ),
            params: { fields: ['name'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
          {
            name: 'no fields matching filter: throws Error',
            response: responseWithOpInfo(
              {
                kind: 'VALIDATION',
                field: 'email',
                message: 'Invalid format',
              },
              { kind: 'VALIDATION', field: 'phone', message: 'Required' }
            ),
            params: { fields: ['unmatchedField'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
          {
            name: 'without field: throws Error',
            response: responseWithOpInfo({
              kind: 'VALIDATION',
              message: 'Form invalid',
            }),
            params: { fields: ['name'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
        ];

        runScenarios(testCases);
      });

      describe('ERROR kind', () => {
        const testCases: TestCase[] = [
          {
            name: 'with field: throws Error',
            response: responseWithOpInfo({
              kind: 'ERROR',
              field: 'name',
              message: 'Name lookup failed',
            }),
            params: { fields: ['name'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
          {
            name: 'without field: throws Error',
            response: responseWithOpInfo({
              kind: 'ERROR',
              message: 'Shelter not found',
            }),
            params: { fields: ['name'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
        ];

        runScenarios(testCases);
      });

      describe('INFO kind', () => {
        const testCases: TestCase[] = [
          {
            name: 'with field: throws Error',
            response: responseWithOpInfo({
              kind: 'INFO',
              field: 'name',
              message: 'Info about name',
            }),
            params: { fields: ['name'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
          {
            name: 'without field: throws Error',
            response: responseWithOpInfo({
              kind: 'INFO',
              message: 'Operation completed with notes',
            }),
            params: { fields: ['name'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
        ];

        runScenarios(testCases);
      });

      describe('WARNING kind', () => {
        const testCases: TestCase[] = [
          {
            name: 'with field: throws Error',
            response: responseWithOpInfo({
              kind: 'WARNING',
              field: 'name',
              message: 'Name field may be outdated',
            }),
            params: { fields: ['name'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
          {
            name: 'without field: throws Error',
            response: responseWithOpInfo({
              kind: 'WARNING',
              message: 'Some fields may be outdated',
            }),
            params: { fields: ['name'] },
            throws: {
              type: Error,
              message: 'An unexpected error occurred.',
            },
          },
        ];

        runScenarios(testCases);
      });
    });

    describe('edge cases', () => {
      const testCases: TestCase[] = [
        {
          name: 'empty fields array: throws Error',
          response: { data: null },
          params: { fields: [] },
          throws: { type: Error, message: 'An unexpected error occurred.' },
        },
        {
          name: 'no data: throws Error',
          response: { data: null },
          params: { fields: ['name'] },
          throws: { type: Error, message: 'No response data' },
        },
        {
          name: 'unexpected __typename: throws Error',
          response: {
            data: { defaultOperationName: { __typename: 'UnknownType' } },
          },
          params: { fields: ['name'] },
          throws: { type: Error, message: DEFAULT_GQL_ERROR_MESSAGE },
        },
        {
          name: 'OperationInfo with no messages: throws Error with fallback',
          response: responseWithOpInfo(),
          params: { fields: ['name'] },
          throws: { type: Error, message: DEFAULT_GQL_ERROR_MESSAGE },
        },
      ];

      runScenarios(testCases);
    });
  });
});
