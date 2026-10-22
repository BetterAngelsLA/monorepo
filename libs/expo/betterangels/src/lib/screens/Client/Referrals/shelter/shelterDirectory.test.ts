import { shelterDirectoryUrl } from './shelterDirectory';

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

it.each([
  '',
  'not a URL',
  'file:///tmp/shelters',
  'https://user:password@example.com',
])('ignores unusable directory configuration: %s', (url) => {
  expect(shelterDirectoryUrl('http://localhost:8001', '9', url)).toBeNull();
});

it.each(['', ' ', '.', '..'])(
  'does not create a detail URL for invalid ID %j',
  (id) => {
    expect(
      shelterDirectoryUrl('https://api.prod.betterangels.la', id),
    ).toBeNull();
  },
);
