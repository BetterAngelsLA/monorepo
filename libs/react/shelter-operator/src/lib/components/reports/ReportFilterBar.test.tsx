import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OperatorShelterSummaryDocument } from '../../graphql/__generated__/shelters.generated';
import { ShelterOccupancyMetricsDocument } from '../../hooks/useShelterOccupancyMetrics/__generated__/useShelterOccupancyMetrics.generated';
import { ReportFilterBar } from './ReportFilterBar';

const fetchMock = vi.fn();
const showToast = vi.fn();
const exportPdfMock = vi.fn();

const SHELTER_ID = '7';

// ReportFilterBar always queries the shelter summary + occupancy metrics for
// the off-screen PDF render target (see handlePdfExport) once the modal is
// open, and disables Export until both resolve — see the "disables Export"
// tests below. The CSV/XLSX/JSON tests need these to resolve too, since they
// share the same Export button.
function pdfDataMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: OperatorShelterSummaryDocument,
        variables: { id: SHELTER_ID },
      },
      result: {
        data: {
          operatorShelter: {
            id: SHELTER_ID,
            name: 'Downtown Emergency Shelter',
            // The summary query also feeds the PDF's Bed/Room Summary
            // sections, so the mock must carry every field the real response
            // has or Apollo warns that the selection went unanswered.
            organization: { id: 'org-1', name: 'Better Angels' },
            location: { place: '1234 S Main St' },
            bedCounts: {
              available: 20,
              inTurnaround: 10,
              occupied: 60,
              outOfService: 5,
              reserved: 5,
              total: 100,
            },
            roomCounts: {
              available: 10,
              inTurnaround: 4,
              occupied: 30,
              outOfService: 2,
              reserved: 2,
              total: 48,
            },
          },
        },
      },
    },
    {
      request: {
        query: ShelterOccupancyMetricsDocument,
        variables: {
          shelterId: SHELTER_ID,
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        },
      },
      result: {
        data: {
          shelterOccupancyMetrics: {
            shelterId: SHELTER_ID,
            startDate: '2026-06-01',
            endDate: '2026-06-30',
            avgDaysToOccupancy: 10,
            dailyOccupancy: [],
            dailyBedStatus: [],
            reservationMetrics: {
              checkInOverdue: 0,
              cancelled: 0,
              checkedIn: 0,
              checkInOverdueToCheckedIn: 0,
            },
          },
        },
      },
    },
  ];
}

function renderFilterBar(
  shelterId?: string,
  mocks: MockLink.MockedResponse[] = pdfDataMocks(),
) {
  return render(
    <MockedProvider mocks={mocks}>
      <ReportFilterBar shelterId={shelterId} />
    </MockedProvider>,
  );
}

vi.mock('@monorepo/react/shelter', () => ({
  useApiConfig: () => ({ fetch: fetchMock }),
}));

vi.mock('../base-ui/toast', () => ({
  useToast: () => ({ showToast }),
}));

// PDF is captured client-side rather than through the fetch/export endpoint
// the other formats hit — see useExportPdf.test.ts for its own coverage.
vi.mock('../../pages/report/useExportPdf', () => ({
  useExportPdf: () => ({ exportPdf: exportPdfMock, isExporting: false }),
}));

// The atom defaults to LAST_30_DAYS off the real clock; pin it so the
// start/end params are predictable.
vi.mock('jotai', () => ({
  useAtomValue: () => ({
    preset: 'LAST_30_DAYS',
    range: { from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) },
  }),
}));

// @ant-design/plots needs real layout/canvas APIs jsdom doesn't reliably
// provide; the off-screen PDF render's chart content is covered in
// ShelterReportPrint.test.tsx, not here.
vi.mock('./ReportCharts', () => ({
  BedStatusChart: () => <div data-testid="bed-status-chart" />,
  DailyOccupancyChart: () => <div data-testid="daily-occupancy-chart" />,
}));

function exportResponse(filename = '20260601_20260630_shelter_report.zip') {
  return {
    ok: true,
    blob: async () => new Blob(['data']),
    headers: {
      get: (header: string) =>
        header === 'Content-Disposition'
          ? `attachment; filename="${filename}"`
          : null,
    },
  };
}

async function openModalAndExport() {
  fireEvent.click(screen.getByRole('button', { name: /export data/i }));
  await waitForExportEnabled();
  fireEvent.click(screen.getByRole('button', { name: /^export$/i }));
}

