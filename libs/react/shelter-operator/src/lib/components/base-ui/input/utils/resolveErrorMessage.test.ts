import type { InputDataType } from '../types';
import { resolveErrorMessage } from './resolveErrorMessage';

type TestCase = [
  description: string,
  params: {
    error?: string;
    required?: boolean;
    dataType?: InputDataType;
    value: string | number | readonly string[] | undefined;
  },
  expected: string | undefined
];

function runTestCases(cases: TestCase[]) {
  it.each(cases)('%s', (_description, params, expected) => {
    expect(resolveErrorMessage(params)).toBe(expected);
  });
}

// ── Explicit `error` prop always wins ──────────────────────────────────────

describe('explicit error message always returns message', () => {
  const testCases: TestCase[] = [
    [
      'empty value',
      { error: 'hello error msg', required: true, value: '' },
      'hello error msg',
    ],
    [
      'valid value',
      { error: 'hello error msg', required: true, value: 'ok' },
      'hello error msg',
    ],
    [
      'without required',
      { error: 'hello error msg', value: 'ok' },
      'hello error msg',
    ],
    [
      'without dataType',
      { error: 'hello error msg', value: 'ok' },
      'hello error msg',
    ],
    [
      'with dataType',
      { error: 'hello error msg', dataType: 'email', value: 'x@y.z' },
      'hello error msg',
    ],
    [
      'with invalid format',
      { error: 'hello error msg', dataType: 'email', value: 'nope' },
      'hello error msg',
    ],
    [
      'with number 0',
      { error: 'hello error msg', dataType: 'number', value: 0 },
      'hello error msg',
    ],
    [
      'with undefined value',
      { error: 'hello error msg', value: undefined },
      'hello error msg',
    ],
  ];

  runTestCases(testCases);
});

// ── No dataType ────────────────────────────────────────────────────────────

describe('without dataType — skips format validation', () => {
  const testCases: TestCase[] = [
    [
      'required, empty string',
      { required: true, value: '' },
      'This field is required',
    ],
    [
      'required, whitespace only',
      { required: true, value: '   ' },
      'This field is required',
    ],
    [
      'required, undefined',
      { required: true, value: undefined },
      'This field is required',
    ],
    ['required, non-empty', { required: true, value: 'hello' }, undefined],
    ['optional, empty string', { value: '' }, undefined],
    ['optional, whitespace only', { value: '   ' }, undefined],
    ['optional, undefined', { value: undefined }, undefined],
    ['optional, non-empty', { value: 'hello' }, undefined],
  ];

  runTestCases(testCases);
});

// ── email ──────────────────────────────────────────────────────────────────

describe('email', () => {
  const testCases: TestCase[] = [
    [
      'required, empty',
      { required: true, dataType: 'email', value: '' },
      'This field is required',
    ],
    [
      'required, whitespace',
      { required: true, dataType: 'email', value: '   ' },
      'This field is required',
    ],
    [
      'required, valid',
      { required: true, dataType: 'email', value: 'a@b.c' },
      undefined,
    ],
    [
      'required, valid with subdomain',
      { required: true, dataType: 'email', value: 'user@sub.example.com' },
      undefined,
    ],
    [
      'required, valid with plus',
      { required: true, dataType: 'email', value: 'user+tag@example.com' },
      undefined,
    ],
    [
      'required, invalid (no @)',
      { required: true, dataType: 'email', value: 'notanemail' },
      'Please enter a valid email',
    ],
    [
      'required, invalid (no domain)',
      { required: true, dataType: 'email', value: 'a@b' },
      'Please enter a valid email',
    ],
    ['optional, empty', { dataType: 'email', value: '' }, undefined],
    ['optional, whitespace', { dataType: 'email', value: '   ' }, undefined],
    ['optional, undefined', { dataType: 'email', value: undefined }, undefined],
    [
      'optional, valid',
      { dataType: 'email', value: 'test@example.com' },
      undefined,
    ],
    [
      'optional, invalid',
      { dataType: 'email', value: 'bad' },
      'Please enter a valid email',
    ],
  ];

  runTestCases(testCases);
});

