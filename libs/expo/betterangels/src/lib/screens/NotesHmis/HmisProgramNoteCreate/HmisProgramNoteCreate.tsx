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
  HmisProgramNoteForm,
  HmisProgramNoteFormSchema,
  HmisProgramNoteFormSchemaOutput,
  THmisProgramNoteFormInputs,
  THmisProgramNoteFormOutputs,
} from '../HmisProgramNoteForm';
import {
  getHmisProgramNoteFormEmptyState,
  HmisNoteFormFieldNames,
} from '../HmisProgramNoteForm/formSchema';
import splitBucket from '../utils/splitBucket';
import { CreateHmisNoteDocument } from './__generated__/hmisCreateClientNote.generated';
import {
  CreateHmisServiceRequestDocument,
  RemoveHmisNoteServiceRequestDocument,
} from './__generated__/HmisServiceRequest.generated';
import { UpdateHmisNoteLocationDocument } from './__generated__/updateHmisNoteLocation.generated';

type TProps = {
  clientId: string;
  arrivedFrom?: string;
};

export function HmisProgramNoteCreate(props: TProps) {
  const { clientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisNote] = useMutation(CreateHmisNoteDocument);
  const [updateHmisNoteLocation] = useMutation(UpdateHmisNoteLocationDocument);
  const [deleteService] = useMutation(RemoveHmisNoteServiceRequestDocument);
  const [createServiceRequest] = useMutation(CreateHmisServiceRequestDocument);

  async function applyBucket(
    noteId: string,
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
            hmisNoteId: noteId,
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
            hmisNoteId: noteId,
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
            hmisNoteId: noteId,
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
            hmisNoteId: noteId,
            serviceRequestType: type,
          },
        },
      });
    }
  }

  const methods = useForm<THmisProgramNoteFormInputs>({
    resolver: zodResolver(HmisProgramNoteFormSchema),
    defaultValues: getHmisProgramNoteFormEmptyState(),
  });

  const onSubmit: SubmitHandler<THmisProgramNoteFormInputs> = async (
    values
  ) => {
    try {
      const payload: THmisProgramNoteFormOutputs =
        HmisProgramNoteFormSchemaOutput.parse(values);

      const { location, services, ...rest } = payload;

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

      // if form field errors: handle and exit
      if (CombinedGraphQLErrors.is(error)) {
        const fieldErrors = extractExtensionFieldErrors(
          error,
          HmisNoteFormFieldNames
        );

        if (fieldErrors.length) {
          applyManualFormErrors(fieldErrors, methods.setError);

          return;
        }
      }

      // non-validation error: throw
      if (error) {
        throw new Error(error.message);
      }

      const result = data?.createHmisNote;

      if (result?.__typename !== 'HmisNoteType') {
        throw new Error('typename is not HmisNoteType');
      }

      const hmisNoteId = result.id;

      if (location) {
        await updateHmisNoteLocation({
          variables: {
            data: {
              id: hmisNoteId,
              location: {
                point: [location.longitude, location.latitude],
                address: location.formattedAddress
                  ? {
                      formattedAddress: location.formattedAddress,
                      addressComponents: location.components,
                    }
                  : null,
              },
            },
          },
        });
      }
      const noteId = result.id;

      const draftServices = services ?? {};

      await applyBucket(
        noteId,
        ServiceRequestTypeEnum.Provided,
        draftServices[ServiceRequestTypeEnum.Provided]
      );

      await applyBucket(
        noteId,
        ServiceRequestTypeEnum.Requested,
        draftServices[ServiceRequestTypeEnum.Requested]
      );

      router.replace(
        `/client/${clientId}?activeTab=${ClientViewTabEnum.Interactions}`
      );
    } catch (error) {
      console.error('[createHmisNoteMutation] error:', error);

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
        <HmisProgramNoteForm clientId={clientId} />
      </Form.Page>
    </FormProvider>
  );
}
