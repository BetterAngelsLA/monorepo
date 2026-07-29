import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import {
  updateShelterProfileMeta,
  useShelterOperatorProfile,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { ShelterPoliciesForm } from './ShelterPoliciesForm';
import {
  type PoliciesFormData,
  formFieldNames,
  toFormData,
} from './formSchema';

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
  const [formKey, setFormKey] = useState(0);

  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSubmit(
    data: PoliciesFormData,
    setError: UseFormSetError<PoliciesFormData>
  ) {
    try {
      const response = await updateShelter({
        variables: { data: toUpdateInput(shelterId, data) },
      });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        ...updateShelterProfileMeta,
        fields: formFieldNames,
      });

      if (fieldErrors.length) {
        applyFieldErrors(fieldErrors, setError);

        throw new BaError('Please see validation messages.');
      }

      setEditMode(false);
      setFormKey((k) => k + 1);

      showToast({
        status: 'success',
        title: 'Shelter updated.',
      });
    } catch (e) {
      let userMessage = 'An unexpected error occurred.';

      if (e instanceof BaError) {
        userMessage = e.message;
      }

      console.error(`[updateShelter error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Update failed',
        description: userMessage,
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
      key={formKey}
      values={toFormData(shelter)}
      onSubmit={onSubmit}
      isViewMode={!isEditMode}
      onEditClick={() => setEditMode(true)}
      onCancel={onCancel}
    />
  );
}
