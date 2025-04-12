export const FeatureFlags = {
  PROFILE_REDESIGN_FF: 'ffClientProfileRedesign',
  CLIENT_DEDUPE_FF: 'ffClientDedupe',
  APP_UPDATE_PROMPT_FF: 'ffAppUpdatePrompt',
} as const;

export type TFeatureFlagKey = keyof typeof FeatureFlags;
export type TFeatureFlagValue = (typeof FeatureFlags)[TFeatureFlagKey];
