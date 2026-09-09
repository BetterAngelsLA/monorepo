import { zodResolver } from '@hookform/resolvers/zod';
import { BaError, getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { applyFieldErrors } from '@monorepo/react/shared';
import { useEffect, useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  updateShelterProfileMeta,
  useShelterOperatorProfile,
  useUpdateShelterProfile,
  UseUpdateShelterProfileInput,
} from '../../../../hooks';
import { useToast } from '../../../base-ui/toast';
import { Form } from '../../../form/Form';
import { defaultContactValues } from './Contacts/formSchema';
import { ShelterContacts } from './Contacts/ShelterContacts';
import {
  defaultFormValues,
  formFieldNames,
  formSchema,
  toFormData,
  type AdditionalContactsFormData,
} from './formSchema';

function toUpdateInput(
  shelterId: string,
  data: AdditionalContactsFormData,
): UseUpdateShelterProfileInput {
  return {
    id: shelterId,
    additionalContacts: data.additionalContacts.map((contact) => ({
      id: contact.id,
      contactName: contact.contactName,
      contactNumber: contact.contactNumber,
      contactEmail: contact.contactEmail || null,
      contactTitle: contact.contactTitle || null,
      isClaimant: contact.isClaimant,
    })),
  };
}

type TProps = {
  shelterId: string;
};

export function ShelterBaPrivate(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);

  const { shelter } = useShelterOperatorProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  const { control, handleSubmit, setError, reset } =
    useForm<AdditionalContactsFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: defaultFormValues,
      mode: 'onBlur',
    });

  const {
    fields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: 'additionalContacts',
    keyName: '_rhfId',
  });

  useEffect(() => {
    if (shelter) {
      reset(toFormData(shelter));
    }
  }, [shelter, reset]);

  async function onSubmit(
    data: AdditionalContactsFormData,
    setError: UseFormSetError<AdditionalContactsFormData>,
  ) {
    try {
      setDisabled(true);

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
    } finally {
      setDisabled(false);
    }
  }

  function onCancel() {
    if (shelter) {
      reset(toFormData(shelter));
    }
    setEditMode(false);
  }

  if (!shelter) {
    return null;
  }

  return (
    <div className="px-6 flex-col flex-1 pb-48">
      <Form className="flex-1">
        <Form.Header
          title="BA Private"
          onEditClick={!isEditMode ? () => setEditMode(true) : undefined}
          className="pl-5"
        />

        <Form.Content>
          <ShelterContacts
            disabled={disabled}
            fields={fields}
            control={control}
            onAdd={() => appendContact({ ...defaultContactValues })}
            onRemove={removeContact}
            isViewMode={!isEditMode}
          />

          {isEditMode && (
            <Form.Actions
              primaryDisabled={disabled}
              secondaryDisabled={disabled}
              onPrimaryClick={handleSubmit((data) => onSubmit(data, setError))}
              onSecondaryClick={onCancel}
              className="z-99"
            />
          )}
        </Form.Content>
      </Form>
    </div>
  );
}
