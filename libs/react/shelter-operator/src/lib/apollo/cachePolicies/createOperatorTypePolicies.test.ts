import { gql, InMemoryCache } from '@apollo/client';
import { createOperatorTypePolicies } from './createOperatorTypePolicies';

const ACTORS_QUERY = gql`
  query Actors($objectId: ID!) {
    objectAuditActors(objectId: $objectId) {
      __typename
      id
      label
      isSystem
    }
  }
`;

type ActorsResult = {
  objectAuditActors: Array<{
    __typename: 'AuditActorType';
    id: string | null;
    label: string;
    isSystem: boolean;
  }>;
};

type ActorsVariables = { objectId: string };

function write(cache: InMemoryCache, objectId: string, label: string) {
  cache.writeQuery<ActorsResult, ActorsVariables>({
    query: ACTORS_QUERY,
    variables: { objectId },
    data: {
      objectAuditActors: [
        {
          __typename: 'AuditActorType',
          id: 'user-1',
          label,
          isSystem: false,
        },
      ],
    },
  });
}

function read(cache: InMemoryCache, objectId: string) {
  return cache.readQuery<ActorsResult, ActorsVariables>({
    query: ACTORS_QUERY,
    variables: { objectId },
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
