export const FeatureFlags = {
  PROFILE_REDESIGN_FF: 'ffClientProfileRedesign',
  CLIENT_DEDUPE_FF: 'ffClientDedupe',
  APP_UPDATE_PROMPT_FF: 'ffAppUpdatePrompt',
  SHOW_DEBUG_INFO_FF: 'ffShowDebugInfo',
} as const;

export type TFeatureFlagKey = keyof typeof FeatureFlags;
export type TFeatureFlagValue = (typeof FeatureFlags)[TFeatureFlagKey];
