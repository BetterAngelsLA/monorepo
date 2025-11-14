import { Link } from 'react-router-dom';
import React from 'react';
import { useViewSheltersByOrganizationQuery } from '../../libs/react/shelter/src';

export default function Dashboard() {
  const { data, loading, error } = useViewSheltersByOrganizationQuery({
    variables: { organizationId: '1' },
  });
  if (error) {
    console.error('[Dashboard GraphQL error]', error);
  }
  if (loading) return <div className="mt-4">Loading...</div>;
  if (error) return <div className="mt-4">Error loading shelters.</div>;
  const shelters = data?.sheltersByOrganization?.results ?? [];

  return (
    <div className="flex flex-col p-8 w-full">
      <div className="mb-6">
        <Link to="/operator">
          <button className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-sm">
            Back
          </button>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {shelters.map((shelter) => (
          <div key={shelter.id} className="text-sm">
            {shelter.name}
          </div>
        ))}
      </div>
    </div>
  );
}
