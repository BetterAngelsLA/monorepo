import { formatClientDisplayName } from '@monorepo/react/shared';
import { Star, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchClient } from '../../../hooks/useSearchClient';

const DEBOUNCE_MS = 150;
const MIN_QUERY_LENGTH = 2;

export interface SelectedClient {
  id: string;
  firstName: string | null | undefined;
  middleName: string | null | undefined;
  lastName: string | null | undefined;
  nickname: string | null | undefined;
}

interface ClientSearchInputProps {
  selectedClients: SelectedClient[];
  primaryClientId: string | null;
  onAddClient: (client: SelectedClient) => void;
  onRemoveClient: (clientId: string) => void;
  onSetPrimary: (clientId: string) => void;
  disabled?: boolean;
}

export function ClientSearchInput({
  selectedClients,
  primaryClientId,
  onAddClient,
  onRemoveClient,
  onSetPrimary,
  disabled,
}: ClientSearchInputProps) {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [search, { data, loading }] = useSearchClient();

  // Debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchText]);

  // Fire query when debounced search changes
  useEffect(() => {
    if (debouncedSearch.length >= MIN_QUERY_LENGTH) {
      search({ variables: { search: debouncedSearch } });
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [debouncedSearch, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!data?.clientProfiles.results) return [];
    const selectedIds = new Set(selectedClients.map((c) => c.id));
    return data.clientProfiles.results.filter((c) => !selectedIds.has(c.id));
  }, [data?.clientProfiles.results, selectedClients]);

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search input */}
      {!disabled && (
        <div className="relative">
          <label
            htmlFor="client-search"
            className="block text-sm font-medium text-gray-700"
          >
            Search Client
          </label>
          <input
            id="client-search"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => {
              if (debouncedSearch.length >= MIN_QUERY_LENGTH) {
                setIsDropdownOpen(true);
              }
            }}
            placeholder="Type at least 2 characters to search…"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={disabled}
          />

          {/* Dropdown results */}
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {loading && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Searching…
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No clients found.
                </div>
              )}
              {!loading &&
                results.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      onAddClient({
                        id: client.id,
                        firstName: client.firstName,
                        middleName: client.middleName,
                        lastName: client.lastName,
                        nickname: client.nickname,
                      });
                      setSearchText('');
                      setIsDropdownOpen(false);
                    }}
                  >
                    <span className="font-medium text-gray-900">
                      {formatClientDisplayName(client)}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {(client.email ? `Email: ${client.email}` : undefined) ||
                        (client.californiaId
                          ? `CA ID: ${client.californiaId}`
                          : undefined) ||
                        (client.dateOfBirth
                          ? `DOB: ${client.dateOfBirth}`
                          : undefined) ||
                        `ID: ${client.id.slice(0, 8)}`}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Selected clients list */}
      {selectedClients.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {selectedClients.map((client) => {
            const isPrimary = client.id === primaryClientId;
            return (
              <li key={client.id} className="flex items-center gap-3 px-3 py-2">
                {/* Radio button for primary selection — only when multiple clients */}
                {selectedClients.length > 1 && !disabled && (
                  <button
                    type="button"
                    className="flex-shrink-0"
                    onClick={() => onSetPrimary(client.id)}
                    aria-label={`Set ${
                      formatClientDisplayName(client) || 'client'
                    } as primary`}
                  >
                    <Star
                      size={18}
                      className={
                        isPrimary
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-gray-400'
                      }
                    />
                  </button>
                )}
                {selectedClients.length > 1 && disabled && (
                  <Star
                    size={18}
                    className={
                      isPrimary
                        ? 'flex-shrink-0 fill-yellow-400 text-yellow-400'
                        : 'flex-shrink-0 text-gray-200'
                    }
                  />
                )}

                {/* Client name */}
                <span
                  className={`flex-1 text-sm ${
                    isPrimary && selectedClients.length > 1
                      ? 'font-semibold text-gray-900'
                      : 'font-medium text-gray-700'
                  }`}
                >
                  {formatClientDisplayName(client) || 'Unknown'}
                  {isPrimary && selectedClients.length > 1 && (
                    <span className="ml-2 text-xs text-yellow-600">
                      Primary
                    </span>
                  )}
                </span>

                {/* Remove button */}
                {!disabled && (
                  <button
                    type="button"
                    className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    onClick={() => onRemoveClient(client.id)}
                    aria-label={`Remove ${client.firstName} ${client.lastName}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
