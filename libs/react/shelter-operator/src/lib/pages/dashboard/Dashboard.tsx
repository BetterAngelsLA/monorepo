import { useQuery } from '@apollo/client/react';
import { useUser } from '@monorepo/react/shelter';
import { BookCheck, Filter, Search, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons';
import NavBar from '../../components/NavBar';
import { Table, type TableColumn } from '../../components/Table';
import {
  ViewSheltersByOrganizationDocument,
  ViewSheltersByOrganizationQuery,
} from '../../graphql/__generated__/shelters.generated';
import type { Shelter } from '../../types/shelter';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 8;

export default function Dashboard() {
  const { pathname } = useLocation();
  const isOperatorRoot = pathname === '/operator';

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
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
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

  const tableColumns: TableColumn<Shelter>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Shelter Name',
        width: '1fr',
        cellClassName:
          'font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) => shelter.name ?? 'N/A',
      },
      {
        key: 'address',
        label: 'Address',
        width: '1fr',
        cellClassName:
          'text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) => shelter.address ?? 'N/A',
      },
      {
        key: 'capacity',
        label: 'Capacity',
        width: '1.2fr',
        cellClassName: 'whitespace-nowrap text-gray-700',
        render: (shelter) => {
          const totalBeds = shelter.totalBeds ?? 0;
          const hasCapacity = totalBeds > 0;
          const usedBeds = hasCapacity
            ? Math.min(
                Math.max(shelter.occupiedBeds ?? totalBeds, 0),
                totalBeds
              )
            : null;
          const progressPct =
            hasCapacity && usedBeds !== null ? (usedBeds / totalBeds) * 100 : 0;

          if (!hasCapacity || usedBeds === null) {
            return <div className="whitespace-nowrap">N/A</div>;
          }

          return (
            <div className="flex items-center gap-3">
              <div className="h-4 w-[150px] overflow-hidden rounded-full border border-slate-300 bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#FFC5BF] transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="leading-5 text-slate-700">
                {usedBeds} / {totalBeds} beds
              </span>
            </div>
          );
        },
      },
      {
        key: 'tags',
        label: 'Tags',
        width: '0.8fr',
        cellClassName:
          'text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) =>
          shelter.tags?.length ? shelter.tags.join(', ') : 'N/A',
      },
    ],
    []
  );

  useEffect(() => {
    if (error) console.error('[Dashboard GraphQL error]', error);
  }, [error]);

  return (
    <>
      {/* NAV BAR */}
      <NavBar
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        onOrganizationChange={(organizationId) => {
          setSelectedOrganizationId(organizationId);
          setPage(1);
        }}
      />
      <div className="flex flex-col w-full">
        {/* Search, filter, sort, and view controls */}
        <form
          className="my-1 flex w-full flex-wrap items-center gap-3 bg-white px-3"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <label className="flex h-11 w-full max-w-[380px] items-center gap-2 rounded-full border border-[#D3D9E3] bg-white px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FCF500] text-[#1E3342]">
              <Search size={20} />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search shelters"
              className="h-full w-full rounded-full bg-transparent pr-3 text-base text-[#4A4F57] outline-none transition-colors placeholder:text-[#7A818A]"
            />
          </label>

          {/* SEARCH BAR + FILTERING */}

          <div className="ml-auto flex flex-wrap items-center gap-2">
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

            <div className="relative grid h-11 grid-cols-2 items-center rounded-full border border-[#D3D9E3] bg-[#F5F5F5] p-1">
              <span
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  viewMode === 'list' ? 'translate-x-0' : 'translate-x-full'
                }`}
              />
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`relative z-10 h-9 rounded-full px-2 text-base transition-colors ${
                  viewMode === 'list' ? 'text-[#1F2937]' : 'text-[#747A82]'
                }`}
              >
                List View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`relative z-10 h-9 rounded-full px-2 text-base transition-colors ${
                  viewMode === 'card' ? 'text-[#1F2937]' : 'text-[#747A82]'
                }`}
              >
                Card View
              </button>
            </div>
          </div>
        </form>

        {/* TABLE */}
        <Table
          columns={tableColumns}
          rows={shelters}
          getRowKey={(shelter) => shelter.id}
          loading={loading}
          loadingState={
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              Loading shelters…
            </div>
          }
          emptyState={
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
          }
          headerStyle={{ fontFamily: 'Poppins, sans-serif' }}
          rowStyle={{ fontFamily: 'Poppins, sans-serif' }}
        />

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

      {isOperatorRoot && (
        <div className="fixed bottom-6 right-6 z-20 ">
          <Button
            leftIcon={<BookCheck />}
            rightIcon={false}
            variant="floating-light"
          >
            Reserve
          </Button>
        </div>
      )}
    </>
  );
}
