import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, LoadingView } from '@monorepo/expo/shared/ui-components';
import { toLocalCalendarDate } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { ServiceRequestTypeEnum } from '../../../apollo';
import { extractExtensionFieldErrors } from '../../../apollo/graphql/response/extractExtensionFieldErrors';
import { applyManualFormErrors } from '../../../errors';
import { useSnackbar } from '../../../hooks';
import { ClientViewTabEnum } from '../../Client/ClientTabs';
import {
  CreateHmisServiceRequestDocument,
  RemoveHmisNoteServiceRequestDocument,
} from '../HmisProgramNoteCreate/__generated__/HmisServiceRequest.generated';
import {
  HmisNoteFormFieldNames,
  HmisProgramNoteForm,
  HmisProgramNoteFormSchema,
  HmisProgramNoteFormSchemaOutput,
  THmisProgramNoteFormInputs,
  THmisProgramNoteFormOutputs,
  hmisProgramNoteFormEmptyState,
} from '../HmisProgramNoteForm';
import { ViewHmisNoteQuery } from '../HmisProgramNoteView/__generated__/HmisProgramNoteView.generated';
import splitBucket from '../utils/splitBucket';
import { HmisNoteDocument } from './__generated__/hmisGetClientNote.generated';
import { UpdateHmisNoteDocument } from './__generated__/hmisUpdateClientNote.generated';

type TProps = {
  id: string;
  clientId: string;
  arrivedFrom?: string;
  onSuccess?: () => void;
};

export function HmisProgramNoteEdit(props: TProps) {
  const { id, clientId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [existingNote, setExistingNote] =
    useState<ViewHmisNoteQuery['hmisNote']>();
  const [updateHmisNoteMutation] = useMutation(UpdateHmisNoteDocument);
  const [deleteService] = useMutation(RemoveHmisNoteServiceRequestDocument);
  const [createServiceRequest] = useMutation(CreateHmisServiceRequestDocument);

  async function applyBucket(
    noteId: string,
    type: ServiceRequestTypeEnum,
    bucket: any
  ) {
    const { toCreateStandard, toDeleteStandard, toCreateOther, toDeleteOther } =
      splitBucket(bucket);

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
    defaultValues: hmisProgramNoteFormEmptyState,
  });

  const {
    data: noteData,
    loading: noteDataLoading,
    error: getNoteNetworkError,
    refetch,
  } = useQuery(HmisNoteDocument, {
    variables: { id },
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    const noteResult = noteData?.hmisNote;

    if (noteResult?.__typename !== 'HmisNoteType') {
      return;
    }

    setExistingNote(noteResult);
  }, [noteData]);

  useEffect(() => {
    if (!existingNote) {
      return;
    }

    const existingProvidedServices = existingNote.providedServices || [];
    const existingRequestedServices = existingNote.requestedServices || [];

    methods.reset({
      ...hmisProgramNoteFormEmptyState,
      title: existingNote.title ?? '',
      date: toLocalCalendarDate(existingNote.date),
      note: existingNote.note ?? '',
      refClientProgram: existingNote.refClientProgram ?? '',
      services: {
        [ServiceRequestTypeEnum.Provided]: {
          serviceRequests: existingProvidedServices,
        },
        [ServiceRequestTypeEnum.Requested]: {
          serviceRequests: existingRequestedServices,
        },
      },
    });
  }, [existingNote, methods]);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const formDisabled = !existingNote || isSubmitting;

  const onSubmit: SubmitHandler<THmisProgramNoteFormInputs> = async (
    values
  ) => {
    if (formDisabled) {
      return;
    }

    try {
      const payload: THmisProgramNoteFormOutputs =
        HmisProgramNoteFormSchemaOutput.parse(values);

      const { services, ...rest } = payload;

      const updateResponse = await updateHmisNoteMutation({
        variables: {
          data: {
            id,
            ...rest,
          },
        },
        errorPolicy: 'all',
        refetchQueries: [{ query: HmisNoteDocument, variables: { id } }],
        awaitRefetchQueries: true,
      });

      const { data, error } = updateResponse;

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

      if (error) {
        throw new Error(error.message);
      }

      const result = data?.updateHmisNote;

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
      console.error('[updateHmisNoteMutation] error:', error);
      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  if (getNoteNetworkError) {
    console.error('getNoteNetworkError:', getNoteNetworkError);
  }

  if (noteDataLoading) {
    return <LoadingView />;
  }

  return (
    <FormProvider {...methods}>
      <Form.Page
        actionProps={{
          onSubmit: handleSubmit(onSubmit),
          onLeftBtnClick: router.back,
          disabled: formDisabled,
        }}
      >
        <HmisProgramNoteForm
          clientId={clientId}
          disabled={formDisabled}
          editing={true}
          noteId={id}
          existingTasks={existingNote?.tasks || []}
          refetch={refetch}
        />
      </Form.Page>
    </FormProvider>
  );
}
