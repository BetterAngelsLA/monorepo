import { Link, useNavigate, useParams } from 'react-router-dom';
import { BedForm } from '../../components/beds/bed-form/BedForm';
import { shelterManageBedsRoute } from '../../routing';

export function CreateBedPage() {
  const navigate = useNavigate();
  const { shelterId } = useParams();
  const id = shelterId ?? '';

  if (!id) return null;

  const bedsPath = shelterManageBedsRoute(id);

  return (
    <div className="space-y-6 p-8">
      <Link
        to={bedsPath}
        className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Back to Beds
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Create Bed</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add a new bed to this shelter. Fields left blank will use defaults
          where applicable.
        </p>
      </div>

      <BedForm
        shelterId={id}
        onSuccess={() => navigate(bedsPath)}
        onCancel={() => navigate(bedsPath)}
      />
    </div>
  );
}
