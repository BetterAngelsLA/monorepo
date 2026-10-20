import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { RegionDimension } from '@monorepo/ba-platform/types';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReportSummary } from './useReportSummary';

const ORG = 'org-1';

type Summary = {
  __typename: 'ReportSummaryType';
  totalNotes: number;
  uniqueClients: number;
  startDate: string;
  endDate: string;
  notesByDate: never[];
  notesByTeam: never[];
  notesByPurpose: never[];
  uniqueClientsByDate: never[];
  topProvidedServices: never[];
  topRequestedServices: never[];
};

const SUMMARY: Summary = {
  __typename: 'ReportSummaryType',
  totalNotes: 0,
  uniqueClients: 0,
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  notesByDate: [],
  notesByTeam: [],
  notesByPurpose: [],
  uniqueClientsByDate: [],
  topProvidedServices: [],
  topRequestedServices: [],
};

type Group = {
  dimension?: RegionDimension;
  regionCodes?: string[];
};

/**
 * The hook under test. Renders the total so a render proves the query resolved; the assertions
 * are about the *variables* it sent, which the link records.
 */
function Harness({ dimension, regionCodes }: Group) {
  const { summary } = useReportSummary({
    organizationId: ORG,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    dimension,
    regionCodes,
  });

  return <span data-testid="total">{summary?.totalNotes ?? 'none'}</span>;
}

/** A client that records every operation's variables and answers with the same summary. */
function recordingClient(seen: Record<string, unknown>[]) {
  const link = new ApolloLink(
    (operation) =>
      new Observable<{ data: { reportSummary: Summary } }>((observer) => {
        seen.push(operation.variables);
        observer.next({ data: { reportSummary: SUMMARY } });
        observer.complete();
      }),
  );

  return new ApolloClient({ link, cache: new InMemoryCache() });
}

describe('useReportSummary', () => {
  it('sends the selected group with the summary, so every chart is scoped', async () => {
    const seen: Record<string, unknown>[] = [];
    const client = recordingClient(seen);

    const { rerender } = render(
      <ApolloProvider client={client}>
        <Harness />
      </ApolloProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('total').textContent).toBe('0'),
    );

    rerender(
      <ApolloProvider client={client}>
        <Harness
          dimension={RegionDimension.City}
          regionCodes={['beverly-hills']}
        />
      </ApolloProvider>,
    );
    await waitFor(() => expect(seen.length).toBeGreaterThanOrEqual(2));

    // Ungrouped: the fields travel as absent, which is the resolver's "whole organisation".
    expect(seen[0]?.['dimension']).toBeUndefined();
    expect(seen[0]?.['regionCodes']).toBeUndefined();
    // Grouped and drilled down: both travel, unchanged.
    expect(seen[1]?.['dimension']).toBe(RegionDimension.City);
    expect(seen[1]?.['regionCodes']).toEqual(['beverly-hills']);
  });

  it('omits regionCodes when the grouping has no specific regions', async () => {
    const seen: Record<string, unknown>[] = [];
    const client = recordingClient(seen);

    render(
      <ApolloProvider client={client}>
        {/* An empty list is "no regions selected", which the page resolves to "every region
            of the dimension". Sending `[]` would instead match nothing. */}
        <Harness dimension={RegionDimension.City} regionCodes={[]} />
      </ApolloProvider>,
    );
    await waitFor(() => expect(seen.length).toBeGreaterThanOrEqual(1));

    expect(seen[0]?.['dimension']).toBe(RegionDimension.City);
    expect(seen[0]?.['regionCodes']).toBeUndefined();
  });
});
