import { useApolloClient } from '@apollo/client/react';
import { useEffect, useReducer, useState } from 'react';
import {
  SheltersDocument,
  type SheltersQuery,
} from './__generated__/Shelters.generated';

type ShelterPage = SheltersQuery['shelters'];
type Shelter = ShelterPage['results'][number];

/** Read every page before ranking or deciding that a saved selection is gone. */
export async function loadReferralShelters(
  fetchPage: (offset: number) => Promise<ShelterPage>,
  isCancelled: () => boolean = () => false,
): Promise<Shelter[]> {
  const shelters = new Map<string, Shelter>();
  let offset = 0;
  let expectedTotal: number | undefined;
  while (!isCancelled()) {
    const page = await fetchPage(offset);
    if (isCancelled()) return [];
    if (
      !Number.isSafeInteger(page.totalCount) ||
      page.totalCount < 0 ||
      (expectedTotal !== undefined && page.totalCount !== expectedTotal) ||
      (page.results.length === 0 && offset < page.totalCount)
    )
      throw new Error('Shelter list changed or could not be fully loaded');
    expectedTotal = page.totalCount;
    for (const shelter of page.results) {
      if (shelters.has(shelter.id)) throw new Error('Shelter pages overlap');
      shelters.set(shelter.id, shelter);
    }
    // Advance by the actual page length, including server-capped pages.
    offset += page.results.length;
    if (offset === expectedTotal) return [...shelters.values()];
    if (offset > expectedTotal)
      throw new Error('Shelter count is inconsistent');
  }
  return [];
}

export function useReferralShelters() {
  const client = useApolloClient();
  const [revision, retry] = useReducer((value: number) => value + 1, 0);
  const [state, setState] = useState({
    client,
    revision,
    shelters: [] as Shelter[],
    loading: true,
    error: false,
  });
  useEffect(() => {
    let cancelled = false;
    setState({ client, revision, shelters: [], loading: true, error: false });
    void loadReferralShelters(
      async (offset) => {
        const { data } = await client.query({
          query: SheltersDocument,
          variables: { pagination: { offset, limit: 100 } },
          fetchPolicy: 'no-cache',
          context: { queryDeduplication: false },
        });
        if (!data) throw new Error('No shelter list returned');
        return data.shelters;
      },
      () => cancelled,
    ).then(
      (shelters) => {
        if (!cancelled)
          setState({
            client,
            revision,
            shelters,
            loading: false,
            error: false,
          });
      },
      () => {
        if (!cancelled)
          setState({
            client,
            revision,
            shelters: [],
            loading: false,
            error: true,
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [client, revision]);
  // Hide the previous environment's results before the new effect runs.
  return state.client === client && state.revision === revision
    ? { ...state, retry }
    : { shelters: [] as Shelter[], loading: true, error: false, retry };
}
