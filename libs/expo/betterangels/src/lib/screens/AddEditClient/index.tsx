import { ApolloError } from '@apollo/client';
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
import { GraphQLFormattedError } from 'graphql';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import {
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
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
import DemographicInfo from './DemographicInfo';
import HouseholdMembers from './HouseholdMembers';
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
  const [updateClient, { error: updateMutationError }] =
    useUpdateClientProfileMutation();

  const [createClient, { error: createMutationError }] =
    useCreateClientProfileMutation({
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

  const extractErrorFields = (errors: ApolloError) => {
    return errors.graphQLErrors
      .map((error: GraphQLFormattedError) => {
        const regex = /data\.(.*?);/;
        const match = error.message.match(regex);
        return match ? match[1] : null;
      })
      .filter(Boolean);
  };

  const getMutationError = useCallback(
    (
      updateError: typeof updateMutationError,
      createError: typeof createMutationError
    ) => {
      if (updateError) return updateError;
      if (createError) return createError;
      return null;
    },
    []
  );

  const handleMutationError = useCallback(
    (mutationError: ApolloError) => {
      const extractedFields = extractErrorFields(mutationError).filter(
        (dataField) => dataField !== null
      );
      const extensions = mutationError.cause?.extensions as {
        message?: string;
      };
      if (extensions?.message) {
        extractedFields.map((dataField) => {
          return methods.setError(
            dataField as
              | keyof UpdateClientProfileInput
              | keyof CreateClientProfileInput,
            {
              type: 'custom',
              message: extensions.message,
            }
          );
        });
      }
    },
    [methods]
  );

  useEffect(() => {
    const mutationError = getMutationError(
      updateMutationError,
      createMutationError
    );
    if (mutationError) {
      handleMutationError(mutationError);
    }
  }, [
    createMutationError,
    getMutationError,
    handleMutationError,
    updateMutationError,
  ]);

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

    values.householdMembers = values.householdMembers?.map((member) => {
      if (member.dateOfBirth) {
        member.dateOfBirth = member.dateOfBirth.toISOString().split('T')[0];
      }
      return member;
    });
    // @ts-expect-error: displayPronouns shouldn't be included in the input. This is a temporary fix.
    delete values.displayPronouns;

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
              user: {
                id: data?.clientProfile.user.id,
                ...input.user,
              },
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
      if (methods.formState.errors) {
        return;
      }
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

    if (data.clientProfile.householdMembers) {
      clientInput.householdMembers = data.clientProfile.householdMembers.map(
        (member) => {
          const { __typename, ...rest } = member;
          if (rest.dateOfBirth) {
            const parsedDate = parse(
              rest.dateOfBirth,
              'yyyy-MM-dd',
              new Date()
            );
            return {
              ...rest,
              dateOfBirth: parsedDate,
            };
          }
          return rest;
        }
      );
    }

    delete clientInput.__typename;
    delete clientInput.user.__typename;

    const newHmisProfiles = clientInput.hmisProfiles?.map((profile) => {
      const { __typename, ...rest } = profile;
      return rest;
    });

    const newClients = clientInput.contacts?.map((contact) => {
      const { __typename, ...rest } = contact;
      return rest;
    });

    methods.reset({
      ...clientInput,
      contacts: newClients,
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
            <PersonalInfo {...props} />
            <DemographicInfo {...props} />
            <ContactInfo {...props} />
            <VeteranStatus {...props} />
            <RelevantContacts {...props} />
            <HouseholdMembers {...props} />
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
      </TouchableWithoutFeedback>
    </FormProvider>
  );
}
