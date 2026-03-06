import { useQuery } from '@apollo/client/react';
import { useUser } from '@monorepo/react/shelter';
import { BookCheck, Filter, Plus, Settings2, UserCog } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons';
import { Dropdown } from '../../components/base-ui/dropdown';
import { ShelterRow } from '../../components/ShelterRow';
import {
  ViewSheltersByOrganizationDocument,
  ViewSheltersByOrganizationQuery,
} from '../../graphql/__generated__/shelters.generated';
import type { Shelter } from '../../types/shelter';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 8;

export default function Dashboard() {
  const { user } = useUser();
  const organizations = user?.organizations ?? [];
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    () => user?.organization?.id ?? ''
  );

  // Sync selectedOrganizationId when user data loads asynchronously
  const orgId = user?.organization?.id;

  useEffect(() => {
    if (orgId && !selectedOrganizationId) {
      setSelectedOrganizationId(orgId);
    }
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        occupiedBeds: null,
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
          {organizations.length > 1 && (
            <Dropdown
              label="Organization"
              placeholder="Select organization"
              options={organizations.map((org) => ({
                label: org.name,
                value: org.id,
              }))}
              value={
                organizations
                  .filter((org) => org.id === selectedOrganizationId)
                  .map((org) => ({ label: org.name, value: org.id }))[0] ?? null
              }
              onChange={(option) => {
                if (option) {
                  setSelectedOrganizationId(option.value);
                  setPage(1);
                }
              }}
            />
          )}

          <Link to="/#">
            <Button
              variant="small-light"
              leftIcon={<BookCheck size={20} />}
              rightIcon={false}
            >
              Reserve
            </Button>
          </Link>

          <Link to="/operator/dashboard/create">
            <Button
              variant="small-light"
              leftIcon={<Plus size={20} />}
              rightIcon={false}
            >
              Create Shelter
            </Button>
          </Link>

          <Link to="/#">
            <Button
              variant="small-light"
              leftIcon={<UserCog size={26} />}
              rightIcon={false}
            />
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <form
        className="my-4 w-full flex items-center justify-between gap-3"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search shelters"
          className="w-full max-w-[380px] px-6 py-2 rounded-3xl border outline-none shadow-sm"
        />

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="small-light"
            leftIcon={<Filter size={20} />}
            rightIcon={false}
          >
            Filter
          </Button>

          <Button
            variant="small-light"
            leftIcon={<Settings2 size={20} />}
            rightIcon={false}
          >
            Sort
          </Button>
        </div>
      </form>

      {/* TABLE */}
      <div className="bg-white rounded-2xl overflow-hidden w-full">
        {/* HEADER */}
        <div
          className="grid grid-cols-[1fr_1fr_1.2fr_0.8fr] items-center px-6 py-3 text-xs font-semibold tracking-wider text-gray-700"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <div>Shelter Name</div>
          <div>Address</div>
          <div className="text-left">Capacity</div>
          <div className="text-right">Tags</div>
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
