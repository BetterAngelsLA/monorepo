import { FeatureFlag } from './constants';

export type TFeatureFlagKey = keyof typeof FeatureFlag;
export type TFeatureFlagValue = (typeof FeatureFlag)[TFeatureFlagKey];

export type TFeatureData = {
  isActive: boolean;
  lastModified?: Date;
};

export type TControlInput = {
  name: string;
  isActive?: boolean | null;
  lastModified?: Date;
};

export type TFeatureControls = Record<TFeatureFlagValue, TFeatureData>;

export type TFeatureControlGroup = {
  flags: TFeatureControls | {};
  switches: TFeatureControls | {};
  samples: TFeatureControls | {};
};

export type TFeatureControlMapKey = 'flags' | 'samples' | 'switches';

export type TFeatureControlMap = Record<TFeatureControlMapKey, TFeatureData>;
