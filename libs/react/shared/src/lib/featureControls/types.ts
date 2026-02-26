export type FeatureControlDictionary = {
  [key: string]: { isActive: boolean; lastModified?: string | null };
};

export interface FeatureControlGroups {
  flags: FeatureControlDictionary;
  switches: FeatureControlDictionary;
  samples: FeatureControlDictionary;
}
