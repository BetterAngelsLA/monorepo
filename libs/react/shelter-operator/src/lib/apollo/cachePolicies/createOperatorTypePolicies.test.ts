import { InMemoryCache } from '@apollo/client';
import { AuditTargetType } from '@monorepo/ba-platform/types';
import {
  AuditActorsDocument,
  type AuditActorsQuery,
  type AuditActorsQueryVariables,
} from '../../hooks/useAuditActors/__generated__/useAuditActors.generated';
import { createOperatorTypePolicies } from './createOperatorTypePolicies';

/**
 * The real actor query, so this test doubles as a valid document for codegen:
 * an inline `gql` tag here would be scanned and validated against the schema.
 */
function variables(objectId: string): AuditActorsQueryVariables {
  return {
    targetType: AuditTargetType.Shelter,
    objectId,
    search: 'ad',
    limit: 20,
  };
}

function write(cache: InMemoryCache, objectId: string, label: string) {
  const data: AuditActorsQuery = {
    __typename: 'Query',
    objectAuditActors: [
      {
        __typename: 'AuditActorType',
        id: 'user-1',
        label,
        isSystem: false,
      },
    ],
  };

  cache.writeQuery<AuditActorsQuery, AuditActorsQueryVariables>({
    query: AuditActorsDocument,
    variables: variables(objectId),
    data,
  });
}

function read(cache: InMemoryCache, objectId: string) {
  return cache.readQuery<AuditActorsQuery, AuditActorsQueryVariables>({
    query: AuditActorsDocument,
    variables: variables(objectId),
  });
}

describe('createOperatorTypePolicies', () => {
  it("keeps one object's actor label from overwriting another object's", () => {
    const cache = new InMemoryCache({
      typePolicies: createOperatorTypePolicies(),
    });

    // One user, renamed between their writes to two different logs: the label
    // is per object, so the two must not share a cache entry.
    write(cache, 'shelter-1', 'Ada Lovelace');
    write(cache, 'shelter-2', 'Ada King');

    expect(read(cache, 'shelter-1')?.objectAuditActors[0]?.label).toBe(
      'Ada Lovelace',
    );
    expect(read(cache, 'shelter-2')?.objectAuditActors[0]?.label).toBe(
      'Ada King',
    );
  });
});
