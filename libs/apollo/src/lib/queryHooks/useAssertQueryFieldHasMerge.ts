import { InMemoryCache, useApolloClient } from '@apollo/client';
import { useMemo } from 'react';
import { assertQueryFieldHasMerge } from '../cachePolicy';

export function useAssertQueryFieldHasMerge(
  fieldName: string,
  silent?: boolean
) {
  const client = useApolloClient();

  useMemo(() => {
    assertQueryFieldHasMerge(client.cache as InMemoryCache, fieldName, silent);
  }, [client.cache, fieldName, silent]);
}
