import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { ReservationMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { ShelterReportPrint, type ExportMetric } from './ShelterReportPrint';

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
  checkedIn: 8,
  checkInOverdueToCheckedIn: 1,
  cancelled: 7,
  checkInOverdue: 12,
};

const ALL_METRICS: ExportMetric[] = [
  'average-days-to-occupancy',
  'reservation-status-changes',
  'bed-status',
  'daily-occupancy',
];

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

function pageFooters() {
  return screen.getAllByText(/\d+ of \d+/).map((el) => el.textContent);
}

describe('ShelterReportPrint', () => {
  it('renders a single page with the Operational Summary header and stats when only stats are included', () => {
    render(
      <ShelterReportPrint
        {...baseProps([
          'average-days-to-occupancy',
          'reservation-status-changes',
        ])}
      />,
    );

    expect(screen.getByText('Operational Summary')).toBeTruthy();
    expect(
      screen.getByText(
        'Downtown Emergency Shelter [1234 S Main St, Los Angeles, CA 90015]',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Newly Checked In')).toBeTruthy();
    expect(screen.getByText('Avg. days to occupancy')).toBeTruthy();
    expect(screen.queryByTestId('bed-status-chart')).toBeNull();
    expect(screen.queryByTestId('daily-occupancy-chart')).toBeNull();
    expect(pageFooters()).toEqual(['1 of 1']);
  });

  it('puts Bed Status on page 1 and Daily Occupancy on its own page 2', () => {
    render(<ShelterReportPrint {...baseProps(ALL_METRICS)} />);

    expect(screen.getByTestId('bed-status-chart')).toBeTruthy();
    expect(screen.getByTestId('daily-occupancy-chart')).toBeTruthy();
    expect(pageFooters()).toEqual(['1 of 2', '2 of 2']);
  });

  it('uses a compact header (no "Operational Summary" title, no "Reporting Period" label) on page 2', () => {
    render(<ShelterReportPrint {...baseProps(ALL_METRICS)} />);

    expect(screen.getAllByText('Operational Summary')).toHaveLength(1);
    expect(screen.queryByText(/Reporting Period/)).toBeTruthy();

    // Page 2's header repeats the shelter name as its own heading.
    const nameOccurrences = screen.getAllByText('Downtown Emergency Shelter', {
      exact: false,
    });
    expect(nameOccurrences.length).toBeGreaterThanOrEqual(2);
  });

  it('collapses to a single page when only Bed Status is included', () => {
    render(<ShelterReportPrint {...baseProps(['bed-status'])} />);

    expect(screen.getByTestId('bed-status-chart')).toBeTruthy();
    expect(screen.queryByTestId('daily-occupancy-chart')).toBeNull();
    expect(pageFooters()).toEqual(['1 of 1']);
  });

  it('renders nothing when no metrics are included', () => {
    const { container } = render(<ShelterReportPrint {...baseProps([])} />);

    expect(
      container.querySelectorAll('[data-report-page="true"]'),
    ).toHaveLength(0);
  });

  it('shows the "Previously Overdue" pill when reservation-status-changes is included', () => {
    render(
      <ShelterReportPrint {...baseProps(['reservation-status-changes'])} />,
    );

    expect(screen.getByText('Previously Overdue')).toBeTruthy();
    expect(screen.getByText('1 / 8')).toBeTruthy();
  });

  it('shows a dash instead of a 0/0 ratio when nobody has checked in', () => {
    render(
      <ShelterReportPrint
        {...baseProps(['reservation-status-changes'])}
        metrics={{ ...METRICS, checkedIn: 0, checkInOverdueToCheckedIn: 0 }}
      />,
    );

    expect(screen.getByText('Previously Overdue')).toBeTruthy();
    expect(screen.queryByText('0 / 0')).toBeNull();
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('forwards its ref to the printable root', () => {
    const ref = createRef<HTMLDivElement>();

    render(<ShelterReportPrint {...baseProps(ALL_METRICS)} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(
      ref.current?.querySelectorAll('[data-report-page="true"]'),
    ).toHaveLength(2);
  });
});
