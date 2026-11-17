import {
  redactPrivateRouteProperties,
  stripUrlProperties,
} from './sanitizeProperties';

const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000';

/** What `posthog-js` attaches to a capture on a client profile. */
const ON_CLIENT_PROFILE = {
  source: 'client_profile',
  handoff: true,
  $current_url: `https://app.betterangels.la/client/${CLIENT_ID}`,
  $pathname: `/client/${CLIENT_ID}`,
  $host: 'app.betterangels.la',
  $referrer: 'https://app.betterangels.la/',
  $referring_domain: 'app.betterangels.la',
  $initial_$current_url: `https://app.betterangels.la/client/${CLIENT_ID}`,
  $session_entry_pathname: `/client/${CLIENT_ID}`,
};

it('leaves no client id in any property', () => {
  const cleaned = stripUrlProperties(ON_CLIENT_PROFILE);

  expect(JSON.stringify(cleaned)).not.toContain(CLIENT_ID);
  // The event's own properties survive; only the URL goes.
  expect(cleaned).toEqual({ source: 'client_profile', handoff: true });
});

it('keeps properties that merely contain a slash or end in "path"', () => {
  const cleaned = stripUrlProperties({
    entry_path: '/client/123',
    route: 'client',
    source: 'client_profile',
  });

  expect(cleaned).toEqual({
    entry_path: '/client/123',
    route: 'client',
    source: 'client_profile',
  });
});

it('redacts the operator path but keeps a public page URL', () => {
  const operator = {
    $current_url: 'https://shelter.betterangels.la/operator/shelter/123',
    $pathname: '/operator/shelter/123',
    $host: 'shelter.betterangels.la',
  };
  const publicPage = {
    $current_url: 'https://shelter.betterangels.la/shelter/123',
    $pathname: '/shelter/123',
    $host: 'shelter.betterangels.la',
  };

  expect(redactPrivateRouteProperties(operator, ['/operator'])).toEqual({});
  expect(redactPrivateRouteProperties(publicPage, ['/operator'])).toBe(
    publicPage,
  );
});

it('treats a prefix as a path segment, not a string prefix', () => {
  const lookalike = {
    $current_url: 'https://shelter.betterangels.la/operators',
    $pathname: '/operators',
    $host: 'shelter.betterangels.la',
  };

  // `/operators` is not `/operator`; a naive startsWith would redact it.
  expect(redactPrivateRouteProperties(lookalike, ['/operator'])).toBe(
    lookalike,
  );
});
