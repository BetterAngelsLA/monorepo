import type { TypePolicies } from '@apollo/client';
import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { PaginationModeEnum } from '../../cachePolicy';
import { createApolloCache } from '../createApolloCache';
import { getQueryPolicyConfigFromCache } from './queryPolicyConfigRegistry';

const config = {
  paginationMode: PaginationModeEnum.Offset,
  itemsPath: ['results'],
  totalCountPath: ['totalCount'],
  paginationOffsetPath: ['pagination', 'offset'],
  paginationLimitPath: ['pagination', 'limit'],
} as const;

const typePolicies = {
  Query: {
    fields: {
      tasks: { __queryPolicyConfig: config },
    },
  },
} as unknown as TypePolicies;

describe('queryPolicyConfigRegistry', () => {
  it('returns configs registered via createApolloCache', () => {
    const cache = createApolloCache({ typePolicies });

    expect(getQueryPolicyConfigFromCache(cache, 'tasks')).toEqual(config);
  });

  it('returns undefined for a cache created without createApolloCache', () => {
    const cache = new InMemoryCache();

    expect(getQueryPolicyConfigFromCache(cache, 'tasks')).toBeUndefined();
  });

  it('returns undefined for a field without a config', () => {
    const cache = createApolloCache({ typePolicies });

    expect(getQueryPolicyConfigFromCache(cache, 'notes')).toBeUndefined();
  });
});
