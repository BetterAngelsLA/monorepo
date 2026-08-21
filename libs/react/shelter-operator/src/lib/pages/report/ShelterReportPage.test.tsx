import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { dateRangeFilterAtom } from '../../components/date-range-filter';
import { GetShelterSummaryDocument } from '../../graphql/__generated__/shelters.generated';
import { ShelterOccupancyMetricsDocument } from '../../hooks/useShelterOccupancyMetrics/__generated__/useShelterOccupancyMetrics.generated';
import { ShelterReportPage } from './ShelterReportPage';

// The page only orchestrates; the PDF itself is covered in useExportPdf.test.
vi.mock('./useExportPdf', () => ({
  useExportPdf: () => ({ exportPdf: vi.fn(), isExporting: false }),
}));

// @ant-design/plots needs real layout/canvas APIs jsdom doesn't reliably
// provide; section inclusion is covered in ShelterReportPrint.test.
vi.mock('../../components/reports/ReportCharts', () => ({
  BedStatusChart: () => <div data-testid="bed-status-chart" />,
  DailyOccupancyChart: () => <div data-testid="daily-occupancy-chart" />,
}));

const SHELTER_ID = '1';
const FROM = new Date(2026, 6, 1);
const TO = new Date(2026, 6, 7);

const SHELTER_SUMMARY = {
  __typename: 'OperatorShelterType',
  id: SHELTER_ID,
  name: 'Downtown Emergency Shelter',
  location: { __typename: 'ShelterLocationType', place: '1234 S Main St' },
};

const METRICS = {
  __typename: 'ShelterOccupancyMetricsType',
  shelterId: SHELTER_ID,
  startDate: '2026-07-01',
  endDate: '2026-07-07',
  avgDaysToOccupancy: 10,
  dailyOccupancy: [],
  dailyBedStatus: [],
  reservationMetrics: {
    __typename: 'ReservationMetricsType',
    checkInOverdue: 12,
    cancelled: 7,
    checkedIn: 8,
    checkInOverdueToCheckedIn: 1,
  },
};

const summaryRequest = {
  query: GetShelterSummaryDocument,
  variables: { id: SHELTER_ID },
};

const metricsRequest = {
  query: ShelterOccupancyMetricsDocument,
  variables: {
    shelterId: SHELTER_ID,
    startDate: '2026-07-01',
    endDate: '2026-07-07',
  },
};

function HydrateAtoms({
  range,
  children,
}: {
  range: { from: Date | null; to: Date | null };
  children: ReactNode;
}) {
  useHydrateAtoms([
    [dateRangeFilterAtom, { preset: 'CUSTOM' as const, range }],
  ]);
  return children;
}

function renderPage(
  mocks: Parameters<typeof MockedProvider>[0]['mocks'],
  range: { from: Date | null; to: Date | null } = { from: FROM, to: TO },
) {
  return render(
    <MockedProvider mocks={mocks}>
      <Provider>
        <HydrateAtoms range={range}>
          <MemoryRouter
            initialEntries={[`/operator/shelter/${SHELTER_ID}/report`]}
          >
            <Routes>
              <Route
                path="/operator/shelter/:shelterId/report"
                element={<ShelterReportPage />}
              />
            </Routes>
          </MemoryRouter>
        </HydrateAtoms>
      </Provider>
    </MockedProvider>,
  );
}

const exportButton = () => screen.getByRole('button', { name: /export pdf/i });

const HAPPY_MOCKS = [
  {
    request: summaryRequest,
    result: { data: { operatorShelter: SHELTER_SUMMARY } },
  },
  {
    request: metricsRequest,
    result: { data: { shelterOccupancyMetrics: METRICS } },
  },
];

describe('ShelterReportPage', () => {
  it('shows a loading message while the queries are in flight', () => {
    renderPage(HAPPY_MOCKS);

    expect(screen.getByText('Loading report…')).toBeTruthy();
  });

  it('disables the export button until both queries resolve', async () => {
    renderPage(HAPPY_MOCKS);

    expect(exportButton().hasAttribute('disabled')).toBe(true);

    await waitFor(() =>
      expect(screen.getByText('Downtown Emergency Shelter')).toBeTruthy(),
    );

    expect(exportButton().hasAttribute('disabled')).toBe(false);
  });

  it('renders the report once both queries resolve', async () => {
    renderPage(HAPPY_MOCKS);

    await waitFor(() =>
      expect(screen.getByText('Operational Summary')).toBeTruthy(),
    );

    expect(screen.getByText('Downtown Emergency Shelter')).toBeTruthy();
    expect(screen.queryByText('Loading report…')).toBeNull();
  });

  it('reports a failure instead of an empty report when the metrics query errors', async () => {
    renderPage([
      {
        request: summaryRequest,
        result: { data: { operatorShelter: SHELTER_SUMMARY } },
      },
      { request: metricsRequest, error: new Error('network down') },
    ]);

    await waitFor(() =>
      expect(
        screen.getByText('Failed to load the shelter report.'),
      ).toBeTruthy(),
    );

    expect(exportButton().hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText('Operational Summary')).toBeNull();
  });

  it('asks for a date range instead of rendering a blank report when none is set', async () => {
    renderPage(HAPPY_MOCKS, { from: null, to: null });

    await waitFor(() =>
      expect(
        screen.getByText('Select a date range to generate a report.'),
      ).toBeTruthy(),
    );

    expect(exportButton().hasAttribute('disabled')).toBe(true);
  });
});
