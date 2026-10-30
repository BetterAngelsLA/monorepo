/**
 * @vitest-environment jsdom
 */
import { ApolloLink } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sheltersAtom, shelterSearchTriggerAtom } from '../../atoms';
import type { PublicSheltersQuery } from '../../pages';
import type { TMapBounds } from '../Map';
import { SheltersDisplay } from './SheltersDisplay';

vi.mock('@vis.gl/react-google-maps', () => ({
  useMap: () => null,
}));

// The `../Map` barrel would pull in Map.tsx, the Google Maps controls and
// `@monorepo/react/components`; the card only needs the viewport helper.
vi.mock('../Map', async () => {
  const util = await vi.importActual<typeof import('../Map/utils/mapViewport')>(
    '../Map/utils/mapViewport',
  );

  return { mapViewportFromMap: util.mapViewportFromMap };
});

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );

  return { ...actual, useNavigate: () => vi.fn() };
});

/**
 * `SheltersDisplay` decides *how* the results are presented — count line,
 * source line, one card per result, empty state — so every assertion here is
 * about a response shape this file owns rather than about what an environment's
 * database happens to hold. The e2e spec keeps only the wiring (`shelter-search`
 * in `apps/shelter-e2e`) against a stubbed endpoint.
 */

type TResult = PublicSheltersQuery['shelters']['results'][number];

const MAP_BOUNDS: TMapBounds = {
  westLng: -118.5,
  northLat: 34.2,
  eastLng: -118.1,
  southLat: 34.0,
};

/**
 * A result with every field optional except `id` and `name`.
 *
 * Spelled out rather than written as `Pick<…> & Partial<TResult>`: TypeScript's
 * excess-property check runs against each constituent of an intersection, so the
 * intersected form rejects a literal that also sets `distanceInMiles`.
 */
type TMakeShelterInput = {
  id: TResult['id'];
  name: TResult['name'];
  distanceInMiles?: TResult['distanceInMiles'];
  isPrivate?: TResult['isPrivate'];
  heroImage?: TResult['heroImage'];
  location?: TResult['location'];
  shelterTypes?: TResult['shelterTypes'];
};

function makeShelter(overrides: TMakeShelterInput): TResult {
  return {
    __typename: 'ShelterType',
    isPrivate: false,
    shelterTypes: [],
    heroImage: null,
    location: null,
    distanceInMiles: null,
    ...overrides,
  };
}

function sheltersResponse(
  results: TResult[],
  totalCount: number,
): { data: PublicSheltersQuery } {
  return {
    data: {
      __typename: 'Query',
      shelters: {
        __typename: 'ShelterTypeOffsetPaginated',
        totalCount,
        results,
      },
    },
  };
}

/**
 * A link that answers every operation with `response` and records what was
 * asked, so a test can assert the query variables without the mock being
 * pinned to them — a pinned mock turns an unrelated variable change into a
 * "no more mocked responses" failure instead of a readable assertion.
 */
function renderDisplay(response: { data: PublicSheltersQuery }) {
  const operations: ApolloLink.Operation[] = [];

  const link = new ApolloLink((operation) => {
    operations.push(operation);

    return of(response);
  });

  render(
    <MockedProvider link={link}>
      <SheltersDisplay mapBoundsFilter={MAP_BOUNDS} />
    </MockedProvider>,
  );

  return { operations };
}

beforeEach(() => {
  getDefaultStore().set(shelterSearchTriggerAtom, 0);
  getDefaultStore().set(sheltersAtom, []);
});

describe('SheltersDisplay', () => {
  it('renders one card per result and the visible-of-total count', async () => {
    renderDisplay(
      sheltersResponse(
        [
          makeShelter({
            id: '1',
            name: 'Hope House',
            distanceInMiles: 2.4,
            location: {
              __typename: 'ShelterLocationType',
              latitude: 34.05,
              longitude: -118.25,
              place: '123 Main St, USA',
            },
          }),
          makeShelter({ id: '2', name: 'Second House' }),
        ],
        2,
      ),
    );

    expect(await screen.findByText('2 of 2 locations')).toBeTruthy();
    expect(screen.getByText('(based on map area)')).toBeTruthy();
    expect(screen.getByText('Hope House')).toBeTruthy();
    expect(screen.getByText('Second House')).toBeTruthy();
    // `place` is shown without the trailing country suffix.
    expect(screen.getByText('123 Main St')).toBeTruthy();
  });

  it('reports a partial page as N of M', async () => {
    renderDisplay(
      sheltersResponse(
        [makeShelter({ id: '1', name: 'Hope House' })],
        // The query asks for 5000 at a time; the total is what the server
        // counted, so a page shorter than it reads as N of M.
        9,
      ),
    );

    expect(await screen.findByText('1 of 9 locations')).toBeTruthy();
    expect(screen.getByText('Hope House')).toBeTruthy();
  });

  it('renders the empty state when the response has no results', async () => {
    renderDisplay(sheltersResponse([], 0));

    expect(await screen.findByText('0 of 0 locations')).toBeTruthy();
    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('Try searching for something else.')).toBeTruthy();
  });

  it('sends the map bounds as the query filter', async () => {
    const { operations } = renderDisplay(
      sheltersResponse([makeShelter({ id: '1', name: 'Hope House' })], 1),
    );

    await screen.findByText('Hope House');

    expect(operations[0]?.operationName).toBe('PublicShelters');
    expect(operations[0]?.variables).toMatchObject({
      filters: { mapBounds: MAP_BOUNDS },
      pagination: { limit: 5000, offset: 0 },
    });
  });
});
