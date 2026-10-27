export function previewDeployedApps(
  env?: Record<string, string | undefined>,
): string[];
export function e2eBaseUrl(
  app: string,
  options?: { env?: Record<string, string | undefined> },
): string | undefined;
