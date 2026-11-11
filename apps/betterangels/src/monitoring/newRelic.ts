// Metro selects newRelic.web.ts for browser builds. Native uses useNewRelic.
export function initMonitoring(): void {
  // Native uses useNewRelic; keep the shared bootstrap import uniform.
  return;
}
