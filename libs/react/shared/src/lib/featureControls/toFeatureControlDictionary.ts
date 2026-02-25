import { FeatureControlDictionary } from './types';

type FeatureControlItem = {
  name: string;
  isActive?: boolean | null;
  lastModified?: any | null;
};

export const toFeatureControlDictionary = (
  items: FeatureControlItem[]
): FeatureControlDictionary =>
  items.reduce((acc, item) => {
    acc[item.name] = {
      isActive: item.isActive ?? false,
      lastModified: item.lastModified ?? null,
    };
    return acc;
  }, {} as FeatureControlDictionary);
