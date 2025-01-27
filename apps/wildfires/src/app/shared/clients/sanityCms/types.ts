import { PortableTextBlock } from '@portabletext/react';

export type TResource = {
  title: string;
  slug: string;
  resourceType: 'resource' | 'alert';
  resourceLink?: string;
  tipsDescription?: PortableTextBlock | null;
  priority?: number;
  tags?: TTag[];
  shortDescription?: PortableTextBlock | null;
};

export type TTag = {
  slug: string;
  label: string;
  category?: TTagCategory;
};

export type TTagCategory = {
  name: string;
  slug: string;
  priority?: number;
};
