import { useNavigate, useParams } from 'react-router-dom';
import { BedForm } from '../../components/beds/bed-form/BedForm';
import { mapBedToFormData } from '../../components/beds/bed-form/utils/mapBedToFormData';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import { useBed } from '../../hooks/useBed';
import { shelterManageBedsRoute } from '../../routing';

export function EditBedPage() {
  const navigate = useNavigate();
  const { shelterId, bedId } = useParams();
  const { bed, loading, error } = useBed(bedId ?? '');

  const bedsPath = shelterManageBedsRoute(shelterId ?? '');

  if (!bedId) {
    return null;
  }

  return (
    <ManageFormPageLayout
      shelterId={shelterId}
      backLinkPath={bedsPath}
      backLinkLabel="Back to Beds"
      entityId={bedId}
      loading={loading}
      hasError={!!(error || !bed)}
      errorMessage={error ? 'Unable to load this bed.' : 'Bed not found.'}
      entityName="bed"
      entityLabel="Bed"
      createSubtitle="Fields left blank will use defaults where applicable."
    >
      <BedForm
        key={bedId}
        shelterId={shelterId ?? ''}
        bedId={bedId}
        initialData={bed ? mapBedToFormData(bed) : undefined}
        onSuccess={() => navigate(bedsPath)}
        onCancel={() => navigate(bedsPath)}
      />
    </ManageFormPageLayout>
  );
}
