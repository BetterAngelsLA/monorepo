import { mgmtResources, paths, routePath } from './routePaths';

describe('retired printable-report URL', () => {
  // The standalone /report page was folded into the Reports tab's export
  // modal. Because its URL was shareable, the pattern is kept (and registered
  // as a redirect in OperatorApp) so existing bookmarks keep working — this
  // pins the exact string so a rename can't silently break them.
  it('keeps the legacy pattern byte-for-byte identical to the old route', () => {
    expect(paths.shelterReportLegacy).toBe(
      '/operator/shelter/:shelterId/report',
    );
  });

  it('does not collide with the still-live printable routes', () => {
    expect(paths.shelterReportLegacy).not.toBe(paths.shelter);
    expect(paths.shelterReportLegacy).not.toBe(paths.shelterCreate);
  });

  it('is registerable as a child route of the operator layout', () => {
    // React Router matches relative to the parent route, so the registered
    // pattern must not still carry the /operator base.
    expect(routePath(paths.shelterReportLegacy)).toBe(
      'shelter/:shelterId/report',
    );
  });

  it('redirects targets resolve to the Reports tab, not a dead end', () => {
    expect(mgmtResources.report.path).toBe('reports');
  });
});
