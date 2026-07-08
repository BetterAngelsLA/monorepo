import {
  OperationMessage,
  OperationMessageKind,
} from '../../__generated__/types';
import type { FieldError } from '../types';
import { filterRecoverableOperationMessages } from './filterRecoverableOperationMessages';

function msg(overrides: Partial<OperationMessage> = {}): OperationMessage {
  return {
    __typename: 'OperationMessage',
    kind: OperationMessageKind.Validation,
    field: 'name',
    message: 'Required',
    ...overrides,
  };
}

const FIELDS = ['name', 'email'];

type TestCase = {
  name: string;
  messages: OperationMessage[];
  allowedFields: string[];
  recoverable: FieldError[];
  unrecoverable: OperationMessage[];
};

const testCases: TestCase[] = [
  {
    name: 'all VALIDATION with matching fields → all recoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'name',
        message: 'Required',
      }),
      msg({
        kind: OperationMessageKind.Validation,
        field: 'email',
        message: 'Invalid',
      }),
    ],
    allowedFields: [...FIELDS],
    recoverable: [
      { field: 'name', message: 'Required' },
      { field: 'email', message: 'Invalid' },
    ],
    unrecoverable: [],
  },
  {
    name: 'empty messages → both empty',
    messages: [],
    allowedFields: [...FIELDS],
    recoverable: [],
    unrecoverable: [],
  },
  {
    name: 'non-VALIDATION kind → unrecoverable',
    messages: [msg({ kind: OperationMessageKind.Error })],
    allowedFields: [...FIELDS],
    recoverable: [],
    unrecoverable: [msg({ kind: OperationMessageKind.Error })],
  },
  {
    name: 'VALIDATION with null field → unrecoverable',
    messages: [msg({ kind: OperationMessageKind.Validation, field: null })],
    allowedFields: [...FIELDS],
    recoverable: [],
    unrecoverable: [
      msg({ kind: OperationMessageKind.Validation, field: null }),
    ],
  },
  {
    name: 'field not in allowedFields → unrecoverable',
    messages: [msg({ kind: OperationMessageKind.Validation, field: 'phone' })],
    allowedFields: [...FIELDS],
    recoverable: [],
    unrecoverable: [
      msg({ kind: OperationMessageKind.Validation, field: 'phone' }),
    ],
  },
  {
    name: 'mixed recoverable + unrecoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'name',
        message: 'Required',
      }),
      msg({ kind: OperationMessageKind.Error, field: 'name', message: 'Boom' }),
      msg({
        kind: OperationMessageKind.Validation,
        field: null,
        message: 'Form invalid',
      }),
    ],
    allowedFields: [...FIELDS],
    recoverable: [{ field: 'name', message: 'Required' }],
    unrecoverable: [
      msg({ kind: OperationMessageKind.Error, field: 'name', message: 'Boom' }),
      msg({
        kind: OperationMessageKind.Validation,
        field: null,
        message: 'Form invalid',
      }),
    ],
  },
  {
    name: 'VALIDATION with field: undefined → unrecoverable',
    messages: [
      msg({ kind: OperationMessageKind.Validation, field: undefined }),
    ],
    allowedFields: [...FIELDS],
    recoverable: [],
    unrecoverable: [
      msg({ kind: OperationMessageKind.Validation, field: undefined }),
    ],
  },
  {
    name: 'empty allowedFields → all unrecoverable',
    messages: [msg({ kind: OperationMessageKind.Validation, field: 'name' })],
    allowedFields: [],
    recoverable: [],
    unrecoverable: [
      msg({ kind: OperationMessageKind.Validation, field: 'name' }),
    ],
  },
];

describe('filterRecoverableOperationMessages', () => {
  it.each(testCases.map((tc) => [tc.name, tc] as const))('%s', (_, tc) => {
    const result = filterRecoverableOperationMessages(
      tc.messages,
      tc.allowedFields
    );
    expect(result.recoverable).toEqual(tc.recoverable);
    expect(result.unrecoverable).toEqual(tc.unrecoverable);
  });
});
