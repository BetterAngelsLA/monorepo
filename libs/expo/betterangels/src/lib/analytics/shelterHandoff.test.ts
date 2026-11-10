import { shelterHandoffFragment, withShelterHandoff } from './shelterHandoff';

const HOME = 'https://shelter.betterangels.la/';

it('carries both identifiers in the fragment', () => {
  expect(
    withShelterHandoff(HOME, {
      distinctId: 'distinct-1',
      sessionId: 'session-1',
    }),
  ).toBe(`${HOME}#ba_did=distinct-1&ba_sid=session-1`);
});

it('omits a missing identifier without leaving a stray separator', () => {
  expect(shelterHandoffFragment({ distinctId: 'distinct-1' })).toBe(
    'ba_did=distinct-1',
  );
  expect(shelterHandoffFragment({ sessionId: 'session-1' })).toBe(
    'ba_sid=session-1',
  );
  expect(
    shelterHandoffFragment({ distinctId: null, sessionId: undefined }),
  ).toBe('');
});

it('encodes values that would otherwise break the fragment', () => {
  expect(
    shelterHandoffFragment({ distinctId: 'a&b=c', sessionId: 'x y' }),
  ).toBe('ba_did=a%26b%3Dc&ba_sid=x%20y');
});

it('leaves the URL untouched when analytics has no identity to carry', () => {
  expect(withShelterHandoff(HOME, {})).toBe(HOME);
});

// A build with no key, an offline device, and a first launch before the SDK
// assigned an id all land here; the button must still open the site.
it('does not append an empty fragment for all-empty identifiers', () => {
  expect(withShelterHandoff(HOME, { distinctId: '', sessionId: '' })).toBe(
    HOME,
  );
});
