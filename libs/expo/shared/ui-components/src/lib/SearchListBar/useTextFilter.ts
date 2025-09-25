import { useCallback, useMemo, useState } from 'react';

type TUseTextFilter<T> = {
  data?: T[];
  extractSearchText?: (item: T) => string;
  caseSensitive?: boolean;
  initialQuery?: string;
};

export function useTextFilter<T>(props: TUseTextFilter<T>) {
  const {
    data = [],
    extractSearchText,
    caseSensitive = false,
    initialQuery = '',
  } = props;

  const defaultExtractText = useCallback((_: T) => '', []);
  const getSearchableText = extractSearchText ?? defaultExtractText;

  const [query, setQuery] = useState(initialQuery);

  const normalizeString = useCallback(
    (s: string) => (caseSensitive ? s.trim() : s.toLowerCase().trim()),
    [caseSensitive]
  );

  const filtered = useMemo(() => {
    const q = normalizeString(query);

    if (!q) {
      return data;
    }

    return data.filter((item) =>
      normalizeString(getSearchableText(item)).includes(q)
    );
  }, [data, query, normalizeString, getSearchableText]);

  // stable signature to minimize renders
  const signature = useMemo(
    () => `${filtered.length}|${normalizeString(query)}`,
    [filtered.length, normalizeString, query]
  );

  return {
    query,
    setQuery,
    filtered,
    signature,
    searchBarProps: {
      value: query,
      onChange: setQuery,
      onClear: () => setQuery(''),
    },
  };
}
