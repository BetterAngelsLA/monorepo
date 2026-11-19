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
  // Compared against a copy: `toBe` (or comparing to the object that was passed
  // in) also passes when the implementation redacts in place and returns it.
  expect(redactPrivateRouteProperties({ ...publicPage }, ['/operator'])).toEqual(
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
  expect(redactPrivateRouteProperties({ ...lookalike }, ['/operator'])).toEqual(
    lookalike,
  );
});

it('redacts when the session began on a private route, from a public page', () => {
  const startedOnOperator = {
    $current_url: 'https://shelter.betterangels.la/shelter/456',
    $pathname: '/shelter/456',
    $host: 'shelter.betterangels.la',
    $session_entry_url: 'https://shelter.betterangels.la/operator/shelter/123',
    $session_entry_pathname: '/operator/shelter/123',
  };

  // The current path is public, so `$pathname` alone says "keep". The set-once
  // copy still carries the operator route, and that is what ships.
  expect(redactPrivateRouteProperties(startedOnOperator, ['/operator'])).toEqual(
    {},
  );
});

it('derives the path from the url when no pathname was sent', () => {
  const urlOnly = {
    $current_url: 'https://shelter.betterangels.la/operator/shelter/123',
    $host: 'shelter.betterangels.la',
  };

  // A missing `$pathname` must not read as "public".
  expect(redactPrivateRouteProperties(urlOnly, ['/operator'])).toEqual({});
});

it('redacts the operator route under a branch base path', () => {
  const previewOperator = {
    $current_url:
      'https://shelter.dev.betterangels.la/branches/feat-x/operator/shelter/123',
    $pathname: '/branches/feat-x/operator/shelter/123',
    $host: 'shelter.dev.betterangels.la',
  };
  const previewPublic = {
    $current_url:
      'https://shelter.dev.betterangels.la/branches/feat-x/shelter/123',
    $pathname: '/branches/feat-x/shelter/123',
    $host: 'shelter.dev.betterangels.la',
  };

  // Only production is served from the root; a `startsWith('/operator')` check
  // would miss every preview and leave these paths in the payload.
  expect(redactPrivateRouteProperties(previewOperator, ['/operator'])).toEqual(
    {},
  );
  // Against a copy, so an in-place redaction cannot satisfy it.
  expect(
    redactPrivateRouteProperties({ ...previewPublic }, ['/operator']),
  ).toEqual(previewPublic);
});

it('redacts the operator root at the end of a base path', () => {
  const operatorRoot = {
    $current_url:
      'https://shelter.dev.betterangels.la/branches/feat-x/operator',
    $pathname: '/branches/feat-x/operator',
    $host: 'shelter.dev.betterangels.la',
  };

  // No trailing segment: only the `endsWith` branch matches this one, so
  // dropping it would ship the operator root from every preview.
  expect(redactPrivateRouteProperties(operatorRoot, ['/operator'])).toEqual({});
});
