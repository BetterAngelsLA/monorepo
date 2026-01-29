export interface FeatureControlDictionary {
  [key: string]: { isActive: boolean; lastModified?: string | null };
}

export interface FeatureControlGroups {
  flags: FeatureControlDictionary;
  switches: FeatureControlDictionary;
  samples: FeatureControlDictionary;
}

export type FeatureControlItem = {
  name: string;
  isActive?: boolean | null;
  lastModified?: string | null;
};

export type FeatureControlsQuery = {
  featureControls?: {
    flags: FeatureControlItem[];
    switches: FeatureControlItem[];
    samples: FeatureControlItem[];
  } | null;
};
