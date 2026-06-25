import { useState } from 'react';
import {
  useShelterOperatorProfile,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { ShelterPoliciesForm } from './ShelterPoliciesForm';
import { type PoliciesFormData, toFormData } from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: PoliciesFormData
): UseUpdateShelterProfileInput {
  return {
    id: shelterId,
    maxStay: data.maxStay ?? null,
    onSiteSecurity: data.onSiteSecurity ?? null,
    visitorsAllowed: data.visitorsAllowed ?? null,
    emergencySurge: data.emergencySurge ?? null,
    exitPolicy: data.exitPolicy,
    exitPolicyOther: data.exitPolicyOther ?? null,
    otherRules: data.otherRules ?? null,
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterPolicies(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);

  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSubmit(data: PoliciesFormData) {
    try {
      const response = await updateShelter({
        variables: { data: toUpdateInput(shelterId, data) },
      });

      const result = response.data?.updateShelter;

      // success
      if (result?.__typename === 'ShelterType') {
        setEditMode(false);

        showToast({
          status: 'success',
          title: 'Shelter updated.',
        });

        return;
      }

      // error
      // TODO: handle specific OperationInfo field errors via SDB-241

      throw new Error('unexpected query error');
    } catch (e) {
      console.error(`[updateShelter error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Update failed',
        description: 'An unexpected error occurred.',
      });
    }
  }

  function onCancel() {
    setEditMode(false);
  }

  if (!shelter) {
    return null;
  }

  return (
    <ShelterPoliciesForm
      defaultValues={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