// ── phone-number ───────────────────────────────────────────────────────────

describe('phone-number', () => {
  const testCases: TestCase[] = [
    [
      'required, empty',
      { required: true, dataType: 'phone-number', value: '' },
      'This field is required',
    ],
    [
      'required, valid',
      { required: true, dataType: 'phone-number', value: '555-1234' },
      undefined,
    ],
    [
      'required, valid with parens',
      { required: true, dataType: 'phone-number', value: '(555) 123-4567' },
      undefined,
    ],
    [
      'required, valid with plus',
      { required: true, dataType: 'phone-number', value: '+1 555-123-4567' },
      undefined,
    ],
    [
      'required, invalid (letters)',
      { required: true, dataType: 'phone-number', value: 'abc' },
      'Please enter a valid phone number',
    ],
    ['optional, empty', { dataType: 'phone-number', value: '' }, undefined],
    ['optional, valid', { dataType: 'phone-number', value: '123' }, undefined],
    [
      'optional, invalid',
      { dataType: 'phone-number', value: 'no digits at all' },
      'Please enter a valid phone number',
    ],
  ];

  runTestCases(testCases);
});

// ── number ─────────────────────────────────────────────────────────────────

describe('number', () => {
  const testCases: TestCase[] = [
    [
      'required, empty',
      { required: true, dataType: 'number', value: '' },
      'This field is required',
    ],
    [
      'required, 0 (truthy edge)',
      { required: true, dataType: 'number', value: 0 },
      undefined,
    ],
    [
      'required, "0"',
      { required: true, dataType: 'number', value: '0' },
      undefined,
    ],
    [
      'required, positive int',
      { required: true, dataType: 'number', value: '42' },
      undefined,
    ],
    [
      'required, negative',
      { required: true, dataType: 'number', value: '-7' },
      undefined,
    ],
    [
      'required, decimal',
      { required: true, dataType: 'number', value: '3.14' },
      undefined,
    ],
    [
      'required, negative decimal',
      { required: true, dataType: 'number', value: '-0.5' },
      undefined,
    ],
    [
      'required, invalid (letters)',
      { required: true, dataType: 'number', value: 'abc' },
      'Please enter a valid number',
    ],
    [
      'required, invalid (mixed)',
      { required: true, dataType: 'number', value: '12x' },
      'Please enter a valid number',
    ],
    ['optional, empty', { dataType: 'number', value: '' }, undefined],
    ['optional, 0', { dataType: 'number', value: 0 }, undefined],
    ['optional, valid', { dataType: 'number', value: '99' }, undefined],
    [
      'optional, invalid',
      { dataType: 'number', value: 'nope' },
      'Please enter a valid number',
    ],
  ];

  runTestCases(testCases);
});

// ── time ───────────────────────────────────────────────────────────────────

describe('time', () => {
  const testCases: TestCase[] = [
    [
      'required, empty',
      { required: true, dataType: 'time', value: '' },
      'This field is required',
    ],
    [
      'required, valid (midnight)',
      { required: true, dataType: 'time', value: '00:00' },
      undefined,
    ],
    [
      'required, valid',
      { required: true, dataType: 'time', value: '14:30' },
      undefined,
    ],
    [
      'required, valid (max)',
      { required: true, dataType: 'time', value: '23:59' },
      undefined,
    ],
    [
      'required, invalid (hours)',
      { required: true, dataType: 'time', value: '25:00' },
      'Please enter a valid time',
    ],
    [
      'required, invalid (minutes)',
      { required: true, dataType: 'time', value: '12:60' },
      'Please enter a valid time',
    ],
    [
      'required, invalid (no colon)',
      { required: true, dataType: 'time', value: '1230' },
      'Please enter a valid time',
    ],
    [
      'required, invalid (letters)',
      { required: true, dataType: 'time', value: 'abc' },
      'Please enter a valid time',
    ],
    ['optional, empty', { dataType: 'time', value: '' }, undefined],
    ['optional, valid', { dataType: 'time', value: '09:15' }, undefined],
    [
      'optional, invalid',
      { dataType: 'time', value: '99:99' },
      'Please enter a valid time',
    ],
  ];

  runTestCases(testCases);
});

