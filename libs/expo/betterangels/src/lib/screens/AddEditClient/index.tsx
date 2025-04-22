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
import {
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  CreateClientProfileInput,
  Ordering,
  SocialMediaEnum,
  UpdateClientProfileInput,
} from '../../apollo';
import { applyValidationErrors } from '../../helpers/parseClientProfileErrors';
import { useSnackbar } from '../../hooks';
import { MainScrollContainer } from '../../ui-components';
import { ClientProfilesDocument } from '../Clients/__generated__/Clients.generated';
import ContactInfo from './ContactInfo';
import DemographicInfo from './DemographicInfo';
import HouseholdMembers from './HouseholdMembers';
import ImportantNotes from './ImportantNotes';
import PersonalInfo from './PersonalInfo';
import RelevantContacts from './RelevantContacts';
import {
  useCreateClientProfileMutation,
  useDeleteClientProfileMutation,
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} from './__generated__/AddEditClient.generated';

type TValidationError = {
  field: string;
  location: string | undefined;
  errorCode: string;
};

const defaultSocialMedias = [
  {
    platform: SocialMediaEnum.Facebook,
    platformUserId: '',
  },
  {
    platform: SocialMediaEnum.Instagram,
    platformUserId: '',
  },
  {
    platform: SocialMediaEnum.Linkedin,
    platformUserId: '',
  },
  {
    platform: SocialMediaEnum.Tiktok,
    platformUserId: '',
  },
];

export default function AddEditClient({ id }: { id?: string }) {
  const checkId = id ? { variables: { id } } : { skip: true };

  const { showSnackbar } = useSnackbar();
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
            firstName: Ordering.AscNullsLast,
            id: Ordering.Desc,
          },
        },
      },
    ],
  });
  const [updateClientProfile, { loading: isUpdating }] =
    useUpdateClientProfileMutation();
  const [createClientProfile, { loading: isCreating }] =
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
              firstName: Ordering.AscNullsLast,
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

      showSnackbar({
        message: 'Failed to delete client.',
        type: 'error',
      });
    }
  }

  const onSubmit: SubmitHandler<
    UpdateClientProfileInput | CreateClientProfileInput
  > = async (values) => {
    if (values.contacts && values.contacts?.length > 0) {
      values.contacts = values.contacts.map((contact) => ({
        ...contact,
        phoneNumber: contact.phoneNumber === '' ? null : contact.phoneNumber,
      }));
    }

    const filteredSocialMediaProfiles =
      values.socialMediaProfiles?.filter((item) => item.platformUserId) || [];

    const filteredPhoneNumbers =
      values.phoneNumbers?.filter((item) => item.number) || [];

    if (values.dateOfBirth) {
      values.dateOfBirth = values.dateOfBirth.toISOString().split('T')[0];
    }

    // passing an empty string to the backend will violate unique constraint
    if (typeof values.email === 'string') {
      values.email = values.email || null;
    }

    values.householdMembers = values.householdMembers?.map((member) => {
      if (member.dateOfBirth) {
        member.dateOfBirth = member.dateOfBirth.toISOString().split('T')[0];
      }
      return member;
    });
    // @ts-expect-error: displayPronouns shouldn't be included in the input. This is a temporary fix.
    delete values.displayPronouns;
    delete values.profilePhoto;
    try {
      let operationErrors: TValidationError[] | undefined;
      if (id) {
        const input = {
          ...(values as UpdateClientProfileInput),
          socialMediaProfiles: filteredSocialMediaProfiles,
          phoneNumbers: filteredPhoneNumbers,
          id,
        };

        if (!data || !('clientProfile' in data)) return;

        const updateResponse = await updateClientProfile({
          variables: {
            data: {
              ...input,
            },
          },
          errorPolicy: 'all',
        });

        operationErrors = updateResponse.errors?.[0].extensions?.['errors'] as
          | TValidationError[]
          | undefined;

        if (!operationErrors) {
          refetch();
        }
      } else {
        const input = values as CreateClientProfileInput;
        const createResponse = await createClientProfile({
          variables: { data: input as CreateClientProfileInput },
          errorPolicy: 'all',
        });
        operationErrors = createResponse.errors?.[0].extensions?.['errors'] as
          | TValidationError[]
          | undefined;
      }

      if (operationErrors) {
        applyValidationErrors(operationErrors, methods.setError);
        return;
      }

      if (id) {
        router.replace(`/client/${id}`);
      } else {
        router.replace('/');
      }
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Sorry, there was an error updating this profile.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    if (!data || !('clientProfile' in data) || !id) return;

    const { displayCaseManager, ...updatedClientInput } = data.clientProfile;

    const existingSocialMediaProfiles =
      data.clientProfile.socialMediaProfiles || [];

    const updatedSocialMediaProfiles = defaultSocialMedias.map(
      (defaultProfile) => {
        const existingProfile = existingSocialMediaProfiles.find(
          (profile) => profile.platform === defaultProfile.platform
        );

        if (existingProfile) {
          const { __typename, ...cleanedProfile } = existingProfile;
          return cleanedProfile;
        }

        return defaultProfile;
      }
    );

    const existingPhoneNumbers = data.clientProfile.phoneNumbers?.map(
      ({ __typename, ...rest }) => rest
    );

    const phoneNumberEmpyInput = [{ number: '', isPrimary: false }];

    const clientInput = {
      ...updatedClientInput,
      socialMediaProfiles: updatedSocialMediaProfiles,
      phoneNumbers: existingPhoneNumbers?.length
        ? existingPhoneNumbers
        : phoneNumberEmpyInput,
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
    delete clientInput.displayGender;
    delete clientInput.displayPronouns;

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

  if (loading) {
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
  }

  if (error) {
    console.error(error);

    showSnackbar({
      message: 'Something went wrong. Please try again.',
      type: 'error',
    });
  }

  return (
    <FormProvider {...methods}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <MainScrollContainer
            ref={scrollRef}
            bg={Colors.NEUTRAL_EXTRA_LIGHT}
            keyboardAware={true}
          >
            <PersonalInfo clientId={id} {...props} />
            <ImportantNotes {...props} />
            <DemographicInfo {...props} />
            <ContactInfo {...props} />
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
            disabled={!!methods.formState.errors.californiaId}
            cancel={
              <TextButton
                onPress={router.back}
                fontSize="sm"
                accessibilityHint="cancels the update of a new client profile"
                title="Cancel"
              />
            }
            onSubmit={methods.handleSubmit(onSubmit)}
            isLoading={isCreating || isUpdating}
          />
        </View>
      </TouchableWithoutFeedback>
    </FormProvider>
  );
}
