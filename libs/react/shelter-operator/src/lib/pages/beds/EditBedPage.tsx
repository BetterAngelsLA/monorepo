import { useQuery } from '@apollo/client/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  GetBedDocument,
  type GetBedQuery,
  type GetBedQueryVariables,
} from '../../components/beds/api/__generated__/bedQueries.generated';
import { BedForm } from '../../components/beds/bed-form/BedForm';
import { mapBedToFormData } from '../../components/beds/bed-form/utils/mapBedToFormData';
import { shelterManageBedsRoute } from '../../routing';

export function EditBedPage() {
  const navigate = useNavigate();
  const { shelterId, bedId } = useParams();
  const shelterIdValue = shelterId ?? '';
  const bedIdValue = bedId ?? '';

  const { data, loading, error } = useQuery<GetBedQuery, GetBedQueryVariables>(
    GetBedDocument,
    {
      variables: { id: bedIdValue },
      skip: !bedIdValue,
    }
  );

  if (!shelterIdValue || !bedIdValue) return null;

  const bedsPath = shelterManageBedsRoute(shelterIdValue);
  const bed = data?.beds.results?.[0];

  if (loading) {
    return (
      <div className="p-8 text-sm text-gray-600" role="status">
        Loading bed…
      </div>
    );
  }

  if (error || !bed) {
    return (
      <div className="space-y-4 p-8">
        <Link
          to={bedsPath}
          className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Beds
        </Link>
        <p className="text-sm text-red-600" role="alert">
          {error ? 'Unable to load this bed.' : 'Bed not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <Link
        to={bedsPath}
        className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Back to Beds
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Edit Bed</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update bed details for this shelter.
        </p>
      </div>

      <BedForm
        key={bed.id}
        shelterId={shelterIdValue}
        bedId={bed.id}
        initialData={mapBedToFormData(bed)}
        onSuccess={() => navigate(bedsPath)}
        onCancel={() => navigate(bedsPath)}
      />
    </div>
  );
}
