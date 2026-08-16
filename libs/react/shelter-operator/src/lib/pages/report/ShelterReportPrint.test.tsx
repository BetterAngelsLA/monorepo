import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { ShelterReportPrint } from './ShelterReportPrint';
import type { ShelterReportData } from './types';

function makeReport(
  overrides: Partial<ShelterReportData> = {}
): ShelterReportData {
  return {
    id: '1',
    name: 'Downtown Emergency Shelter',
    organization: { id: '1', name: 'Test Organization' },
    location: { place: '1234 S Main St, Los Angeles, CA 90015' },
    bedCounts: {
      total: 185,
      available: 42,
      occupied: 118,
      reserved: 13,
      inTurnaround: 7,
      outOfService: 5,
    },
    roomCounts: {
      total: 47,
      available: 9,
      occupied: 31,
      reserved: 4,
      inTurnaround: 2,
      outOfService: 1,
    },
    ...overrides,
  } as ShelterReportData;
}

/** Reads a section's label/value pairs in render order. */
function rowsOf(title: string): Array<[string, string]> {
  const heading = screen.getByRole('heading', { name: title });
  const section = heading.closest('section');
  if (!section) throw new Error(`no section for "${title}"`);

  return [...section.querySelectorAll('div.justify-between')].map((row) => {
    const [label, value] = [...row.querySelectorAll('span')];
    return [label.textContent ?? '', value.textContent ?? ''];
  });
}

describe('ShelterReportPrint', () => {
  it('titles the report with the shelter name', () => {
    render(<ShelterReportPrint data={makeReport()} />);

    expect(
      within(screen.getByRole('banner')).getByText('Downtown Emergency Shelter')
    ).toBeTruthy();
  });

  it('renders the shelter summary', () => {
    render(<ShelterReportPrint data={makeReport()} />);

    expect(rowsOf('Shelter Summary')).toEqual([
      ['Name', 'Downtown Emergency Shelter'],
      ['Organization', 'Test Organization'],
      ['Address', '1234 S Main St, Los Angeles, CA 90015'],
    ]);
  });

  it('renders bed counts in a fixed order', () => {
    render(<ShelterReportPrint data={makeReport()} />);

    expect(rowsOf('Bed Summary')).toEqual([
      ['Total', '185'],
      ['Available', '42'],
      ['Occupied', '118'],
      ['Reserved', '13'],
      ['In Turnaround', '7'],
      ['Out of Service', '5'],
    ]);
  });

  it('renders room counts from the room totals, not the bed totals', () => {
    render(<ShelterReportPrint data={makeReport()} />);

    expect(rowsOf('Room Summary')).toEqual([
      ['Total', '47'],
      ['Available', '9'],
      ['Occupied', '31'],
      ['Reserved', '4'],
      ['In Turnaround', '2'],
      ['Out of Service', '1'],
    ]);
  });

  it('renders zero counts rather than blanks', () => {
    const zeroed = makeReport({
      bedCounts: {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        inTurnaround: 0,
        outOfService: 0,
      } as ShelterReportData['bedCounts'],
    });

    render(<ShelterReportPrint data={zeroed} />);

    expect(rowsOf('Bed Summary').map(([, value]) => value)).toEqual([
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
    ]);
  });

  // organization and location are both nullable on the query.
  it('falls back to an em dash when the organization is missing', () => {
    render(<ShelterReportPrint data={makeReport({ organization: null })} />);

    expect(rowsOf('Shelter Summary')).toContainEqual(['Organization', '—']);
  });

  it('falls back to an em dash when the location is missing', () => {
    render(<ShelterReportPrint data={makeReport({ location: null })} />);

    expect(rowsOf('Shelter Summary')).toContainEqual(['Address', '—']);
  });

  // useExportPdf captures whatever this ref points at, so the wiring matters.
  it('forwards its ref to the printable root', () => {
    const ref = createRef<HTMLDivElement>();

    render(<ShelterReportPrint data={makeReport()} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.classList.contains('shelter-report-print')).toBe(true);
  });
});
