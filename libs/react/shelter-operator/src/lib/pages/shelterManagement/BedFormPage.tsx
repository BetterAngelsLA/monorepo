import { useNavigate, useParams } from 'react-router-dom';
import {
  BedForm,
  toFormData,
} from '../../components/ShelterManagement/segments/Beds';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import { useBed } from '../../hooks/useBed';
import { shelterMgmtResourceRoute } from '../../routing';

export function BedFormPage() {
  const navigate = useNavigate();
  const { shelterId, id: bedId } = useParams<{
    shelterId: string;
    id?: string;
  }>();

  if (!shelterId || !bedId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const { bed, loading, error } = useBed(bedId);

  const bedsPath = shelterMgmtResourceRoute(shelterId, 'bed');

  return (
    <ManageFormPageLayout
      shelterId={shelterId}
      backLinkPath={bedsPath}
      backLinkLabel="Back to Beds"
      entityId={bedId}
      loading={loading}
      hasError={!!(error || (bedId && !bed))}
      errorMessage={error ? 'Unable to load this bed.' : 'Bed not found.'}
      entityName="bed"
      entityLabel="Bed"
      createSubtitle="Fields left blank will use defaults where applicable."
    >
      <BedForm
        key={bedId}
        shelterId={shelterId}
        bedId={bedId}
        initialData={bed ? toFormData(bed) : undefined}
        onSuccess={() => navigate(bedsPath)}
        onCancel={() => navigate(bedsPath)}
      />
    </ManageFormPageLayout>
  );
}
