import { useQuery } from '@apollo/client/react';
import { useDebounce } from '@monorepo/react/shared';
import { useAtomValue } from 'jotai';
import { Search, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type {
  DemographicChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '../../apollo/graphql/__generated__/types';
import { operatorShelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import { Button } from '../../components/base-ui/buttons';
import { ShelterFilterPanel } from '../../components/ShelterFilterPanel/ShelterFilterPanel';
import {
  ShelterTable,
  type ShelterRowObject,
} from '../../components/ShelterTable';
import {
  ViewSheltersByOrganizationDocument,
  ViewSheltersByOrganizationQuery,
} from '../../graphql/__generated__/shelters.generated';
import { useActiveOrg } from '../../providers/activeOrg';
import { paths } from '../../routing';
import type { Shelter } from '../../types/shelter';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 16;

const poppinsStyle = { fontFamily: 'Poppins, sans-serif' } as const;

const loadingState = (
  <div className="px-6 py-8 text-center text-sm text-gray-500">
    Loading shelters…
  </div>
);

const emptyState = (
  <div className="px-6 py-8 text-center text-sm text-gray-500">
    No shelters yet.{' '}
    <Link to={paths.dashboardCreate} className="text-blue-600 hover:underline">
      Create your first shelter
    </Link>
    .
  </div>
);

export function Dashboard() {
  const navigate = useNavigate();

  const { activeOrg, organizations } = useActiveOrg();
  const selectedOrganizationId = activeOrg?.id ?? '';

  // ── Hooks (must be before any conditional return per React rules) ──────────
  const selectedFilters = useAtomValue(operatorShelterFiltersAtom);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedFilters]);

  const propertyFilters = useMemo(() => {
    const demographics = selectedFilters.demographics?.length
      ? (selectedFilters.demographics as DemographicChoices[])
      : undefined;
    const specialSituationRestrictions = selectedFilters
      .specialSituationRestrictions?.length
      ? (selectedFilters.specialSituationRestrictions as SpecialSituationRestrictionChoices[])
      : undefined;
    const shelterTypes = selectedFilters.shelterTypes?.length
      ? (selectedFilters.shelterTypes as ShelterChoices[])
      : undefined;
    if (!demographics && !specialSituationRestrictions && !shelterTypes) {
      return undefined;
    }
    return { demographics, specialSituationRestrictions, shelterTypes };
  }, [selectedFilters]);

  // Reset page when organization changes
  useEffect(() => {
    setPage(1);
  }, [selectedOrganizationId]);

  const { data, loading, error, previousData } = useQuery(
    ViewSheltersByOrganizationDocument,
    {
      variables: {
        organizationId: selectedOrganizationId,
        name: debouncedSearch || undefined,
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        properties: propertyFilters,
      },
      skip: !selectedOrganizationId,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Use previous results while loading to prevent flicker
  const activeData = data ?? previousData;

  const shelters: Shelter[] = useMemo(() => {
    type ShelterResult = NonNullable<
      ViewSheltersByOrganizationQuery['operatorShelters']['results'][number]
    >;
    return (
      activeData?.operatorShelters?.results
        ?.filter((s): s is ShelterResult => s != null)
        .map((s) => ({
          id: String(s.id),
          name: s.name ?? null,
          address: s.location?.place ?? null,
          totalBeds: s.totalBeds ?? null,
          availableBeds: s.bedsByStatus.available ?? null,
          tags: null,
          status: s.status,
        })) ?? []
    );
  }, [activeData?.operatorShelters?.results]);

  const totalCount = activeData?.operatorShelters?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleRowClick = useCallback(
    (row: ShelterRowObject) => {
      navigate(`shelter/${row.id}/manage`);
    },
    [navigate]
  );
  // ── End hooks ──────────────────────────────────────────────────────────────

  // User has no organizations — redirect to create-org page (full-screen, no layout chrome)
  if (organizations.length === 0) {
    return <Navigate to={paths.createOrganization} replace />;
  }

  return (
    <div className="flex flex-col mx-4">
      {/* Search, filter, sort, and view controls */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="my-1 flex w-full flex-wrap items-center gap-3 bg-white px-3"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        <label className="flex h-11 w-full max-w-[380px] items-center gap-2 rounded-full border border-[#D3D9E3] bg-white px-2">
          <span className="flex h-8 w-9 items-center justify-center rounded-full bg-[#FCF500] text-[#1E3342]">
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

        <div className="flex w-full items-center justify-between mb-4">
          <div className="text-sm text-gray-600">{totalCount} Results</div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ShelterFilterPanel />

            <Button
              variant="primary"
              leftIcon={<Settings2 size={20} />}
              rightIcon={false}
            >
              Sort
            </Button>
          </div>
        </div>
      </form>

      {/* TABLE */}
      <ShelterTable
        rows={shelters}
        getRowKey={(shelter) => shelter.id}
        onRowClick={handleRowClick}
        loading={loading}
        loadingState={loadingState}
        emptyState={emptyState}
        headerStyle={poppinsStyle}
        rowStyle={poppinsStyle}
      />

      {/* PAGINATION */}
      <div className="flex items-center justify-between mt-8 mx-4 text-sm text-gray-600">
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
