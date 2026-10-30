import type { Page, Route } from '@playwright/test';

/**
 * Answers `PublicShelters` from a fixture so a spec owns the list content; every
 * other operation falls through to the real endpoint. Register it before
 * `page.goto` — the app fires this query on mount.
 */

const GRAPHQL_PATH = '/graphql';
const PUBLIC_SHELTERS_OPERATION = 'PublicShelters';

type TShelterHeroImage = {
  __typename: 'ShelterHeroImageType';
  id: string;
  url: string;
};

type TShelterLocation = {
  __typename: 'ShelterLocationType';
  latitude: number;
  longitude: number;
  place: string;
};

/**
 * Mirrors the generated `PublicSheltersQuery`; the typenames matter — Apollo
 * normalizes the response by them.
 */
export type TShelterResult = {
  __typename: 'ShelterType';
  id: string;
  name: string;
  distanceInMiles: number | null;
  isPrivate: boolean;
  heroImage: TShelterHeroImage | null;
  location: TShelterLocation | null;
  shelterTypes: { __typename: 'ShelterTypeType'; name: string | null }[];
};

export type TSheltersResponse = {
  results: TShelterResult[];
  totalCount: number;
};

/**
 * Spelled out rather than `Pick<…> & Partial<TShelterResult>`: TypeScript checks
 * excess properties against each constituent of an intersection, so that form
 * rejects a literal which also sets `location`.
 */
type TMakeShelterInput = {
  id: TShelterResult['id'];
  name: TShelterResult['name'];
  distanceInMiles?: TShelterResult['distanceInMiles'];
  isPrivate?: TShelterResult['isPrivate'];
  heroImage?: TShelterResult['heroImage'];
  location?: TShelterResult['location'];
  shelterTypes?: TShelterResult['shelterTypes'];
};

/** A result with every optional field nulled, so a test states only what it cares about. */
export function makeShelter(shelter: TMakeShelterInput): TShelterResult {
  return {
    __typename: 'ShelterType',
    distanceInMiles: null,
    isPrivate: false,
    heroImage: null,
    location: null,
    shelterTypes: [],
    ...shelter,
  };
}

/**
 * `totalCount` is the server's count, not `results.length` — pass both to
 * express a short page.
 */
export async function mockPublicShelters(
  page: Page,
  response: TSheltersResponse,
): Promise<void> {
  await page.route(
    (url) => url.pathname === GRAPHQL_PATH,
    async (route) => {
      if (!isPublicSheltersRequest(route)) {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(toGraphqlResponse(response)),
      });
    },
  );
}

/** Every operation shares one URL, so the body's name is the only discriminator. */
function isPublicSheltersRequest(route: Route): boolean {
  const request = route.request();

  if (request.method() !== 'POST') {
    return false;
  }

  try {
    const body: { operationName?: string } | null = request.postDataJSON();

    return body?.operationName === PUBLIC_SHELTERS_OPERATION;
  } catch {
    // Not JSON — not an Apollo operation, so not ours to answer.
    return false;
  }
}

function toGraphqlResponse(response: TSheltersResponse): object {
  return {
    data: {
      shelters: {
        __typename: 'ShelterTypeOffsetPaginated',
        totalCount: response.totalCount,
        results: response.results,
      },
    },
  };
}
