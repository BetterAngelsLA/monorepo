import { PortableTextBlock } from '@portabletext/react';
import { TResource } from '../types';
import { toTTags } from './toTTag';

function toPortableTextBlocks(item: any): PortableTextBlock[] | null {
  if (!Array.isArray(item)) {
    return null;
  }

  if (!item.length) {
    return null;
  }

  return item as unknown as PortableTextBlock[];
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
    tags: toTTags(item.tags),
    usefulTipsLink: item.usefulTipsLink,
    resourceLink: item.resourceLink,
    shortDescription: toPortableTextBlocks(item.shortDescription),
    tipsDescription: toPortableTextBlocks(item.tipsDescription),
    priority: Number.isInteger(item.priority) ? item.priority : undefined,
  };
}
