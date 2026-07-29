import { useNavigate, useParams } from 'react-router-dom';
import { BedForm } from '../../components/ShelterManagement/segments/Beds';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import { shelterMgmtResourceRoute } from '../../routing';

export function CreateBedPage() {
  const navigate = useNavigate();
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const bedsPath = shelterMgmtResourceRoute(shelterId, 'bed');

  return (
    <ManageFormPageLayout
      shelterId={shelterId}
      backLinkPath={bedsPath}
      backLinkLabel="Back to Beds"
      entityId={undefined}
      loading={false}
      hasError={false}
      entityName="bed"
      entityLabel="Bed"
      createSubtitle="Fields left blank will use defaults where applicable."
    >
      <BedForm
        shelterId={shelterId}
        onSuccess={() => navigate(bedsPath)}
        onCancel={() => navigate(bedsPath)}
      />
    </ManageFormPageLayout>
  );
}
