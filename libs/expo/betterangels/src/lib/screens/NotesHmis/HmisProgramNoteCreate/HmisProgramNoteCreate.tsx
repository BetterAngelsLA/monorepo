import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import {
  CreateNoteServiceRequestDocument,
  DeleteServiceRequestDocument,
  ServiceRequestTypeEnum,
} from '../../../apollo';
import { extractExtensionFieldErrors } from '../../../apollo/graphql/response/extractExtensionFieldErrors';
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

type TProps = {
  clientId: string;
  arrivedFrom?: string;
};

function splitBucket(bucket?: {
  serviceRequests?: {
    serviceRequestId?: string;
    serviceId?: string;
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

  const toCreateStandard = serviceRequests.filter(
    (s) => !s.serviceRequestId && !s.markedForDeletion && !!s.serviceId
  );
  const toDeleteStandard = serviceRequests.filter(
    (s) => !!s.serviceRequestId && !!s.markedForDeletion
  );

  const toCreateOther = serviceRequestsOthers.filter(
    (o) =>
      !o.serviceRequestId &&
      !o.markedForDeletion &&
      !!o.serviceOther &&
      o.serviceOther.trim().length > 0
  );
  const toDeleteOther = serviceRequestsOthers.filter(
    (o) => !!o.serviceRequestId && !!o.markedForDeletion
  );

  return { toCreateStandard, toDeleteStandard, toCreateOther, toDeleteOther };
}

export function HmisProgramNoteCreate(props: TProps) {
  const { clientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [createHmisNote] = useMutation(CreateHmisNoteDocument);
  const [deleteService] = useMutation(DeleteServiceRequestDocument);
  const [createServiceRequest] = useMutation(CreateNoteServiceRequestDocument);

  async function applyBucket(
    noteId: string,
    type: ServiceRequestTypeEnum,
    bucket: Parameters<typeof splitBucket>[0]
  ) {
    const { toCreateStandard, toDeleteStandard, toCreateOther, toDeleteOther } =
      splitBucket(bucket);

    // create standard
    for (const s of toCreateStandard) {
      await createServiceRequest({
        variables: {
          data: {
            noteId,
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
            noteId,
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

      const draft = services ?? {};

      await applyBucket(
        noteId,
        ServiceRequestTypeEnum.Provided,
        draft[ServiceRequestTypeEnum.Provided]
      );

      await applyBucket(
        noteId,
        ServiceRequestTypeEnum.Requested,
        draft[ServiceRequestTypeEnum.Requested]
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
