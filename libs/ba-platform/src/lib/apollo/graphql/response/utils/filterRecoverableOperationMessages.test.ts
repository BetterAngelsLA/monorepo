import {
  OperationMessage,
  OperationMessageKind,
} from '../../__generated__/types';
import type { FieldError } from '../types';
import {
  filterRecoverableOperationMessages,
  type IndexedField,
} from './filterRecoverableOperationMessages';

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
  allowedFields: (string | IndexedField)[];
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
    name: 'nested path beneath an allowed field → recoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'name.first',
        message: 'Required',
      }),
    ],
    allowedFields: [...FIELDS],
    recoverable: [{ field: 'name.first', message: 'Required' }],
    unrecoverable: [],
  },
  {
    name: 'field sharing an allowed prefix without a dot → unrecoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'name2',
        message: 'Unknown',
      }),
    ],
    allowedFields: [...FIELDS],
    recoverable: [],
    unrecoverable: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'name2',
        message: 'Unknown',
      }),
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
  {
    name: 'IndexedField matches <parentKey>.<index>.<child> → recoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.0.contactEmail',
        message: 'Invalid',
      }),
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.12.contactEmail',
        message: 'Invalid',
      }),
    ],
    allowedFields: [
      { parentKey: 'additionalContacts', children: ['contactEmail'] },
    ],
    recoverable: [
      { field: 'additionalContacts.0.contactEmail', message: 'Invalid' },
      { field: 'additionalContacts.12.contactEmail', message: 'Invalid' },
    ],
    unrecoverable: [],
  },
  {
    name: 'IndexedField: child not listed → unrecoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.0.contactTitle',
        message: 'Too long',
      }),
    ],
    allowedFields: [
      { parentKey: 'additionalContacts', children: ['contactEmail'] },
    ],
    recoverable: [],
    unrecoverable: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.0.contactTitle',
        message: 'Too long',
      }),
    ],
  },
  {
    name: 'IndexedField: row-level <parentKey>.<index> → unrecoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.0',
        message: 'Invalid additional contact.',
      }),
    ],
    allowedFields: [
      { parentKey: 'additionalContacts', children: ['contactEmail'] },
    ],
    recoverable: [],
    unrecoverable: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.0',
        message: 'Invalid additional contact.',
      }),
    ],
  },
  {
    name: 'IndexedField: deeper path beneath a child → unrecoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.0.contactEmail.extra',
        message: 'Nested',
      }),
    ],
    allowedFields: [
      { parentKey: 'additionalContacts', children: ['contactEmail'] },
    ],
    recoverable: [],
    unrecoverable: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.0.contactEmail.extra',
        message: 'Nested',
      }),
    ],
  },
  {
    name: 'IndexedField: non-numeric index → unrecoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.x.contactEmail',
        message: 'Invalid',
      }),
    ],
    allowedFields: [
      { parentKey: 'additionalContacts', children: ['contactEmail'] },
    ],
    recoverable: [],
    unrecoverable: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.x.contactEmail',
        message: 'Invalid',
      }),
    ],
  },
  {
    name: 'mixed plain name + IndexedField entries → both recoverable',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'name',
        message: 'Required',
      }),
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.3.contactName',
        message: 'Required',
      }),
    ],
    allowedFields: [
      'name',
      { parentKey: 'additionalContacts', children: ['contactName'] },
    ],
    recoverable: [
      { field: 'name', message: 'Required' },
      { field: 'additionalContacts.3.contactName', message: 'Required' },
    ],
    unrecoverable: [],
  },
  {
    name: 'plain parent key: still matches any descendant (legacy behavior)',
    messages: [
      msg({
        kind: OperationMessageKind.Validation,
        field: 'additionalContacts.0.id',
        message: 'Unknown additional contact id.',
      }),
    ],
    allowedFields: ['additionalContacts'],
    recoverable: [
      {
        field: 'additionalContacts.0.id',
        message: 'Unknown additional contact id.',
      },
    ],
    unrecoverable: [],
  },
];

describe('filterRecoverableOperationMessages', () => {
  it.each(testCases.map((tc) => [tc.name, tc] as const))('%s', (_, tc) => {
    const result = filterRecoverableOperationMessages(
      tc.messages,
      tc.allowedFields,
    );
    expect(result.recoverable).toEqual(tc.recoverable);
    expect(result.unrecoverable).toEqual(tc.unrecoverable);
  });
});
