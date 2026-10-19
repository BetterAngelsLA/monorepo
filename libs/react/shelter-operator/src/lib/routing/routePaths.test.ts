import {
  paths,
  shelterReportRoute,
  shelterResourceActivityRoute,
} from './routePaths';

describe('shelterReportRoute', () => {
  it('builds the printable report path for a shelter', () => {
    expect(shelterReportRoute('5')).toBe('/operator/shelter/5/report');
  });

  it('substitutes the id rather than returning the pattern', () => {
    expect(shelterReportRoute('42')).toBe('/operator/shelter/42/report');
    expect(shelterReportRoute('42')).not.toContain(':shelterId');
  });

  it('stays in step with the route the app registers', () => {
    expect(paths.shelterReport).toBe('/operator/shelter/:shelterId/report');
  });
});

describe('shelterResourceActivityRoute', () => {
  it('builds the activity path for a bed', () => {
    expect(shelterResourceActivityRoute('5', 'bed', '12')).toBe(
      '/operator/shelter/5/manage/beds/12/activity',
    );
  });

  it('builds the activity path for a room', () => {
    expect(shelterResourceActivityRoute('5', 'room', '3')).toBe(
      '/operator/shelter/5/manage/rooms/3/activity',
    );
  });

  it('substitutes the id rather than returning the pattern', () => {
    expect(shelterResourceActivityRoute('42', 'bed', '7')).not.toContain(':id');
  });
});
