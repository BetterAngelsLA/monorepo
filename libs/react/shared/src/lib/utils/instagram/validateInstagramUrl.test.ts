import {
  type TInstagramValidation,
  validateInstagramUrl,
} from './validateInstagramUrl';

const INVALID = {
  status: 'invalid',
  error:
    'Enter an Instagram handle (e.g. @betterangels) or an instagram.com link.',
} satisfies TInstagramValidation;

/** `[value, expected]` */
const cases: [string | null | undefined, TInstagramValidation][] = [
  [undefined, { status: 'empty' }],
  [null, { status: 'empty' }],
  ['   ', { status: 'empty' }],
  [
    'betterangels',
    { status: 'valid', href: 'https://instagram.com/betterangels' },
  ],
  [
    '@betterangels',
    { status: 'valid', href: 'https://instagram.com/betterangels' },
  ],
  [
    '  @betterangels  ',
    { status: 'valid', href: 'https://instagram.com/betterangels' },
  ],
  [
    'instagram.com/betterangels',
    { status: 'valid', href: 'https://instagram.com/betterangels' },
  ],
  [
    'https://www.instagram.com/betterangels/',
    { status: 'valid', href: 'https://instagram.com/betterangels' },
  ],
  [
    '@better.angels_1',
    { status: 'valid', href: 'https://instagram.com/better.angels_1' },
  ],
  ['@not a handle!', INVALID],
  ['a'.repeat(31), INVALID],
  // Ambiguous without the "@": a dotted value reads as a domain, so it is
  // rejected here even though "@better.angels" above is accepted.
  ['better.angels', INVALID],
  ['https://example.com/housing', INVALID],
  ['example.com', INVALID],
];

describe('validateInstagramUrl', () => {
  it.each(cases)('validateInstagramUrl(%o) → %o', (value, expected) => {
    expect(validateInstagramUrl(value)).toEqual(expected);
  });
});
