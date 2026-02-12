import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shelter, ShelterRow } from '../../components/ShelterRow';
import {
  ViewSheltersByOrganizationDocument,
  ViewSheltersByOrganizationQuery,
} from '../../graphql/__generated__/shelters.generated';

const PAGE_SIZE = 8;

export default function Dashboard() {
  // TODO: Replace hardcoded organizationId with value from authenticated user context
  const { data, loading, error } = useQuery(
    ViewSheltersByOrganizationDocument,
    {
      variables: { organizationId: '2' },
    }
  );

  const backendShelters: Shelter[] = useMemo(() => {
    type ShelterResult = NonNullable<
      ViewSheltersByOrganizationQuery['adminShelters']['results'][number]
    >;
    return (
      data?.adminShelters?.results?.map((s: ShelterResult) => ({
        id: String(s.id),
        name: s.name ?? null,
        address: s.location?.place ?? null,
        totalBeds: s.totalBeds ?? null,
        tags: null,
      })) ?? []
    );
  }, [data?.adminShelters?.results]);

  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(backendShelters.length / PAGE_SIZE));

  const paginatedShelters = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return backendShelters.slice(start, end);
  }, [page, backendShelters]);

  return (
    <div className="flex flex-col p-8 w-full">
      {/* Header with Back and Add Shelter buttons */}
      <div className="mb-6 flex items-center justify-between">
        <Link to="/">
          <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm cursor-pointer hover:bg-gray-50">
            Back
          </button>
        </Link>
        <Link to="/operator/dashboard/create">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm cursor-pointer hover:bg-blue-700">
            Add Shelter
          </button>
        </Link>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full">
        {/* HEADER */}
        <div className="grid grid-cols-[1fr_1.5fr_0.5fr] items-center px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-50 border-b border-gray-200">
          <div>Shelter Name</div>
          <div>Address</div>
          <div className="text-right">Capacity (beds)</div>
        </div>

        {/* ROWS */}
        {paginatedShelters.map((shelter) => (
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

      {loading && (
        <div className="mt-4 text-xs text-gray-500">Loading shelters…</div>
      )}
      {error && (
        <div className="mt-2 text-xs text-red-500">
          Failed to load shelters.
        </div>
      )}
    </div>
  );
}
