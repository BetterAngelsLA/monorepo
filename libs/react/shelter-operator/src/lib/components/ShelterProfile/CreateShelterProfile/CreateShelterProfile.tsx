import { useMutation } from '@apollo/client/react';
import {
  BaError,
  getFieldErrorsOrThrow,
  useActiveOrg,
} from '@monorepo/ba-platform';
import { ShelterPermissions } from '@monorepo/ba-platform/permissions';
import { applyFieldErrors } from '@monorepo/react/shared';
import {
  CreateShelterDocument,
  useUser,
  type CreateShelterInput,
  type CreateShelterMutation,
  type CreateShelterMutationVariables,
} from '@monorepo/react/shelter';
import { useMemo, useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useShelterOrganizations } from '../../../hooks';
import {
  profileRouteConfig,
  shelterProfileRoute,
} from '../../../routing/routePaths';
import { useToast } from '../../base-ui/toast/state/useToast';
import {
  formFieldNames,
  ShelterBasicInfoForm,
  type BasicInfoFormData,
} from '../segments/BasicInfo';

function toCreateInput(
  formData: BasicInfoFormData,
  organizationId: string,
): CreateShelterInput {
  return {
    name: formData.name,
    description: formData.description || '',
    location: formData.location ?? undefined,
    email: formData.email || undefined,
    phone: formData.phone || undefined,
    website: formData.website || undefined,
    isPrivate: formData.isPrivate,
    status: formData.status,
    organizationId,
  };
}

type TProps = {
  className?: string;
};

export function CreateShelterProfile(props: TProps) {
  const { className } = props;

  const { activeOrg } = useActiveOrg();
  const { hasGlobalPermission } = useUser();
  const isGlobalOperator = hasGlobalPermission(ShelterPermissions.Add);
  const { organizations, loading: organizationsLoading } =
    useShelterOrganizations({ skip: !isGlobalOperator });
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [disabled, setDisabled] = useState(false);

  const [createShelter] = useMutation<
    CreateShelterMutation,
    CreateShelterMutationVariables
  >(CreateShelterDocument);

  const organizationOptions = useMemo(
    () => organizations.map((org) => ({ label: org.name, value: org.id })),
    [organizations],
  );

  async function handleSubmit(
    formData: BasicInfoFormData,
    setError: UseFormSetError<BasicInfoFormData>,
  ) {
    if (isGlobalOperator && !formData.organizationId) {
      setError('organizationId', {
        type: 'manual',
        message: 'Organization is required',
      });

      return;
    }

    const organizationId = isGlobalOperator
      ? formData.organizationId
      : activeOrg?.id;

    if (!organizationId) {
      return;
    }

    setDisabled(true);

    const data = toCreateInput(formData, organizationId);

    try {
      const response = await createShelter({ variables: { data } });

      const fieldErrors = getFieldErrorsOrThrow({
        response,
        operationKey: 'createShelter',
        successTypename: 'ShelterType',
        fields: formFieldNames,
      });

      if (fieldErrors.length) {
        applyFieldErrors(fieldErrors, setError);

        throw new BaError('Please see validation messages.');
      }

      const result = response.data?.createShelter;

      if (result?.__typename !== 'ShelterType') {
        throw new Error('Failed to create shelter');
      }

      showToast({
        status: 'success',
        title: 'Shelter created!',
      });

      navigate(
        shelterProfileRoute(result.id, profileRouteConfig.children.basic),
      );
    } catch (err) {
      let userMessage = 'An unexpected error occurred.';

      if (err instanceof BaError) {
        userMessage = err.message;
      }

      console.error('Create shelter error:', err);

      showToast({
        status: 'error',
        title: 'Sorry, Failed to create shelter',
        description: userMessage,
      });
    } finally {
      setDisabled(false);
    }
  }

  return (
    <ShelterBasicInfoForm
      onSubmit={handleSubmit}
      disabled={disabled}
      className={className}
      organizationField={
        isGlobalOperator
          ? { options: organizationOptions, isLoading: organizationsLoading }
          : undefined
      }
    />
  );
}
