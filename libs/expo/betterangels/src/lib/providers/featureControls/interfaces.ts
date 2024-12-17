// Define a dictionary type for easier access
export interface FeatureControlDictionary {
  [key: string]: { isActive: boolean; lastModified?: string | null };
}

export interface FeatureControlGroups {
  flags: FeatureControlDictionary;
  switches: FeatureControlDictionary;
  samples: FeatureControlDictionary;
}
