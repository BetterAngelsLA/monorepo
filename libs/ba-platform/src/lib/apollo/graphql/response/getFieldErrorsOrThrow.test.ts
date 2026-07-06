import { BaPermissionError } from '../../../errors/BaPermissionError';
import { getFieldErrorsOrThrow } from './getFieldErrorsOrThrow';
import type { FieldError } from './types';

// ── Helpers ─────────────────────────────────────────────────────────────

function opInfo(
  ...messages: Array<{
    kind: string;
    field?: string | null;
    message?: string;
  }>
) {
  return {
    data: {
      testOp: {
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

function errors(
  ...e: Array<{ message?: string; extensions?: Record<string, unknown> }>
) {
  return { data: null, errors: e };
}

const ok = (...data: Record<string, unknown>[]) => ({
  data: { testOp: { __typename: 'TestType', ...data[0] } },
});

const defaultParams = {
  operationKey: 'testOp',
  successTypename: 'TestType',
};

type TestCase = {
  name: string;
  response: Record<string, unknown>;
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
          response: tc.response as any,
          ...mergedParams,
        })
      ).toThrow(tc.throws.type);

      try {
        getFieldErrorsOrThrow({
          response: tc.response as any,
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
          response: tc.response as any,
          ...mergedParams,
        })
      ).toEqual(tc.returns ?? []);
    }
  });
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('getFieldErrorsOrThrow', () => {
  describe('successful mutation', () => {
    const testCases: TestCase[] = [
      { name: 'matching __typename', response: ok() },
      {
        name: 'matching __typename with extra data',
        response: ok({ id: '1', name: 'Test' }),
      },
    ];

    runScenarios(testCases);
  });

  describe('top-level errors', () => {
    const testCases: TestCase[] = [
      {
        name: 'UNAUTHENTICATED: throws BaPermissionError',
        response: errors({
          message: 'Login required',
          extensions: { code: 'UNAUTHENTICATED' },
        }),
        throws: { type: BaPermissionError, message: 'Login required' },
      },
      {
        name: 'UNAUTHENTICATED missing message: throws BaPermissionError with fallback',
        response: errors({ extensions: { code: 'UNAUTHENTICATED' } }),
        throws: { type: BaPermissionError },
      },
      {
        name: 'NOT_FOUND: throws Error',
        response: errors({
          message: 'Not Found.',
          extensions: { code: 'NOT_FOUND' },
        }),
        throws: { type: Error, message: 'Not Found.' },
      },
      {
        name: 'generic error (ValueError): throws Error',
        response: errors({ message: 'Invalid upload token' }),
        throws: { type: Error, message: 'Invalid upload token' },
      },
      {
        name: 'missing message: throws Error with fallback',
        response: errors({}),
        throws: { type: Error },
      },
    ];

    runScenarios(testCases);
  });

  describe('OperationInfo: PERMISSION kind', () => {
    const testCases: TestCase[] = [
      {
        name: 'PERMISSION kind: throws BaPermissionError',
        response: opInfo({
          kind: 'PERMISSION',
          message: 'You do not have permission.',
        }),
        throws: {
          type: BaPermissionError,
          message: 'You do not have permission.',
        },
      },
      {
        name: 'PERMISSION kind with no message: throws BaPermissionError with default msg',
        response: opInfo({ kind: 'PERMISSION' }),
        throws: { type: BaPermissionError, message: 'Permission denied.' },
      },
    ];

    runScenarios(testCases);
  });

  describe('OperationInfo: VALIDATION kind', () => {
    describe('without field filter', () => {
      const testCases: TestCase[] = [
        {
          name: 'single VALIDATION message: returns message',
          response: opInfo({
            kind: 'VALIDATION',
            field: 'name',
            message: 'Required',
          }),
          returns: [{ field: 'name', message: 'Required' }],
        },
        {
          name: 'multiple VALIDATION messages: returns all messages',
          response: opInfo(
            { kind: 'VALIDATION', field: 'name', message: 'Required' },
            { kind: 'VALIDATION', field: 'email', message: 'Invalid' }
          ),
          returns: [
            { field: 'name', message: 'Required' },
            { field: 'email', message: 'Invalid' },
          ],
        },
        {
          name: 'without field: throws Error',
          response: opInfo({ kind: 'VALIDATION', message: 'Form invalid' }),
          throws: { type: Error, message: 'Form invalid' },
        },
        {
          name: 'mixed with ERROR: returns field errors only',
          response: opInfo(
            { kind: 'ERROR', message: 'Something failed' },
            { kind: 'VALIDATION', field: 'name', message: 'Required' }
          ),
          returns: [{ field: 'name', message: 'Required' }],
        },
      ];

      runScenarios(testCases);
    });

    describe('with field filter', () => {
      const testCases: TestCase[] = [
        {
          name: 'with matching fields: returns fields',
          response: opInfo(
            { kind: 'VALIDATION', field: 'name', message: 'Required' },
            { kind: 'VALIDATION', field: 'email', message: 'Invalid' }
          ),
          params: { fields: ['name'] },
          returns: [{ field: 'name', message: 'Required' }],
        },
        {
          name: 'with no matching fields: throws Error',
          response: opInfo(
            { kind: 'VALIDATION', field: 'email', message: 'Invalid format' },
            { kind: 'VALIDATION', field: 'phone', message: 'Required' }
          ),
          params: { fields: ['unmatchedField'] },
          throws: { type: Error, message: 'An unexpected error occurred.' },
        },
      ];

      runScenarios(testCases);
    });
  });

  describe('extensions.errors with field validation', () => {
    describe('without field filter', () => {
      const testCases: TestCase[] = [
        {
          name: 'known errorCode: returns mapped message',
          response: errors({
            extensions: {
              errors: [{ field: 'email', errorCode: 'EMAIL_INVALID' }],
            },
          }),
          returns: [{ field: 'email', message: 'Enter a valid email address' }],
        },
        {
          name: 'unknown errorCode: falls back to message',
          response: errors({
            extensions: {
              errors: [{ field: 'x', errorCode: 'UNKNOWN', message: 'Oops' }],
            },
          }),
          returns: [{ field: 'x', message: 'Oops' }],
        },
        {
          name: 'no errorCode, no message: returns "Invalid value"',
          response: errors({
            extensions: { errors: [{ field: 'y' }] },
          }),
          returns: [{ field: 'y', message: 'Invalid value' }],
        },
        {
          name: 'no field: throws Error with fallback message',
          response: errors({
            extensions: {
              errors: [{ errorCode: 'EMAIL_INVALID' }],
            },
          }),
          throws: { type: Error },
        },
      ];

      runScenarios(testCases);
    });

    describe('with field filter', () => {
      const testCases: TestCase[] = [
        {
          name: 'with matching fields: returns fields',
          response: errors({
            extensions: {
              errors: [
                { field: 'email', errorCode: 'EMAIL_INVALID' },
                { field: 'phone', errorCode: 'PHONE_NUMBER_INVALID' },
              ],
            },
          }),
          params: { fields: ['email'] },
          returns: [{ field: 'email', message: 'Enter a valid email address' }],
        },
        {
          name: 'with no matching fields: throws Error',
          response: errors({
            extensions: {
              errors: [{ field: 'email', errorCode: 'EMAIL_INVALID' }],
            },
          }),
          params: { fields: ['unmatchedField'] },
          throws: { type: Error, message: 'An unexpected error occurred.' },
        },
      ];

      runScenarios(testCases);
    });
  });

  describe('OperationInfo: ERROR kind', () => {
    const testCases: TestCase[] = [
      {
        name: 'ERROR without field: throws Error',
        response: opInfo({
          kind: 'ERROR',
          message: 'Shelter not found',
        }),
        throws: { type: Error, message: 'Shelter not found' },
      },
      {
        name: 'ERROR with field: throws Error',
        response: opInfo({
          kind: 'ERROR',
          field: 'name',
          message: 'Name lookup failed',
        }),
        throws: { type: Error, message: 'Name lookup failed' },
      },
    ];

    runScenarios(testCases);
  });

  describe('OperationInfo: INFO kind', () => {
    const testCases: TestCase[] = [
      {
        name: 'INFO without field: throws Error',
        response: opInfo({
          kind: 'INFO',
          message: 'Operation completed with notes',
        }),
        throws: { type: Error, message: 'Operation completed with notes' },
      },
      {
        name: 'INFO with field: throws Error',
        response: opInfo({
          kind: 'INFO',
          field: 'name',
          message: 'Info about name',
        }),
        throws: { type: Error, message: 'Info about name' },
      },
    ];

    runScenarios(testCases);
  });

  describe('OperationInfo: WARNING kind', () => {
    const testCases: TestCase[] = [
      {
        name: 'WARNING without field: throws Error',
        response: opInfo({
          kind: 'WARNING',
          message: 'Some fields may be outdated',
        }),
        throws: { type: Error, message: 'Some fields may be outdated' },
      },
      {
        name: 'WARNING with field: throws Error',
        response: opInfo({
          kind: 'WARNING',
          field: 'name',
          message: 'Name field may be outdated',
        }),
        throws: { type: Error, message: 'Name field may be outdated' },
      },
    ];

    runScenarios(testCases);
  });

  describe('edge cases', () => {
    const testCases: TestCase[] = [
      {
        name: 'no data: throws Error',
        response: { data: null } as any,
        throws: { type: Error, message: 'No response data' },
      },
      {
        name: 'unexpected __typename: throws Error',
        response: {
          data: { testOp: { __typename: 'UnknownType' } },
        } as any,
        throws: { type: Error },
      },
      {
        name: 'OperationInfo with no messages: throws Error with fallback',
        response: opInfo(),
        throws: { type: Error },
      },
    ];

    runScenarios(testCases);
  });
});
