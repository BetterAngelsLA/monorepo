import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { dateRangeFilterAtom } from '../date-range-filter';
import { ReportFilterBar } from './ReportFilterBar';

const fetchMock = vi.fn();
const showToast = vi.fn();

vi.mock('@monorepo/react/shelter', () => ({
  useApiConfig: () => ({ fetch: fetchMock }),
}));

vi.mock('../base-ui/toast', () => ({
  useToast: () => ({ showToast }),
}));

// The atom defaults to LAST_30_DAYS off the real clock; pin it so the
// start/end params are predictable. The bar now renders the real date
// controls, which read and write this atom, so seed the store rather than
// mocking jotai out from under them.
const store = getDefaultStore();

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

function openModalAndExport() {
  fireEvent.click(screen.getByRole('button', { name: /export data/i }));
  fireEvent.click(screen.getByRole('button', { name: /^export$/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  store.set(dateRangeFilterAtom, {
    preset: 'LAST_30_DAYS',
    range: { from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) },
  });
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

    render(<ReportFilterBar shelterId="7" />);
    openModalAndExport();

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

    render(<ReportFilterBar shelterId="7" />);
    fireEvent.click(screen.getByRole('button', { name: /export data/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /bed status/i }));
    fireEvent.click(screen.getByRole('button', { name: /^export$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const url = new URL(fetchMock.mock.calls[0][0], 'https://example.test');

    expect(url.searchParams.getAll('include')).not.toContain(
      'daily_bed_status_metrics',
    );
  });

  it('names the download from the Content-Disposition the server sent', async () => {
    fetchMock.mockResolvedValue(exportResponse());

    render(<ReportFilterBar shelterId="7" />);
    openModalAndExport();

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

    render(<ReportFilterBar shelterId="7" />);
    openModalAndExport();

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
    render(<ReportFilterBar />);

    const button = screen.getByRole('button', { name: /export data/i });

    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
