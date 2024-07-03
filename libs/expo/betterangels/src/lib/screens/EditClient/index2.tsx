import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  Loading,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { format, parse } from 'date-fns';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
import { useCreateClientProfileMutation } from '../AddClient/__generated__/AddClient.generated';
import Name from './Name';
import {
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} from './__generated__/EditClient.generated';

type ErrorStateType = {
  firstName?: string;
  email?: string;
};

export default function EditClient() {
  const { id } = useLocalSearchParams();

  const { data, loading, error, refetch } = useGetClientProfileQuery({
    variables: { id },
    skip: !id,
  });

  const INITIAL_STATE = {
    user: {
      firstName: data?.clientProfile?.user?.firstName || '',
      lastName: data?.clientProfile?.user?.lastName || '',
      email: data?.clientProfile?.user?.email || '',
    },
    // address: data?.clientProfile?.address || '',
    // dateOfBirth: data?.clientProfile?.dateOfBirth as Date | undefined,
    // gender: data?.clientProfile?.gender as GenderEnum | undefined,
    // hmisId: data?.clientProfile?.hmisId || null,
    // nickname: data?.clientProfile?.nickname || '',
    // phoneNumber: data?.clientProfile?.phoneNumber || '',
    // preferredLanguage: data?.clientProfile?.preferredLanguage as
    //   | LanguageEnum
    //   | undefined,
    // pronouns: '',
    // spokenLanguages: [] as LanguageEnum[],
    // veteranStatus: data?.clientProfile?.veteranStatus as
    //   | YesNoPreferNotToSayEnum
    //   | undefined,
  };

  const [client, setClient] = useState<
    CreateClientProfileInput | UpdateClientProfileInput | undefined
  >(INITIAL_STATE);
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [createClient] = useCreateClientProfileMutation();
  const [updateClient] = useUpdateClientProfileMutation();
  const [errorState, setErrorState] = useState<ErrorStateType>({});
  const router = useRouter();
  const [initialDateOfBirth, setInitialDateOfBirth] = useState<
    Date | undefined
  >();
  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  const createClientProfile = async () => {
    console.log('CREATING');
    console.log(client);
    // if (!client.user.firstName) {
    //   setErrorState('First Name is required');
    //   return;
    // }
    // setErrorState(null);
    const input = {
      ...client,
    };

    // if (client.dateOfBirth) {
    //   input.dateOfBirth = new Date(client.dateOfBirth);
    // }

    try {
      const { data } = await createClient({
        variables: {
          data: input,
        },
      });
      if (
        data?.createClientProfile?.__typename === 'OperationInfo' &&
        data.createClientProfile.messages
      ) {
        throw new Error(
          `Failed to create a client profile: ${data?.createClientProfile.messages[0].message}`
        );
      }
      navigation.goBack();
    } catch (err) {
      throw new Error(`Failed to create a client profile: ${err}`);
    }
  };

  const updateClientProfile = async () => {
    console.log('UPDATING');
    console.log(client);
    if (!client?.user?.firstName) {
      setErrorState((prev) => ({
        ...prev,
        firstName: 'First Name is required',
      }));

      return;
    }
    // if (client && client.user?.email && !Regex.email.test(client.user.email)) {
    //   setErrorState((prev) => ({
    //     ...prev,
    //     email: 'Enter a valid email address.',
    //   }));
    //   return;
    // }
    // setErrorState({});
    const input = {
      ...client,
      id,
      user: {
        id: client.user.id || null,
        firstName: client.user.firstName,
        lastName: client.user.lastName,
        email: client.user.email,
        middleName: client.user.middleName,
      },
    };

    // if (client.dateOfBirth) {
    //   const parsedDate = parse(client.dateOfBirth, 'MM/dd/yyyy', new Date());
    //   input.dateOfBirth = format(parsedDate, 'yyyy-MM-dd');
    // }

    try {
      console.log('try input');
      console.log(input);
      const { data } = await updateClient({
        variables: {
          data: input,
        },
      });
      console.log('try data');
      console.log(data);
      console.log(data?.updateClientProfile.messages[0]);
      // if (
      //   data?.updateClientProfile?.__typename === 'OperationInfo' &&
      //   data.updateClientProfile.messages
      // ) {
      //   if (
      //     data.updateClientProfile.messages[0].message ===
      //     'User with this Email already exists.'
      //   ) {
      //     setErrorState({
      //       firstName: errorState?.firstName,
      //       email: data.updateClientProfile.messages[0].message,
      //     });
      //     return;
      //   } else {
      //     throw new Error(
      //       `Failed to update a client profile 3: ${data?.updateClientProfile.messages[0].message}`
      //     );
      //   }
      // }
      // refetch();
      // router.replace(`/client/${id}`);
    } catch (err) {
      throw new Error(`Failed to update a client profile 2: ${err}`);
    }
  };

  useEffect(() => {
    if (!data || !('clientProfile' in data)) return;

    const clientInput = {
      ...data.clientProfile,
    };

    if (data.clientProfile.dateOfBirth) {
      const parsedDate = parse(
        data.clientProfile.dateOfBirth,
        'yyyy-MM-dd',
        new Date()
      );
      setInitialDateOfBirth(parsedDate);
      clientInput.dateOfBirth = format(parsedDate, 'MM/dd/yyyy');
    }

    delete clientInput.__typename;
    delete clientInput.user.__typename;

    setClient(clientInput);
  }, [data]);

  const props = {
    expanded,
    setExpanded,
    client,
    setClient,
    scrollRef,
    errorState,
  };

  if (loading || !client)
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

  // if (error) throw new Error('Something went wrong. Please try again.');

  return (
    <View style={{ flex: 1 }}>
      <Text>yo</Text>
      <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <Name {...props} />
        {/* <Dob initialDateOfBirth={initialDateOfBirth} {...props} />
        <Gender {...props} />
        <Language {...props} />
        <HMIS {...props} />
        <ContactInfo {...props} />
        <VeteranStatus {...props} /> */}
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
        onSubmit={id ? updateClientProfile : createClientProfile}
      />
    </View>
  );
}
