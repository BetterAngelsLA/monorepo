import { useQuery } from '@apollo/client/react';
import { useUser } from '@monorepo/react/shelter';
import { Filter, Plus, Settings2, UserCog } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons';
import { Dropdown } from '../../components/base-ui/dropdown';
import { Table, type TableColumn } from '../../components/Table';
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

  const tableColumns: TableColumn<Shelter>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Shelter Name',
        width: '1fr',
        align: 'left',
        cellClassName:
          'font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) => shelter.name ?? 'N/A',
      },
      {
        key: 'address',
        label: 'Address',
        width: '1fr',
        align: 'left',
        cellClassName:
          'text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap',
        render: (shelter) => shelter.address ?? 'N/A',
      },
      {
        key: 'capacity',
        label: 'Capacity',
        width: '1.2fr',
        align: 'left',
        cellClassName: 'whitespace-nowrap text-gray-700',
        render: (shelter) => {
          const hasCapacity =
            typeof shelter.totalBeds === 'number' && shelter.totalBeds > 0;
          const usedBeds = hasCapacity
            ? Math.min(
                Math.max(shelter.occupiedBeds ?? shelter.totalBeds ?? 0, 0),
                shelter.totalBeds
              )
            : null;
          const progressPct =
            hasCapacity && usedBeds !== null
              ? (usedBeds / shelter.totalBeds) * 100
              : 0;

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
                {usedBeds} / {shelter.totalBeds} beds
              </span>
            </div>
          );
        },
      },
      {
        key: 'tags',
        label: 'Tags',
        width: '0.8fr',
        align: 'right',
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
  );
}
