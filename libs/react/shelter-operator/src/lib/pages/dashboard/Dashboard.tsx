import { useQuery } from '@apollo/client/react';
import { useSignOut } from '@monorepo/react/shared';
import { useUser } from '@monorepo/react/shelter';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShelterRow } from '../../components/ShelterRow';
import {
  ViewSheltersByOrganizationDocument,
  ViewSheltersByOrganizationQuery,
} from '../../graphql/__generated__/shelters.generated';
import { useActiveOrg } from '../../providers/activeOrg';
import type { Shelter } from '../../types/shelter';

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

export default function Dashboard() {
  const { setUser } = useUser();
  const { signOut, loading: signingOut } = useSignOut(setUser);
  const { activeOrg } = useActiveOrg();
  const selectedOrganizationId = activeOrg?.id ?? '';

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounce: only update the query variable after the user stops typing
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  const { data, loading, error, previousData } = useQuery(
    ViewSheltersByOrganizationDocument,
    {
      variables: {
        organizationId: selectedOrganizationId,
        name: debouncedSearch || undefined,
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      },
      skip: !selectedOrganizationId,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Use previous results while loading to prevent flicker
  const activeData = data ?? previousData;

  const shelters: Shelter[] = useMemo(() => {
    type ShelterResult = NonNullable<
      ViewSheltersByOrganizationQuery['adminShelters']['results'][number]
    >;
    return (
      activeData?.adminShelters?.results?.map((s: ShelterResult) => ({
        id: String(s.id),
        name: s.name ?? null,
        address: s.location?.place ?? null,
        totalBeds: s.totalBeds ?? null,
        tags: null,
      })) ?? []
    );
  }, [activeData?.adminShelters?.results]);

  const totalCount = activeData?.adminShelters?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    if (error) console.error('[Dashboard GraphQL error]', error);
  }, [error]);

  return (
    <div className="flex flex-col p-8 w-full">
      {/* Header with Back and Add Shelter buttons */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm cursor-pointer hover:bg-gray-50"
        >
          Back
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/operator/dashboard/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm cursor-pointer hover:bg-blue-700"
          >
            Add Shelter
          </Link>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <form className="w-full flex items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search shelters"
          className="px-6 py-2 rounded-3xl border border-gray-300 outline-hidden shadow-xs my-4"
        />
      </form>

      <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
        {totalCount} Results
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xs overflow-hidden w-full">
        {/* HEADER */}
        <div className="grid grid-cols-[1fr_1.5fr_0.5fr] items-center px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-50 border-b border-gray-200">
          <div>Shelter Name</div>
          <div>Address</div>
          <div className="text-right">Capacity (beds)</div>
        </div>

        {/* ROWS */}
        {loading && (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            Loading shelters…
          </div>
        )}
        {!loading && shelters.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No shelters yet.{' '}
            <Link
              to="/operator/dashboard/create"
              className="text-blue-600 hover:underline"
            >
              Create your first shelter
            </Link>
            .
          </div>
        )}
        {shelters.map((shelter) => (
          <ShelterRow key={shelter.id} shelter={shelter} />
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>
          Page {page} of {totalPages}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border border-gray-300 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>

          <button
            className="px-3 py-1 border border-gray-300 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-500">
          Failed to load shelters.
        </div>
      )}
    </div>
  );
}
