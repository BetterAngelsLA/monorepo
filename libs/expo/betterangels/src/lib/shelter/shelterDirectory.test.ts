import { shelterDirectoryUrl, shelterHomeUrl } from './shelterDirectory';

/** Both parsers share a resolver, so both must reject the same shapes. */
const UNUSABLE_BASE_URLS = [
  '',
  'not a URL',
  'file:///tmp/shelters',
  'https://user:password@example.com',
];

it.each([
  [
    'https://api.prod.betterangels.la',
    'https://shelter.betterangels.la/shelter/81',
  ],
  [
    'https://api.prod.betterangels.la/',
    'https://shelter.betterangels.la/shelter/81',
  ],
  [
    'https://api.dev.betterangels.la',
    'https://shelter.dev.betterangels.la/shelter/81',
  ],
])('uses the directory corresponding to %s', (api, expected) => {
  expect(shelterDirectoryUrl(api, '81')).toBe(expected);
});

it('does not send local or unknown-environment IDs to a different database', () => {
  expect(shelterDirectoryUrl('http://localhost:8001', '9')).toBeNull();
  expect(shelterDirectoryUrl('https://other.example', '9')).toBeNull();
});

it('supports an explicitly configured directory for the local backend', () => {
  expect(
    shelterDirectoryUrl('http://localhost:8001', '9', 'http://localhost:8083/'),
  ).toBe('http://localhost:8083/shelter/9');
});

it('keeps a deployment base path and encodes the shelter ID as one path segment', () => {
  expect(
    shelterDirectoryUrl(
      'http://localhost:8001',
      'shelter/a?b',
      'http://localhost:8083/preview/?old=1#old',
    ),
  ).toBe('http://localhost:8083/preview/shelter/shelter%2Fa%3Fb');
});

it('does not let local configuration redirect production or demo IDs', () => {
  expect(
    shelterDirectoryUrl(
      'https://api.dev.betterangels.la',
      '9',
      'http://localhost:8083',
    ),
  ).toBe('https://shelter.dev.betterangels.la/shelter/9');
});

it.each(UNUSABLE_BASE_URLS)(
  'ignores unusable directory configuration: %s',
  (url) => {
    expect(shelterDirectoryUrl('http://localhost:8001', '9', url)).toBeNull();
  },
);

it.each(['', ' ', '.', '..'])(
  'does not create a detail URL for invalid ID %j',
  (id) => {
    expect(
      shelterDirectoryUrl('https://api.prod.betterangels.la', id),
    ).toBeNull();
  },
);

// The home URL is the shelter site's entry point. It deliberately points at the
// root rather than `/search`: that route is the map's search overlay, and both
// of its exits navigate back to the root.
it.each([
  ['https://api.prod.betterangels.la', 'https://shelter.betterangels.la/'],
  ['https://api.dev.betterangels.la', 'https://shelter.dev.betterangels.la/'],
])('opens the site root that matches %s', (api, expected) => {
  expect(shelterHomeUrl(api)).toBe(expected);
});

it('supports an explicitly configured site root for the local backend', () => {
  expect(
    shelterHomeUrl('http://localhost:8001', 'http://localhost:8083/'),
  ).toBe('http://localhost:8083/');
});

it('keeps a deployment base path and drops query and fragment', () => {
  expect(
    shelterHomeUrl(
      'http://localhost:8001',
      'http://localhost:8083/preview/?old=1#old',
    ),
  ).toBe('http://localhost:8083/preview/');
});

it('does not let local site configuration redirect production or demo IDs', () => {
  expect(
    shelterHomeUrl('https://api.dev.betterangels.la', 'http://localhost:8083'),
  ).toBe('https://shelter.dev.betterangels.la/');
});

it.each(UNUSABLE_BASE_URLS)(
  'ignores unusable site configuration: %s',
  (url) => {
    expect(shelterHomeUrl('http://localhost:8001', url)).toBeNull();
  },
);
