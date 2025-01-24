import { PortableTextBlock } from '@portabletext/react';

export type TResource = {
  title: string;
  slug: string;
  resourceType: string;
  resourceLink?: string;
  priority?: number;
  tags?: string[];
  description?: PortableTextBlock;
  shortDescription?: PortableTextBlock;
};
