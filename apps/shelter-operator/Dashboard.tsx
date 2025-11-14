import { ViewSheltersByOrganizationQueryVariables } from '@monorepo/react/shelter';
import { useAtom } from 'jotai';
import { useViewShelterLazyQuery } from 'libs/react/shelter/src/lib/pages/shelter/__generated__/shelter.generated';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShelterCard } from './ShelterCard';
import { sheltersAtom } from './atoms'; // make sure this is defined somewhere

export type Shelter = {
  id?: number;
  name?: string;
  address?: string;
  image?: { file: { url: string; name: string } };
  capacity?: number | null;
};

export default function Dashboard({ id }: { id?: number }) {
  const [getShelters, { loading, data, error }] = useViewShelterLazyQuery();
  const [shelters, setShelters] = useAtom(sheltersAtom);

  useEffect(() => {
      let queryVariables: ViewSheltersByOrganizationQueryVariables | undefined;

      if (id) {
          queryVariables = {
              organizationId: id,
          };
      }

       if (!queryVariables) {
      return;
    }

      getShelters({ variables: queryVariables });

  }, [data, setShelters]);

  useEffect(() => {
    setShelters(shelters || []);
  }, [shelters]);

  if (loading) return <div className="mt-4">Loading...</div>;

  if (error) {
    console.error(`[Dashboard] ${error}`);
    return (
      <div className="mt-4">
        Sorry, there was an issue fetching the data. Please try again.
      </div>
    );
  }

  if (!shelters) {
    return null;
  }

  return (
    <div className="flex flex-col p-8 gap-8 w-full">
      {/* Top row with Back and Add Shelter buttons */}
      <div className="flex items-center justify-between">
        <Link to="/operator">
          <button className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-sm">
            Back
          </button>
        </Link>

        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
          Add Shelter
        </button>
      </div>

      {/* Grid of shelter cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 w-full">
        {shelters?.map((shelter) => (
          <ShelterCard key={shelter.id} shelter={shelter} />
        ))}
      </div>
    </div>
  );
}
