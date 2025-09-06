import { useCallback, useMemo, useState } from 'react';
import type { SearchMode } from '../types';

export function useMultiSelectSearch(search?: SearchMode) {
  const [localQuery, setLocalQuery] = useState('');

  const isLocal = search?.kind === 'local';
  const isControlled = search?.kind === 'controlled';
  const isEnabled = Boolean(search);

  const value = isControlled ? search!.value ?? '' : isLocal ? localQuery : '';
  const placeholder = search?.placeholder ?? 'Search';
  const debounceMs = isControlled ? search!.debounceMs ?? 0 : 0;

  const onChange = useCallback(
    (q: string) => {
      if (isControlled) search!.onChange(q);
      else if (isLocal) setLocalQuery(q);
    },
    [isControlled, isLocal, search]
  );

  const onClear = useCallback(() => onChange(''), [onChange]);

  // handy booleans for downstream visibility/filtering logic
  return useMemo(
    () => ({
      // state & handlers
      value,
      onChange,
      onClear,
      placeholder,
      debounceMs,

      // mode flags
      isEnabled,
      isLocal,
      isControlled,

      // expose local query if caller needs it (e.g., for filtering/extraData)
      localQuery,
      setLocalQuery,
    }),
    [
      value,
      onChange,
      onClear,
      placeholder,
      debounceMs,
      isEnabled,
      isLocal,
      isControlled,
      localQuery,
    ]
  );
}
