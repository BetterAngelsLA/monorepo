import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  Button,
  DeleteModal,
  Loading,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { parse } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  Ordering,
  UpdateClientProfileInput,
} from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
import { ClientProfilesDocument } from '../Clients/__generated__/Clients.generated';
import {
  useCreateClientProfileMutation,
  useDeleteClientProfileMutation,
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} from './__generated__/AddEditClient.generated';
import ContactInfo from './ContactInfo';
import Gender from './Gender';
import HMIS from './HMIS';
import PersonalInfo from './PersonalInfo';
import RelevantContacts from './RelevantContacts';
import VeteranStatus from './VeteranStatus';

export default function AddEditClient({ id }: { id?: string }) {
  const checkId = id ? { variables: { id } } : { skip: true };
  const { data, loading, error, refetch } = useGetClientProfileQuery(checkId);

  const methods = useForm<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [deleteClient] = useDeleteClientProfileMutation({
    refetchQueries: [
      {
        query: ClientProfilesDocument,
        variables: {
          pagination: { limit: 20 + 1, offset: 0 },
          filters: {
            search: '',
          },
          order: {
            user_FirstName: Ordering.AscNullsFirst,
            id: Ordering.Desc,
          },
        },
      },
    ],
  });
  const [updateClient] = useUpdateClientProfileMutation();
  const [createClient] = useCreateClientProfileMutation({
    refetchQueries: [
      {
        query: ClientProfilesDocument,
        variables: {
          pagination: { limit: 20 + 1, offset: 0 },
          filters: {
            search: '',
          },
          order: {
            user_FirstName: Ordering.AscNullsFirst,
            id: Ordering.Desc,
          },
        },
      },
    ],
  });
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  async function deleteClientFunction() {
    if (!id) return;
    try {
      await deleteClient({
        variables: {
          id,
        },
      });
      router.replace('/clients');
    } catch (err) {
      console.error(err);
    }
  }

  const onSubmit: SubmitHandler<
    UpdateClientProfileInput | CreateClientProfileInput
  > = async (values) => {
    if (values.dateOfBirth) {
      values.dateOfBirth = values.dateOfBirth.toISOString().split('T')[0];
    }

    try {
      let operationResult;

      if (id) {
        const input = {
          ...(values as UpdateClientProfileInput),
          id,
        };

        if (!data || !('clientProfile' in data)) return;

        const updateResponse = await updateClient({
          variables: {
            data: {
              ...input,
            },
          },
        });

        refetch();
        operationResult = updateResponse.data?.updateClientProfile;
      } else {
        const input = values as CreateClientProfileInput;
        const createResponse = await createClient({
          variables: { data: input as CreateClientProfileInput },
        });
        operationResult = createResponse.data?.createClientProfile;
      }

      if (
        operationResult?.__typename === 'OperationInfo' &&
        operationResult.messages
      ) {
        if (
          operationResult.messages[0].message ===
          'User with this Email already exists.'
        ) {
          methods.setError('user.email', {
            type: 'manual',
            message: 'User with this Email already exists.',
          });
          return;
        } else {
          throw new Error(
            `Failed to update a client profile 3: ${operationResult.messages[0].message}`
          );
        }
      }

      if (id) {
        router.replace(`/client/${id}`);
      } else {
        router.replace('/');
      }
    } catch (err) {
      console.log(err);
      throw new Error(`Failed to update a client profile 2: ${err}`);
    }
  };

  useEffect(() => {
    if (!data || !('clientProfile' in data) || !id) return;

    const clientInput = {
      ...data.clientProfile,
      user: {
        ...data.clientProfile.user,
      },
    };

    if (data.clientProfile.dateOfBirth) {
      const parsedDate = parse(
        data.clientProfile.dateOfBirth,
        'yyyy-MM-dd',
        new Date()
      );

      clientInput.dateOfBirth = parsedDate;
    }

    delete clientInput.__typename;
    delete clientInput.user.__typename;

    const newHmisProfiles = clientInput.hmisProfiles?.map((profile) => {
      const { __typename, ...rest } = profile;
      return rest;
    });

    const newInput = clientInput.contacts?.map((contact) => {
      const { __typename, ...rest } = contact;
      return rest;
    });

    methods.reset({
      ...clientInput,
      contacts: newInput,
      hmisProfiles: newHmisProfiles,
    });
  }, [data, id]);

  const props = {
    expanded,
    setExpanded,
    scrollRef,
  };

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loading size="large" />
      </View>
    );

  if (error) throw new Error('Something went wrong. Please try again.');

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1 }}>
        <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
          <PersonalInfo {...props} />
          <Gender {...props} />
          <HMIS {...props} />
          <ContactInfo {...props} />
          <VeteranStatus {...props} />
          <RelevantContacts {...props} />
          {id && (
            <DeleteModal
              body="All data associated with this client will be deleted. This action cannot be undone."
              title="Delete client?"
              onDelete={deleteClientFunction}
              button={
                <Button
                  accessibilityHint="deletes client"
                  title="Delete Client"
                  variant="negative"
                  size="full"
                  mt="xs"
                />
              }
            />
          )}
        </MainScrollContainer>
        <BottomActions
          submitTitle="Update"
          cancel={
            <TextButton
              onPress={router.back}
              fontSize="sm"
              accessibilityHint="cancels the update of a new client profile"
              title="Cancel"
            />
          }
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </View>
    </FormProvider>
  );
}
