import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import {
  DeleteServiceRequestDocument,
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
import { CreateHmisNoteDocument } from './__generated__/hmisCreateClientNote.generated';
import { CreateHmisServiceRequestDocument } from './__generated__/HmisServiceRequest.generated';

type TProps = {
  clientId: string;
  arrivedFrom?: string;
};

function splitBucket(bucket?: {
  serviceRequests?: {
    id?: string;
    service?: { id: string; label?: string } | null;
    markedForDeletion?: boolean;
  }[];
  serviceRequestsOthers?: {
    serviceRequestId?: string;
    serviceOther?: string | null;
    markedForDeletion?: boolean;
  }[];
}) {
  const serviceRequests = bucket?.serviceRequests ?? [];
  const serviceRequestsOthers = bucket?.serviceRequestsOthers ?? [];

  // CREATE standard: brand-new rows (no id), not marked for deletion, with a selected service
  const toCreateStandard = serviceRequests
    .filter((s) => !s.id && !s.markedForDeletion && !!s.service?.id)
    .map((s) => ({ serviceId: s.service!.id }));

  // DELETE standard: persisted rows (has id) explicitly marked for deletion
  const toDeleteStandard = serviceRequests
    .filter((s) => !!s.id && !!s.markedForDeletion)
    .map((s) => ({ serviceRequestId: s.id! }));

  // CREATE “other”: brand-new (no serviceRequestId), not marked for deletion, with non-empty text
  const toCreateOther = serviceRequestsOthers
    .filter(
      (o) =>
        !o.serviceRequestId &&
        !o.markedForDeletion &&
        !!o.serviceOther &&
        o.serviceOther.trim().length > 0
    )
    .map((o) => ({ serviceOther: o.serviceOther!.trim() }));

  // DELETE “other”: persisted (has serviceRequestId) and marked for deletion
  const toDeleteOther = serviceRequestsOthers
    .filter((o) => !!o.serviceRequestId && !!o.markedForDeletion)
    .map((o) => ({ serviceRequestId: o.serviceRequestId! }));

  return { toCreateStandard, toDeleteStandard, toCreateOther, toDeleteOther };
}

export function HmisProgramNoteCreate(props: TProps) {
  const { clientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisNote] = useMutation(CreateHmisNoteDocument);
  const [deleteService] = useMutation(DeleteServiceRequestDocument);
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
      await deleteService({ variables: { data: { id: s.serviceRequestId! } } });
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
      await deleteService({ variables: { data: { id: o.serviceRequestId! } } });
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

      const { services, ...rest } = payload;

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
