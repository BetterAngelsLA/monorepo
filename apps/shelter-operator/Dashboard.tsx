'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useViewSheltersByOrganizationQuery } from '../../libs/react/shelter/src';
import { ShelterRow } from './ShelterRow';

export type Shelter = {
  id: string;
  name: string | null;
  address: string | null;
  totalBeds: number | null;
  tags: string[] | null;
};

const MOCK_SHELTERS: Shelter[] = [
  {
    id: 'mock-2',
    name: 'Shelter Name 2',
    address: '456 Longstreet Ave.',
    totalBeds: 40,
    tags: ['Co-ed', 'Downtown'],
  },
  {
    id: 'mock-3',
    name: 'Shelter Name 3',
    address: '789 Another Rd.',
    totalBeds: 15,
    tags: ['Family', 'East'],
  },
  {
    id: 'mock-1',
    name: 'Shelter Name 1',
    address: '123 Thisisasstreetname St.',
    totalBeds: 22,
    tags: ['Women Only', 'Building'],
  },
  {
    id: 'mock-2',
    name: 'Shelter Name 2',
    address: '456 Longstreet Ave.',
    totalBeds: 40,
    tags: ['Co-ed', 'Downtown'],
  },
  {
    id: 'mock-3',
    name: 'Shelter Name 3',
    address: '789 Another Rd.',
    totalBeds: 15,
    tags: ['Family', 'East'],
  },
];

const PAGE_SIZE = 8;

export default function Dashboard() {
  const { data, loading, error } = useViewSheltersByOrganizationQuery({
    variables: { organizationId: '1' },
  });

  useEffect(() => {
    if (data?.sheltersByOrganization?.results) {
      console.log('[Backend shelters]', data.sheltersByOrganization.results);
    }
  }, [data]);

  if (error) console.error('[Dashboard GraphQL error]', error);

  // Convert backend data to UI-friendly shelter objects
  const backendShelters: Shelter[] =
    data?.sheltersByOrganization?.results?.map((s: any) => ({
      id: String(s.id),
      name: s.name ?? null,
      address: s.location?.place ?? null,
      totalBeds: s.totalBeds ?? null,
      tags: null,
    })) ?? [];

  // Combine backend + mocks (backend first)
  const allShelters: Shelter[] = [...backendShelters, ...MOCK_SHELTERS];

  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(allShelters.length / PAGE_SIZE));

  const paginatedShelters = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return allShelters.slice(start, end);
  }, [page, allShelters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '32px', width: '100%' }}>
      {/* Back button */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/operator">
          <button style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: 'white',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Back
          </button>
        </Link>
      </div>

      {/* TABLE */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        width: '100%'
      }}>
        {/* HEADER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr 0.5fr',
            alignItems: 'center',
            padding: '12px 24px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#374151',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div>Shelter Name</div>
          <div>Address</div>
          <div style={{ textAlign: 'right' }}>Capacity (beds)</div>
        </div>

        {/* ROWS */}
        {paginatedShelters.map((shelter) => (
          <ShelterRow key={shelter.id} shelter={shelter} />
        ))}
      </div>

      {/* PAGINATION */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        fontSize: '14px',
        color: '#4b5563'
      }}>
        <div>
          Page {page} of {totalPages}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            style={{
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.4 : 1
            }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>

          <button
            style={{
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.4 : 1
            }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280' }}>
          Loading backend shelters…
        </div>
      )}
      {error && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
          Backend error. Mock data shown as well.
        </div>
      )}
    </div>
  );
}
