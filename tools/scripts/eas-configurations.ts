/**
 * What each Nx configuration means to EAS.
 *
 * The names appear in `nx.json` (the `eas-build` configurations), in the Maestro
 * orchestration and in the preview build step, so they live here once:
 *
 * - `device`: the profile a device/emulator build uses, per platform.
 * - `simulatorProfile`: previews also ship an iOS simulator binary, and Maestro
 *   drives it — the only build a simulator can install.
 * - `appId`/`scheme`: what the installed binary exposes, mirroring
 *   `BUNDLE_IDENTIFIER` and `scheme` in `app.config.js` (driven by `APP_VARIANT`).
 */
export interface EasConfiguration {
  appId: string;
  scheme: string;
  device: { android: string; ios: string };
  simulatorProfile?: string;
}

export const EAS_CONFIGURATIONS: Record<string, EasConfiguration> = {
  preview: {
    appId: 'la.betterangels.dev.app',
    scheme: 'betterangels-dev',
    device: { android: 'preview', ios: 'preview' },
    simulatorProfile: 'development-simulator',
  },
  production: {
    appId: 'la.betterangels.app',
    scheme: 'betterangels',
    device: { android: 'production', ios: 'production' },
  },
};

export function easConfiguration(configuration: string): EasConfiguration {
  const found = EAS_CONFIGURATIONS[configuration];
  if (!found) {
    throw new Error(
      `Unsupported configuration "${configuration}". Add it to EAS_CONFIGURATIONS in tools/scripts/eas-configurations.ts.`,
    );
  }
  return found;
}
