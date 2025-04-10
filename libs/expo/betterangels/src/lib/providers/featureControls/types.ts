import { FeatureFlags } from './constants';

export type TFeatureFlagKey = keyof typeof FeatureFlags;
export type TFeatureFlagValue = (typeof FeatureFlags)[TFeatureFlagKey];

export interface FeatureControlDictionary {
  [key: string]: { isActive: boolean; lastModified?: string | null };
}

export interface FeatureControlGroups {
  flags: FeatureControlDictionary;
  switches: FeatureControlDictionary;
  samples: FeatureControlDictionary;
}