// ── date ───────────────────────────────────────────────────────────────────

describe('date', () => {
  const testCases: TestCase[] = [
    [
      'required, empty',
      { required: true, dataType: 'date', value: '' },
      'This field is required',
    ],
    [
      'required, valid',
      { required: true, dataType: 'date', value: '2024-01-15' },
      undefined,
    ],
    [
      'required, valid (leap)',
      { required: true, dataType: 'date', value: '2024-02-29' },
      undefined,
    ],
    [
      'required, invalid (expects YYYY-MM-DD)',
      { required: true, dataType: 'date', value: '01/15/2024' },
      'Please enter a valid date',
    ],
    [
      'required, invalid (bad month)',
      { required: true, dataType: 'date', value: '2024-13-01' },
      'Please enter a valid date',
    ],
    [
      'required, invalid (letters)',
      { required: true, dataType: 'date', value: 'abc' },
      'Please enter a valid date',
    ],
    ['optional, empty', { dataType: 'date', value: '' }, undefined],
    ['optional, valid', { dataType: 'date', value: '2023-12-31' }, undefined],
    [
      'optional, invalid',
      { dataType: 'date', value: 'not-a-date' },
      'Please enter a valid date',
    ],
  ];

  runTestCases(testCases);
});

// ── url ────────────────────────────────────────────────────────────────────

describe('url', () => {
  const testCases: TestCase[] = [
    [
      'required, empty',
      { required: true, dataType: 'url', value: '' },
      'This field is required',
    ],
    [
      'required, valid (https)',
      { required: true, dataType: 'url', value: 'https://example.com' },
      undefined,
    ],
    [
      'required, valid (http)',
      { required: true, dataType: 'url', value: 'http://example.org' },
      undefined,
    ],
    [
      'required, valid (bare domain)',
      { required: true, dataType: 'url', value: 'example.com' },
      undefined,
    ],
    [
      'required, valid (with path)',
      { required: true, dataType: 'url', value: 'example.com/path?q=1' },
      undefined,
    ],
    [
      'required, invalid (no dot)',
      { required: true, dataType: 'url', value: 'notaurl' },
      'Please enter a valid URL',
    ],
    [
      'required, invalid (spaces)',
      { required: true, dataType: 'url', value: 'not a url' },
      'Please enter a valid URL',
    ],
    ['optional, empty', { dataType: 'url', value: '' }, undefined],
    [
      'optional, valid',
      { dataType: 'url', value: 'https://foo.bar' },
      undefined,
    ],
    [
      'optional, invalid',
      { dataType: 'url', value: 'bad' },
      'Please enter a valid URL',
    ],
  ];

  runTestCases(testCases);
});

// ── string ─────────────────────────────────────────────────────────────────

describe('string', () => {
  const testCases: TestCase[] = [
    [
      'required, empty',
      { required: true, dataType: 'string', value: '' },
      'This field is required',
    ],
    [
      'required, whitespace',
      { required: true, dataType: 'string', value: '   ' },
      'This field is required',
    ],
    [
      'required, undefined',
      { required: true, dataType: 'string', value: undefined },
      'This field is required',
    ],
    [
      'required, non-empty',
      { required: true, dataType: 'string', value: 'hello' },
      undefined,
    ],
    [
      'required, "0"',
      { required: true, dataType: 'string', value: '0' },
      undefined,
    ],
    ['optional, empty', { dataType: 'string', value: '' }, undefined],
    ['optional, whitespace', { dataType: 'string', value: '   ' }, undefined],
    [
      'optional, undefined',
      { dataType: 'string', value: undefined },
      undefined,
    ],
    [
      'optional, non-empty',
      { dataType: 'string', value: 'anything' },
      undefined,
    ],
  ];

  runTestCases(testCases);
});
