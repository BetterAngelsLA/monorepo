import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import {
  extractExtensionFieldErrors,
  ServiceRequestTypeEnum,
} from '../../../apollo';
import { applyManualFormErrors } from '../../../errors';
import { useSnackbar } from '../../../hooks';
import { ClientViewTabEnum } from '../../Client/ClientTabs';
import {
  ProgramNoteFormHmis,
  ProgramNoteFormSchemaHmis,
  ProgramNoteFormSchemaOutputHmis,
  TProgramNoteFormInputsHmis,
} from '../ProgramNoteFormHmis';
import {
  getProgramNoteFormEmptyStateHmis,
  NoteFormFieldNamesHmis,
} from '../ProgramNoteFormHmis/formSchema';
import splitBucket from '../utils/splitBucket';
import { useApplyTasks } from '../utils/useApplyTasks';
import { CreateNoteHmisDocument } from './__generated__/createClientNoteHmis.generated';
import {
  CreateServiceRequestHmisDocument,
  RemoveServiceRequestHmisDocument,
} from './__generated__/ServiceRequestHmis.generated';
import { UpdateNoteLocationHmisDocument } from './__generated__/updateNoteLocationHmis.generated';

type TProps = {
  clientId: string;
  arrivedFrom?: string;
};

export function ProgramNoteCreateHmis(props: TProps) {
  const { clientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisNote] = useMutation(CreateNoteHmisDocument);
  const [updateHmisNoteLocation] = useMutation(UpdateNoteLocationHmisDocument);
  const [deleteService] = useMutation(RemoveServiceRequestHmisDocument);
  const [createServiceRequest] = useMutation(CreateServiceRequestHmisDocument);

  const { applyTasks } = useApplyTasks();

  async function applyBucket(
    id: string,
    type: ServiceRequestTypeEnum,
    bucket: any
  ) {
    const { toCreateStandard, toDeleteStandard, toCreateOther, toDeleteOther } =
      splitBucket(bucket);

    // create standard
    for (const s of toCreateStandard) {
      await createServiceRequest({
        variables: {
          data: {
            hmisNoteId: id,
            serviceRequestType: type,
            serviceId: s.serviceId!,
          },
        },
      });
    }

    // delete standard
    for (const s of toDeleteStandard) {
      await deleteService({
        variables: {
          data: {
            serviceRequestId: s.serviceRequestId!,
            hmisNoteId: id,
            serviceRequestType: type,
          },
        },
      });
    }

    // create “other”
    for (const o of toCreateOther) {
      await createServiceRequest({
        variables: {
          data: {
            hmisNoteId: id,
            serviceRequestType: type,
            serviceOther: o.serviceOther!.trim(),
          },
        },
      });
    }

    // delete “other”
    for (const o of toDeleteOther) {
      await deleteService({
        variables: {
          data: {
            serviceRequestId: o.serviceRequestId!,
            hmisNoteId: id,
            serviceRequestType: type,
          },
        },
      });
    }
  }

  const methods = useForm<TProgramNoteFormInputsHmis>({
    resolver: zodResolver(ProgramNoteFormSchemaHmis),
    defaultValues: getProgramNoteFormEmptyStateHmis(),
    mode: 'onSubmit',
  });

  const onSubmit: SubmitHandler<TProgramNoteFormInputsHmis> = async (
    values
  ) => {
    try {
      // 1. Separate Draft Tasks from the Note fields
      // We do this because 'draftTasks' is not part of the HmisProgramNoteSchemaOutput
      const { tasks, ...noteFields } = values;

      // 2. Validate/Parse Note fields
      const payload = ProgramNoteFormSchemaOutputHmis.parse(noteFields);
      const { location, services, ...rest } = payload;

      // 3. Create Note
      const createResponse = await createHmisNote({
        variables: {
          data: {
            hmisClientProfileId: clientId,
            ...rest,
          },
        },
        errorPolicy: 'all',
      });

      const { data, error } = createResponse;

      // Handle Validation Errors
      if (CombinedGraphQLErrors.is(error)) {
        const fieldErrors = extractExtensionFieldErrors(
          error,
          NoteFormFieldNamesHmis
        );
        if (fieldErrors.length) {
          applyManualFormErrors(fieldErrors, methods.setError);
          return;
        }
      }

      // Handle Generic Errors
      if (error) {
        throw new Error(error.message);
      }

      const newNote = data?.createHmisNote;

      if (newNote?.__typename !== 'HmisNoteType' || !newNote?.id) {
        throw new Error('Failed to create HMIS Note');
      }

      const hmisNoteId = newNote.id;
      if (location) {
        await updateHmisNoteLocation({
          variables: {
            data: {
              id: hmisNoteId,
              location: {
                point: [location.longitude, location.latitude],
                address: {
                  formattedAddress: location.formattedAddress,
                  addressComponents: JSON.stringify(location.components ?? []),
                },
              },
            },
          },
        });
      }
      // 4. Create Tasks (Link to the new Note)

      await applyTasks(tasks, hmisNoteId, clientId);

      const draftServices = services ?? {};

      await applyBucket(
        hmisNoteId,
        ServiceRequestTypeEnum.Provided,
        draftServices[ServiceRequestTypeEnum.Provided]
      );

      await applyBucket(
        hmisNoteId,
        ServiceRequestTypeEnum.Requested,
        draftServices[ServiceRequestTypeEnum.Requested]
      );

      // 5. Success - Redirect
      router.replace(
        `/client/${clientId}?activeTab=${ClientViewTabEnum.Interactions}`
      );
    } catch (error) {
      console.error('[HmisProgramNoteCreate] error:', error);
      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  return (
    <FormProvider {...methods}>
      <Form.Page
        actionProps={{
          onSubmit: handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: isSubmitting,
        }}
      >
        <ProgramNoteFormHmis clientId={clientId} />
      </Form.Page>
    </FormProvider>
  );
}
