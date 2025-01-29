import { PortableTextBlock } from '@portabletext/react';
import { TResource } from '../types';
import { toTTags } from './toTTag';

function toPortableTextBlock(block: any): PortableTextBlock[] | null {
  if (!Array.isArray(block)) {
    return null;
  }

  if (!block.length) {
    return null;
  }

  return block as unknown as PortableTextBlock[];
}

export function toTResources(items: any): TResource[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const resources = items.map((r) => toTResource(r)).filter((r) => !!r);

  return resources as TResource[];
}

export function toTResource(item: any): TResource | null {
  if (!item?.title) {
    return null;
  }

  return {
    title: item.title,
    slug: item.slug,
    resourceType: item.resourceType,
    resourceLink: item.resourceLink,
    usefulTipsLink: item.usefulTipsLink,
    tipsDescription: toPortableTextBlock(item.tipsDescription),
    shortDescription: toPortableTextBlock(item.shortDescription),
    priority: Number.isInteger(item.priority) ? item.priority : undefined,
    tags: toTTags(item.tags),
  };
}
