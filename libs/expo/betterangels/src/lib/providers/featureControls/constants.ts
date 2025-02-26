export const FeatureFlags = {
  PROFILE_REDESIGN_FF: 'ffClientProfileRedesign',
} as const;

export type TFeatureFlagKey = keyof typeof FeatureFlags;
export type TFeatureFlagValue = (typeof FeatureFlags)[TFeatureFlagKey];
