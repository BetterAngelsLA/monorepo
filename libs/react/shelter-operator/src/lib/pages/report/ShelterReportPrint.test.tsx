import { render, within } from '@testing-library/react';
import { createRef } from 'react';
import type { ExportMetric } from '../../components/reports/useShelterMetricsExport';
import type { ReservationMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { ShelterReportPrint } from './ShelterReportPrint';

// @ant-design/plots needs real layout/canvas APIs jsdom doesn't reliably
// provide; this file is about section inclusion and pagination, not chart
// internals, so the chart components are stubbed to a recognizable marker.
vi.mock('../../components/reports/ReportCharts', () => ({
  BedStatusChart: () => <div data-testid="bed-status-chart" />,
  DailyOccupancyChart: () => <div data-testid="daily-occupancy-chart" />,
}));

const RANGE = { from: new Date(2026, 6, 1), to: new Date(2026, 6, 7) };
const GENERATED_AT = new Date(2026, 6, 8, 9, 30);

const METRICS: ReservationMetrics = {
  __typename: 'ReservationMetricsType',
  checkedIn: 8,
  checkInOverdueToCheckedIn: 1,
  cancelled: 7,
  checkInOverdue: 12,
};

const COUNTS = {
  total: 100,
  available: 20,
  occupied: 60,
  reserved: 5,
  inTurnaround: 10,
  outOfService: 5,
};

const ALL_METRICS: ExportMetric[] = [
  'avg_days_to_occupancy',
  'reservation_metrics',
  'daily_bed_status_metrics',
  'daily_occupancy_metrics',
];

// Realistic rendered heights (chart card ~610px, stat tray ~110px, counts card
// ~230px). jsdom has no layout, so without this every unit would measure 0 and
// the packing logic would never be exercised.
const UNIT_HEIGHTS = {
  chart: 610,
  counts: 230,
  stats: 110,
} as const;

function stubUnitHeights() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      const height = unitHeight(this);
      return {
        height,
        width: 720,
        top: 0,
        left: 0,
        right: 720,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    },
  );
}

/** Classifies a measured unit node by the markup it wraps. */
function unitHeight(node: HTMLElement): number {
  if (node.querySelector('[data-testid$="-chart"]')) return UNIT_HEIGHTS.chart;
  if (node.querySelector('h2')) return UNIT_HEIGHTS.counts;
  return UNIT_HEIGHTS.stats;
}

/** Only the real pages — the off-canvas measurement pass is not one. */
function reportPages(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[data-report-page="true"]'));
}

function baseProps(includedMetrics: ExportMetric[]) {
  return {
    shelterName: 'Downtown Emergency Shelter',
    shelterAddress: '1234 S Main St, Los Angeles, CA 90015',
    range: RANGE,
    generatedAt: GENERATED_AT,
    includedMetrics,
    metrics: METRICS,
    avgDaysToOccupancy: 10,
    dailyBedStatus: [],
    dailyOccupancy: [],
  };
}

function footers(): string[] {
  return reportPages().map(
    (page) =>
      within(page)
        .getAllByText(/\d+ of \d+/)
        .map((el) => el.textContent ?? '')[0] ?? '',
  );
}

/** True when any real page contains the given text. */
function pageHasText(text: string): boolean {
  return reportPages().some(
    (page) => within(page).queryAllByText(text).length > 0,
  );
}

function pagesWithTestId(testId: string): number {
  return reportPages().filter((page) => within(page).queryByTestId(testId))
    .length;
}

