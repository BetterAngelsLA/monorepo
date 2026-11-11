import {
  legacyProfileRoutes,
  paths,
  profileRouteConfig,
  shelterReportRoute,
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

describe('legacyProfileRoutes', () => {
  it('keeps the retired operating-hours segment mapped to its replacement', () => {
    // Pinned by value: an empty list would satisfy any loop-based assertion, and
    // dropping this entry is exactly the regression the rename risks.
    expect(legacyProfileRoutes).toContainEqual({
      from: 'operating-hours',
      to: profileRouteConfig.children.schedule,
    });
  });

  it('declares a redirect target that is a live child, from a retired segment', () => {
    expect(legacyProfileRoutes.length).toBeGreaterThan(0);

    const current: string[] = Object.values(profileRouteConfig.children);

    for (const { from, to } of legacyProfileRoutes) {
      expect(current).toContain(to);
      // A retired segment that is still a live child would shadow the redirect.
      expect(current).not.toContain(from);
    }
  });
});
