import { InMemoryCache } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { useMemo } from 'react';
import { assertQueryFieldHasMerge } from '../cachePolicy/utils/assertQueryFieldHasMerge';

export function useAssertQueryFieldHasMerge(
  fieldName: string,
  silent?: boolean
) {
  const client = useApolloClient();

  useMemo(() => {
    assertQueryFieldHasMerge(client.cache as InMemoryCache, fieldName, silent);
  }, [client.cache, fieldName, silent]);
}
