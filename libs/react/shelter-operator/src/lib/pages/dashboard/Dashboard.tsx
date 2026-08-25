import { useQuery } from '@apollo/client/react';
import { useActiveOrg } from '@monorepo/ba-platform';
import {
  Ordering,
  type AccessibilityChoices,
  type DemographicChoices,
  type EntryRequirementChoices,
  type FunderChoices,
  type ParkingChoices,
  type PetChoices,
  type ReferralRequirementChoices,
  type RoomStyleChoices,
  type ShelterChoices,
  type ShelterOrder,
  type ShelterProgramChoices,
  type SpecialSituationRestrictionChoices,
  type StatusChoices,
  type StorageChoices,
} from '@monorepo/ba-platform/types';
import { useDebounce } from '@monorepo/react/shared';
import { useAtom, useAtomValue } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { operatorShelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import {
  DEFAULT_SHELTER_SORT,
  operatorShelterSortAtom,
  type SortableColumn,
} from '../../atoms/shelterSortAtom';
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

/** Maps table column keys to backend `ShelterOrder` fields. */
const SORT_FIELD_MAP: Record<SortableColumn, keyof ShelterOrder> = {
  name: 'name',
  capacity: 'bedCount',
  status: 'status',
  organization: 'organization',
};

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
  const resetFilters = useResetAtom(operatorShelterFiltersAtom);
  const [sort, setSort] = useAtom(operatorShelterSortAtom);
  const resetSort = useResetAtom(operatorShelterSortAtom);
  const [pendingShelter, setPendingShelter] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);

  // Reset to first page when filters, sort, or search change
  useEffect(() => {
    setPage(1);
  }, [selectedFilters, debouncedSearch, sort]);

  // Reset filters/sort/search/page when the active org changes (skip initial mount)
  const previousOrgIdRef = useRef(selectedOrganizationId);
  useEffect(() => {
    if (previousOrgIdRef.current === selectedOrganizationId) {
      return;
    }
    previousOrgIdRef.current = selectedOrganizationId;
    resetFilters();
    resetSort();
    setSearchInput('');
    setPage(1);
  }, [selectedOrganizationId, resetFilters, resetSort]);

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
    const pets = selectedFilters.pets?.length
      ? (selectedFilters.pets as PetChoices[])
      : undefined;
    const entryRequirements = selectedFilters.entryRequirements?.length
      ? (selectedFilters.entryRequirements as EntryRequirementChoices[])
      : undefined;
    const referralRequirement = selectedFilters.referralRequirement?.length
      ? (selectedFilters.referralRequirement as ReferralRequirementChoices[])
      : undefined;
    const roomStyles = selectedFilters.roomStyles?.length
      ? (selectedFilters.roomStyles as RoomStyleChoices[])
      : undefined;
    const parking = selectedFilters.parking?.length
      ? (selectedFilters.parking as ParkingChoices[])
      : undefined;
    const funders = selectedFilters.funders?.length
      ? (selectedFilters.funders as FunderChoices[])
      : undefined;
    if (
      !demographics &&
      !specialSituationRestrictions &&
      !shelterTypes &&
      !pets &&
      !entryRequirements &&
      !referralRequirement &&
      !roomStyles &&
      !parking &&
      !funders
    ) {
      return undefined;
    }
    return {
      demographics,
      entryRequirements,
      funders,
      parking,
      pets,
      referralRequirement,
      roomStyles,
      shelterTypes,
      specialSituationRestrictions,
    };
  }, [selectedFilters]);

  const { data, loading, error, previousData } = useQuery(
    OperatorSheltersDocument,
    {
      variables: {
        filters: {
          search: debouncedSearch || undefined,
          properties: propertyFilters,
          accessibility: selectedFilters.accessibility.length
            ? (selectedFilters.accessibility as AccessibilityChoices[])
            : undefined,
          storage: selectedFilters.storage.length
            ? (selectedFilters.storage as StorageChoices[])
            : undefined,
          shelterPrograms: selectedFilters.shelterPrograms.length
            ? (selectedFilters.shelterPrograms as ShelterProgramChoices[])
            : undefined,
          organizations: selectedFilters.organizations.length
            ? selectedFilters.organizations
            : [selectedOrganizationId],
          spa: selectedFilters.spa.length ? selectedFilters.spa : undefined,
          spasServed: selectedFilters.spasServed.length
            ? selectedFilters.spasServed
            : undefined,
          city: selectedFilters.city.length ? selectedFilters.city : undefined,
          citiesServed: selectedFilters.citiesServed.length
            ? selectedFilters.citiesServed
            : undefined,
          services: selectedFilters.services.length
            ? selectedFilters.services
            : undefined,
          onSiteSecurity: selectedFilters.onSiteSecurity.includes('true')
            ? true
            : selectedFilters.onSiteSecurity.includes('false')
              ? false
              : undefined,
          isPrivate: selectedFilters.isPrivate.includes('true')
            ? true
            : selectedFilters.isPrivate.includes('false')
              ? false
              : undefined,
          status: selectedFilters.status.length
            ? (selectedFilters.status as StatusChoices[])
            : undefined,
          overallRating: selectedFilters.overallRating.length
            ? selectedFilters.overallRating.map(Number)
            : undefined,
          cityCouncilDistrict: selectedFilters.cityCouncilDistrict.length
            ? selectedFilters.cityCouncilDistrict.map(Number)
            : undefined,
          supervisorialDistrict: selectedFilters.supervisorialDistrict.length
            ? selectedFilters.supervisorialDistrict.map(Number)
            : undefined,
          maxStay: (() => {
            const days = Number(selectedFilters.maxStayDays);
            return selectedFilters.maxStayDays &&
              Number.isFinite(days) &&
              days >= 1
              ? { days }
              : undefined;
          })(),
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
          totalBeds: s.bedCounts.total ?? null,
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
          organization: s.organization
            ? { id: String(s.organization.id), name: s.organization.name }
            : null,
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
      if (!column || !direction || !(column in SORT_FIELD_MAP)) {
        setSort(DEFAULT_SHELTER_SORT);
        return;
      }
      setSort({
        column: column as SortableColumn,
        direction: direction === 'asc' ? Ordering.Asc : Ordering.Desc,
      });
    },
    [setSort],
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
        <div className="flex w-full max-w-[380px] flex-col gap-1">
          <label className="flex h-11 w-full items-center gap-2 rounded-full border border-[#D3D9E3] bg-white px-2 mb-2">
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
          <span className="pl-2 text-base text-[#4A4F57]">
            {totalCount} results
          </span>
        </div>
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
