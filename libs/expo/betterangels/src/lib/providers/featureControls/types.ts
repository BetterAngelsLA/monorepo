import { FeatureFlags } from './constants';

export type TFeatureFlagKey = keyof typeof FeatureFlags;
export type TFeatureFlagValue = (typeof FeatureFlags)[TFeatureFlagKey];
