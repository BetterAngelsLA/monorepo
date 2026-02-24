import { CombinedGraphQLErrors } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  DeleteModal,
  Form,
  LoadingView,
} from '@monorepo/expo/shared/ui-components';
import { toLocalCalendarDate } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { ServiceRequestTypeEnum } from '../../../apollo';
import { extractExtensionFieldErrors } from '../../../apollo/graphql/response/extractExtensionFieldErrors';
import { applyManualFormErrors } from '../../../errors';
import { normalizeService } from '../../../helpers';
import { useSnackbar } from '../../../hooks';
import { InteractionListHmisDocument } from '../../../ui-components/InteractionListHmis/__generated__/interactionListHmis.generated';
import {
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_QUERY_ORDER,
} from '../../../ui-components/InteractionListHmis/constants';
import { ClientViewTabEnum } from '../../Client/ClientTabs';

import {
  CreateServiceRequestHmisDocument,
  RemoveServiceRequestHmisDocument,
} from '../ProgramNoteCreateHmis/__generated__/ServiceRequestHmis.generated';
import { UpdateNoteLocationHmisDocument } from '../ProgramNoteCreateHmis/__generated__/updateNoteLocationHmis.generated';
import {
  NoteFormFieldNamesHmis,
  ProgramNoteFormHmis,
  ProgramNoteFormSchemaHmis,
  ProgramNoteFormSchemaOutputHmis,
  TProgramNoteFormInputsHmis,
  TProgramNoteFormOutputsHmis,
  programNoteFormEmptyStateHmis,
} from '../ProgramNoteFormHmis';
import splitBucket from '../utils/splitBucket';
import { useApplyTasks } from '../utils/useApplyTasks';
import { HmisNoteDocument } from './__generated__/getClientNoteHmis.generated';
import {
  DeleteNoteHmisDocument,
  UpdateNoteHmisDocument,
} from './__generated__/updateClientNoteHmis.generated';

type TProps = {
  id: string;
  clientId: string;
  arrivedFrom?: string;
  onSuccess?: () => void;
};

export function ProgramNoteEditHmis(props: TProps) {
  const { id, clientId } = props;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [updateHmisNoteMutation] = useMutation(UpdateNoteHmisDocument);
  const [updateHmisNoteLocation] = useMutation(UpdateNoteLocationHmisDocument);
  const [deleteService] = useMutation(RemoveServiceRequestHmisDocument);
  const [createServiceRequest] = useMutation(CreateServiceRequestHmisDocument);
  const [deleteHmisNote] = useMutation(DeleteNoteHmisDocument, {
    refetchQueries: [
      {
        query: InteractionListHmisDocument,
        variables: {
          filters: { hmisClientProfile: clientId },
          pagination: { offset: 0, limit: DEFAULT_PAGINATION_LIMIT },
          ordering: DEFAULT_QUERY_ORDER,
        },
      },
    ],
  });
  const { applyTasks } = useApplyTasks();

  async function deleteHmisNoteFunction() {
    try {
      await deleteHmisNote({
        variables: {
          id,
        },
      });
      router.dismissTo(
        `/client/${clientId}?activeTab=${ClientViewTabEnum.Interactions}`
      );
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Failed to delete note.',
        type: 'error',
      });
    }
  }

  async function applyBucket(
    id: string,
    type: ServiceRequestTypeEnum,
    bucket: any
  ) {
    const { toCreateStandard, toDeleteStandard, toCreateOther, toDeleteOther } =
      splitBucket(bucket);

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
    defaultValues: programNoteFormEmptyStateHmis,
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

    const existingProvidedServices =
      noteResult.providedServices?.map(normalizeService) ?? [];

    const existingRequestedServices =
      noteResult.requestedServices?.map(normalizeService) ?? [];

    methods.reset({
      ...programNoteFormEmptyStateHmis,
      title: noteResult.title ?? '',
      date: toLocalCalendarDate(noteResult.date),
      note: noteResult.note ?? '',
      refClientProgram: noteResult.refClientProgram ?? '',
      services: {
        [ServiceRequestTypeEnum.Provided]: {
          serviceRequests: existingProvidedServices,
        },
        [ServiceRequestTypeEnum.Requested]: {
          serviceRequests: existingRequestedServices,
        },
      },
      location: {
        longitude: noteResult.location?.point[0],
        latitude: noteResult.location?.point[1],
        formattedAddress: noteResult.location?.address
          ? `${noteResult.location?.address.street}, ${noteResult.location?.address.city}, ${noteResult.location?.address.state} ${noteResult.location?.address.zipCode}`
          : undefined,
        shortAddressName:
          noteResult.location?.address && noteResult.location?.address.street
            ? noteResult.location?.address.street
            : undefined,
      },
      tasks: noteResult.tasks || [],
    });
  }, [noteData, methods]);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const formDisabled = !noteData || isSubmitting;

  const onSubmit: SubmitHandler<TProgramNoteFormInputsHmis> = async (
    values
  ) => {
    if (formDisabled) {
      return;
    }

    try {
      const payload: TProgramNoteFormOutputsHmis =
        ProgramNoteFormSchemaOutputHmis.parse(values);

      const { services, location, tasks, ...rest } = payload;

      const updateResponse = await updateHmisNoteMutation({
        variables: {
          data: {
            id,
            ...rest,
          },
        },
        errorPolicy: 'all',
      });

      const { data, error } = updateResponse;

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

      if (error) {
        throw new Error(error.message);
      }

      const result = data?.updateHmisNote;

      if (result?.__typename !== 'HmisNoteType') {
        throw new Error('typename is not HmisNoteType');
      }

      const draftServices = services ?? {};
      const locationDirty = methods.getFieldState('location').isDirty;
      if (locationDirty && location) {
        await updateHmisNoteLocation({
          variables: {
            data: {
              id,
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

      await applyTasks(tasks, id, clientId);

      await applyBucket(
        id,
        ServiceRequestTypeEnum.Provided,
        draftServices[ServiceRequestTypeEnum.Provided]
      );

      await applyBucket(
        id,
        ServiceRequestTypeEnum.Requested,
        draftServices[ServiceRequestTypeEnum.Requested]
      );

      await refetch();

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
        <ProgramNoteFormHmis
          editing={true}
          clientId={clientId}
          disabled={formDisabled}
        />
        <DeleteModal
          body="All data associated with this note will be deleted"
          title="Delete note?"
          onDelete={deleteHmisNoteFunction}
          button={
            <Button
              accessibilityHint="deletes note"
              title="Delete Note"
              variant="negative"
              size="full"
              mt="xs"
            />
          }
        />
      </Form.Page>
    </FormProvider>
  );
}
