import { useQuery } from '@apollo/client/react';
import { useActiveOrg } from '@monorepo/ba-platform';
import {
  Ordering,
  type DemographicChoices,
  type ShelterChoices,
  type ShelterOrder,
  type SpecialSituationRestrictionChoices,
} from '@monorepo/ba-platform/types';
import { useDebounce } from '@monorepo/react/shared';
import { useAtomValue } from 'jotai';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { operatorShelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import { ConfirmationModal } from '../../components/base-ui/modal/ConfirmationModal';
import { Pagination } from '../../components/base-ui/pagination';
import type { SortDirection } from '../../components/base-ui/table';
import { ShelterFilterPanel } from '../../components/ShelterFilterPanel/ShelterFilterPanel';
import {
  ShelterTable,
  type ShelterRowObject,
} from '../../components/ShelterTable';
import {
  OperatorSheltersDocument,
  OperatorSheltersQuery,
} from '../../graphql/__generated__/shelters.generated';
import { paths } from '../../routing';
import type { Shelter } from '../../types/shelter';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

/** Table columns whose header can trigger a server-side sort. */
type SortableColumn = 'name' | 'capacity' | 'status';

/** Maps table column keys to backend `ShelterOrder` fields. */
const SORT_FIELD_MAP: Record<SortableColumn, keyof ShelterOrder> = {
  name: 'name',
  capacity: 'bedCount',
  status: 'status',
};

const DEFAULT_SORT = { column: 'name', direction: Ordering.Asc } as const;

const poppinsStyle = { fontFamily: 'Poppins, sans-serif' } as const;

const loadingState = (
  <div className="px-6 py-8 text-center text-sm text-gray-500">
    Loading shelters…
  </div>
);

const emptyState = (
  <div className="px-6 py-8 text-center text-sm text-gray-500">
    No shelters yet.{' '}
    <Link to={paths.shelterCreate} className="text-blue-600 hover:underline">
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
  const [pendingShelter, setPendingShelter] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    column: SortableColumn;
    direction: Ordering;
  }>(DEFAULT_SORT);

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
    OperatorSheltersDocument,
    {
      variables: {
        filters: {
          search: debouncedSearch || undefined,
          properties: propertyFilters,
          organizations: [selectedOrganizationId],
        },
        pagination: {
          offset: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        },
        ordering: [{ [SORT_FIELD_MAP[sort.column]]: sort.direction }],
      },
      skip: !selectedOrganizationId,
      fetchPolicy: 'cache-and-network',
    },
  );

  // Use previous results while loading to prevent flicker
  const activeData = data ?? previousData;

  const shelters: Shelter[] = useMemo(() => {
    type ShelterResult = NonNullable<
      OperatorSheltersQuery['operatorShelters']['results'][number]
    >;
    return (
      activeData?.operatorShelters?.results
        ?.filter((s): s is ShelterResult => s != null)
        .map((s) => ({
          id: String(s.id),
          name: s.name ?? null,
          address: s.location?.place ?? null,
          totalBeds: s.totalBeds ?? null,
          bedCounts: {
            available: s.bedCounts.available ?? 0,
            inTurnaround: s.bedCounts.inTurnaround ?? 0,
            occupied: s.bedCounts.occupied ?? 0,
            outOfService: s.bedCounts.outOfService ?? 0,
            reserved: s.bedCounts.reserved ?? 0,
            total: s.bedCounts.total ?? 0,
          },
          tags: null,
          status: s.status,
        })) ?? []
    );
  }, [activeData?.operatorShelters?.results]);

  const totalCount = activeData?.operatorShelters?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleRowClick = useCallback((row: ShelterRowObject) => {
    setPendingShelter({ id: row.id, name: row.name });
  }, []);

  const handleSortChange = useCallback(
    (column: string | null, direction: SortDirection | null) => {
      setPage(1);
      if (!column || !direction || !(column in SORT_FIELD_MAP)) {
        setSort(DEFAULT_SORT);
        return;
      }
      setSort({
        column: column as SortableColumn,
        direction: direction === 'asc' ? Ordering.Asc : Ordering.Desc,
      });
    },
    [],
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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ShelterFilterPanel />
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
        sortColumn={sort.column}
        sortDirection={sort.direction === Ordering.Asc ? 'asc' : 'desc'}
        onSortChange={handleSortChange}
        headerStyle={poppinsStyle}
        rowStyle={poppinsStyle}
      />

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          resultCount={totalCount}
          onPageChange={setPage}
        />
      )}

      {error && (
        <div className="mt-2 text-xs text-red-500">
          Failed to load shelters.
        </div>
      )}

      <ConfirmationModal
        isOpen={pendingShelter !== null}
        onClose={() => setPendingShelter(null)}
        variant="info"
        title="Switch shelter?"
        description={
          pendingShelter
            ? `You are now managing ${pendingShelter.name}. Any changes you make will be applied to this shelter. Continue?`
            : undefined
        }
        primaryAction={{
          label: 'Continue',
          onClick: () => {
            if (!pendingShelter) return;
            navigate(`shelter/${pendingShelter.id}/manage`);
            setPendingShelter(null);
          },
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setPendingShelter(null),
        }}
      />
    </div>
  );
}