// Export is disabled until the off-screen PDF render's queries resolve (see
// isPdfDataUnavailable in ReportFilterBar) — every test that submits the
// modal has to wait this out first, even the CSV/XLSX/JSON ones, since they
// share the same button.
function waitForExportEnabled() {
  return waitFor(() => {
    const button = screen.getByRole('button', {
      name: /^export$/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
}

/**
 * The PDF option stays disabled until its own queries land, which can trail
 * the shared Export button by a tick.
 */
function waitForPdfSelectable() {
  return waitFor(() => {
    const pdf = screen.getByRole('radio', {
      name: /^pdf$/i,
    }) as HTMLButtonElement;
    expect(pdf.disabled).toBe(false);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => 'blob:report');
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();

  // jsdom implements neither <dialog> nor ResizeObserver, both of which the
  // real Modal reaches for. Rendering the actual modal is the point of these
  // tests, so shim them rather than stubbing the component out.
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
});

describe('ReportFilterBar export', () => {
  it('requests the shelter export for the filtered range and every metric', async () => {
    fetchMock.mockResolvedValue(exportResponse());

    renderFilterBar('7');
    await openModalAndExport();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const url = new URL(fetchMock.mock.calls[0][0], 'https://example.test');

    expect(url.pathname).toBe('/shelters/7/export/');
    expect(url.searchParams.get('export_format')).toBe('csv');
    expect(url.searchParams.get('start_date')).toBe('2026-06-01');
    expect(url.searchParams.get('end_date')).toBe('2026-06-30');
    expect(url.searchParams.getAll('include')).toEqual([
      'daily_occupancy_metrics',
      'daily_bed_status_metrics',
      'reservation_metrics',
      'avg_days_to_occupancy',
    ]);
  });

  it('sends only the metrics left checked', async () => {
    fetchMock.mockResolvedValue(exportResponse());

    renderFilterBar('7');
    fireEvent.click(screen.getByRole('button', { name: /export data/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /bed status/i }));
    await waitForExportEnabled();
    fireEvent.click(screen.getByRole('button', { name: /^export$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const url = new URL(fetchMock.mock.calls[0][0], 'https://example.test');

    expect(url.searchParams.getAll('include')).not.toContain(
      'daily_bed_status_metrics',
    );
  });

  it('names the download from the Content-Disposition the server sent', async () => {
    fetchMock.mockResolvedValue(exportResponse());

    renderFilterBar('7');
    await openModalAndExport();

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          description: '20260601_20260630_shelter_report.zip',
        }),
      ),
    );
  });

  it('reports a failed export instead of downloading', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    renderFilterBar('7');
    await openModalAndExport();

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          description: 'The server returned 403.',
        }),
      ),
    );
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it('cannot export before the shelter is known', () => {
    renderFilterBar();

    const button = screen.getByRole('button', { name: /export data/i });

    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('captures and downloads a PDF instead of hitting the export endpoint when PDF is selected', async () => {
    exportPdfMock.mockResolvedValue({
      blob: new Blob(['pdf']),
      filename: 'shelter-7-report.pdf',
    });

    renderFilterBar('7');
    fireEvent.click(screen.getByRole('button', { name: /export data/i }));
    // The PDF radio is disabled until its own data lands, so wait first.
    await waitForPdfSelectable();
    fireEvent.click(screen.getByRole('radio', { name: /^pdf$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^export$/i }));

    await waitFor(() => expect(exportPdfMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        description: 'shelter-7-report.pdf',
      }),
    );
  });

  it('reports a failed PDF generation instead of downloading', async () => {
    exportPdfMock.mockRejectedValue(new Error('canvas exploded'));

    renderFilterBar('7');
    fireEvent.click(screen.getByRole('button', { name: /export data/i }));
    await waitForPdfSelectable();
    fireEvent.click(screen.getByRole('radio', { name: /^pdf$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^export$/i }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          description: 'canvas exploded',
        }),
      ),
    );
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it('keeps CSV export available while the PDF render data is still loading', () => {
    // A pending mock (no `result`) simulates the query never resolving
    // within the test, so isPdfDataUnavailable stays true throughout.
    renderFilterBar('7', [
      {
        request: {
          query: OperatorShelterSummaryDocument,
          variables: { id: SHELTER_ID },
        },
        delay: Infinity,
      },
      {
        request: {
          query: ShelterOccupancyMetricsDocument,
          variables: {
            shelterId: SHELTER_ID,
            startDate: '2026-06-01',
            endDate: '2026-06-30',
          },
        },
        delay: Infinity,
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /export data/i }));

    // Only PDF depends on those queries, so the default (CSV) stays usable.
    const button = screen.getByRole('button', {
      name: /^export$/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    // The PDF option itself advertises that it is not ready, and cannot be
    // selected — so the user is never stranded on a dead format.
    const pdf = screen.getByRole('radio', {
      name: /^pdf$/i,
    }) as HTMLButtonElement;
    expect(pdf.disabled).toBe(true);
    fireEvent.click(pdf);
    expect(pdf.getAttribute('aria-checked')).toBe('false');
    expect(button.disabled).toBe(false);
  });

  it('keeps CSV export available when the PDF render data fails to load', async () => {
    renderFilterBar('7', [
      {
        request: {
          query: OperatorShelterSummaryDocument,
          variables: { id: SHELTER_ID },
        },
        error: new Error('network error'),
      },
      {
        request: {
          query: ShelterOccupancyMetricsDocument,
          variables: {
            shelterId: SHELTER_ID,
            startDate: '2026-06-01',
            endDate: '2026-06-30',
          },
        },
        result: {
          data: {
            shelterOccupancyMetrics: {
              shelterId: SHELTER_ID,
              startDate: '2026-06-01',
              endDate: '2026-06-30',
              avgDaysToOccupancy: 10,
              dailyOccupancy: [],
              dailyBedStatus: [],
              reservationMetrics: {
                checkInOverdue: 0,
                cancelled: 0,
                checkedIn: 0,
                checkInOverdueToCheckedIn: 0,
              },
            },
          },
        },
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /export data/i }));

    await waitFor(() => {
      const button = screen.getByRole('button', {
        name: /^export$/i,
      }) as HTMLButtonElement;
      // CSV is unaffected by the failed PDF queries...
      expect(button.disabled).toBe(false);
    });

    // ...but PDF is blocked, and cannot be selected.
    const pdf = screen.getByRole('radio', {
      name: /^pdf$/i,
    }) as HTMLButtonElement;
    expect(pdf.disabled).toBe(true);
    fireEvent.click(pdf);
    expect(pdf.getAttribute('aria-checked')).toBe('false');
    expect(
      (
        screen.getByRole('button', {
          name: /^export$/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
});
