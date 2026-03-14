import { useQuery } from '@apollo/client/react';
import { BookCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons';
import { ShelterTable } from '../../components/ShelterTable';
import {
  ViewSheltersByOrganizationDocument,
  ViewSheltersByOrganizationQuery,
} from '../../graphql/__generated__/shelters.generated';
import type { Shelter } from '../../types/shelter';
import type { OperatorDashboardLayoutContext } from './OperatorDashboardLayout';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 16;

export default function Dashboard() {
  const { pathname } = useLocation();
  const isOperatorRoot = pathname === '/operator';
  const navigate = useNavigate();
  const { selectedOrganizationId } =
    useOutletContext<OperatorDashboardLayoutContext>();

  const [tableSearchInput, setTableSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounce: only update the query variable after the user stops typing
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(tableSearchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [tableSearchInput]);

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

  useEffect(() => {
    setPage(1);
  }, [selectedOrganizationId]);

  return (
    <>
      <div className="flex flex-col mx-4">
        {/* TABLE */}
        <ShelterTable
          rows={shelters}
          onSearchChange={setTableSearchInput}
          getRowKey={(shelter) => shelter.id}
          onRowClick={(rowObject) => {
            navigate(`/operator/shelter/${rowObject.id}`, {
              state: { shelter: rowObject.shelter },
            });
          }}
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

      {isOperatorRoot && (
        <div className="fixed bottom-6 right-6 text-sm z-20 ">
          <Button leftIcon={<BookCheck />} rightIcon={false} variant="floating">
            Reserve
          </Button>
        </div>
      )}
    </>
  );
}