beforeEach(() => {
  stubUnitHeights();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ShelterReportPrint', () => {
  it('renders a single page with the Operational Summary header and stats when only stats are included', () => {
    render(
      <ShelterReportPrint
        {...baseProps(['avg_days_to_occupancy', 'reservation_metrics'])}
      />,
    );

    expect(reportPages()).toHaveLength(1);
    expect(pageHasText('Operational Summary')).toBe(true);
    expect(
      pageHasText(
        'Downtown Emergency Shelter [1234 S Main St, Los Angeles, CA 90015]',
      ),
    ).toBe(true);
    expect(pageHasText('Newly Checked In')).toBe(true);
    expect(pageHasText('Avg. days to occupancy')).toBe(true);
    expect(pagesWithTestId('bed-status-chart')).toBe(0);
    expect(pagesWithTestId('daily-occupancy-chart')).toBe(0);
    expect(footers()).toEqual(['1 of 1']);
  });

  it('gives each chart its own page rather than letting one overflow the page box', () => {
    render(<ShelterReportPrint {...baseProps(ALL_METRICS)} />);

    // Two 610px chart cards cannot share an 864px content box.
    expect(reportPages().length).toBeGreaterThanOrEqual(2);
    expect(pagesWithTestId('bed-status-chart')).toBe(1);
    expect(pagesWithTestId('daily-occupancy-chart')).toBe(1);
  });

  it('never puts more content on a page than the page box can hold', () => {
    render(
      <ShelterReportPrint
        {...baseProps(ALL_METRICS)}
        bedCounts={COUNTS}
        roomCounts={COUNTS}
      />,
    );

    // Every unit that was built must land inside exactly one page: nothing is
    // dropped by an overflowing box.
    const placed = reportPages().flatMap((page) =>
      Array.from(page.querySelectorAll('[data-report-unit-in-page]')),
    );
    const keys = placed.map((el) =>
      el.getAttribute('data-report-unit-in-page'),
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      expect.arrayContaining(['stats', 'bed-status', 'daily-occupancy']),
    );
  });

  it('uses a compact header (no "Operational Summary" title) on later pages', () => {
    render(<ShelterReportPrint {...baseProps(ALL_METRICS)} />);

    const pagesWithTitle = reportPages().filter(
      (page) => within(page).queryAllByText('Operational Summary').length > 0,
    );
    expect(pagesWithTitle).toHaveLength(1);
    expect(pageHasText('Reporting Period')).toBe(true);
  });

  it('collapses to a single page when only Bed Status is included', () => {
    render(<ShelterReportPrint {...baseProps(['daily_bed_status_metrics'])} />);

    expect(reportPages()).toHaveLength(1);
    expect(pagesWithTestId('bed-status-chart')).toBe(1);
    expect(pagesWithTestId('daily-occupancy-chart')).toBe(0);
    expect(footers()).toEqual(['1 of 1']);
  });

  it('moves Daily Occupancy up to page 1 when Bed Status is not included', () => {
    render(
      <ShelterReportPrint
        {...baseProps(['reservation_metrics', 'daily_occupancy_metrics'])}
      />,
    );

    expect(pagesWithTestId('bed-status-chart')).toBe(0);
    expect(pagesWithTestId('daily-occupancy-chart')).toBe(1);
    expect(footers()).toEqual(['1 of 1']);
  });

  it('renders nothing when no metrics are included', () => {
    render(<ShelterReportPrint {...baseProps([])} />);

    expect(reportPages()).toHaveLength(0);
  });

  it('shows the "Previously Overdue" pill when reservation_metrics is included', () => {
    render(<ShelterReportPrint {...baseProps(['reservation_metrics'])} />);

    expect(pageHasText('Previously Overdue')).toBe(true);
    expect(pageHasText('1 / 8')).toBe(true);
  });

  it('shows a dash instead of a 0/0 ratio when nobody has checked in', () => {
    render(
      <ShelterReportPrint
        {...baseProps(['reservation_metrics'])}
        metrics={{ ...METRICS, checkedIn: 0, checkInOverdueToCheckedIn: 0 }}
      />,
    );

    expect(pageHasText('Previously Overdue')).toBe(true);
    expect(pageHasText('0 / 0')).toBe(false);
    expect(pageHasText('—')).toBe(true);
  });

  it('forwards its ref to the printable root', () => {
    const ref = createRef<HTMLDivElement>();

    render(<ShelterReportPrint {...baseProps(ALL_METRICS)} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(
      ref.current?.querySelectorAll('[data-report-page="true"]').length,
    ).toBe(2);
  });

  describe('bed and room counts', () => {
    it('prints Bed Summary and Room Summary when counts are provided', () => {
      render(
        <ShelterReportPrint
          {...baseProps(['reservation_metrics'])}
          bedCounts={COUNTS}
          roomCounts={COUNTS}
          organizationName="Better Angels"
        />,
      );

      expect(pageHasText('Bed Summary')).toBe(true);
      expect(pageHasText('Room Summary')).toBe(true);
      expect(pageHasText('Total')).toBe(true);
      expect(pageHasText('Organization: Better Angels')).toBe(true);
    });

    it('omits the counts sections when no counts are provided', () => {
      render(<ShelterReportPrint {...baseProps(['reservation_metrics'])} />);

      expect(pageHasText('Bed Summary')).toBe(false);
      expect(pageHasText('Room Summary')).toBe(false);
    });

    it('starts the counts sections at heading level 2 for a valid heading order', () => {
      render(
        <ShelterReportPrint
          {...baseProps(['reservation_metrics'])}
          bedCounts={COUNTS}
        />,
      );

      const heading = reportPages()
        .flatMap((page) => Array.from(page.querySelectorAll('h2')))
        .find((el) => el.textContent === 'Bed Summary');
      expect(heading).toBeTruthy();
    });
  });

  describe('overflow handling', () => {
    it('adds pages instead of clipping when the content is taller than one page', () => {
      render(
        <ShelterReportPrint
          {...baseProps(ALL_METRICS)}
          bedCounts={COUNTS}
          roomCounts={COUNTS}
        />,
      );

      // counts(230) + stats(110) + 2 charts(610 each) over an 864px box.
      expect(reportPages().length).toBeGreaterThanOrEqual(3);
    });

    it('keeps the page count announced in the footer in step with the pages rendered', () => {
      render(
        <ShelterReportPrint
          {...baseProps(ALL_METRICS)}
          bedCounts={COUNTS}
          roomCounts={COUNTS}
        />,
      );

      const pages = reportPages().length;
      const announced = footers();
      expect(announced).toHaveLength(pages);
      expect(announced[0]).toBe(`1 of ${pages}`);
      expect(announced[pages - 1]).toBe(`${pages} of ${pages}`);
    });
  });
});
