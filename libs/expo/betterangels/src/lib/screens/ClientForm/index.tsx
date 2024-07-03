import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  Loading,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { format, parse } from 'date-fns';
import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  GenderEnum,
  LanguageEnum,
  YesNoPreferNotToSayEnum,
} from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
import {
  useGetClientProfileQuery,
  useUpdateClientProfileMutation,
} from '../EditClient/__generated__/EditClient.generated';
import ContactInfo from './ContactInfo';
import Dob from './Dob';
import Gender from './Gender';
import HMIS from './HMIS';
import Language from './Language';
import Name from './Name';
import VeteranStatus from './VeteranStatus';
import { useCreateClientProfileMutation } from './__generated__/AddClient.generated';

const INITIAL_STATE = {
  address: '',
  dateOfBirth: undefined as Date | undefined,
  gender: undefined as GenderEnum | undefined,
  hmisId: null,
  nickname: '',
  phoneNumber: '',
  preferredLanguage: undefined as LanguageEnum | undefined,
  pronouns: '',
  spokenLanguages: [] as LanguageEnum[],
  user: {
    firstName: '',
    lastName: '',
    email: '',
  },
  veteranStatus: undefined as YesNoPreferNotToSayEnum | undefined,
};

type ErrorStateType = {
  firstName?: string;
  email?: string;
};

type UpdateClientProfileInput = CreateClientProfileInput & {
  id: string;
};

export default function ClientForm({ id }: { id: string }) {
  const { data, loading, error, refetch } = useGetClientProfileQuery({
    variables: { id },
    skip: !id,
  });

  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [client, setClient] = useState<
    CreateClientProfileInput | UpdateClientProfileInput
  >(INITIAL_STATE);
  const [createClient] = useCreateClientProfileMutation();
  const [updateClient] = useUpdateClientProfileMutation();
  const [errorState, setErrorState] = useState<ErrorStateType>({});
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [initialDateOfBirth, setInitialDateOfBirth] = useState<
    Date | undefined
  >();
  console.log('errorState at load', errorState);
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

  const createClientProfile = async () => {
    if (!client.user.firstName) {
      setErrorState((prev) => ({
        ...prev,
        firstName: 'First Name is required',
      }));
      return;
    }
    setErrorState({});
    const input = {
      ...client,
    };

    if (client.dateOfBirth) {
      input.dateOfBirth = new Date(client.dateOfBirth);
    }

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
    // if (!client?.user?.firstName) {
    //   setErrorState((prev) => ({
    //     ...prev,
    //     firstName: 'First Name is required',
    //   }));

    //   return;
    // }
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
        id: client.user.id,
        firstName: client.user.firstName,
        lastName: client.user.lastName,
        email: client.user.email,
        middleName: client.user.middleName,
      },
    };

    if (client.dateOfBirth) {
      const parsedDate = parse(client.dateOfBirth, 'MM/dd/yyyy', new Date());
      input.dateOfBirth = format(parsedDate, 'yyyy-MM-dd');
    }

    try {
      console.log('try input', input);

      const { data } = await updateClient({
        variables: {
          data: input,
        },
      });
      console.log('try data', data);
      // console.log('messages', data?.updateClientProfile?.messages[0]);
      if (
        data?.updateClientProfile?.__typename === 'OperationInfo' &&
        data.updateClientProfile.messages
      ) {
        console.log('in the first if');
        if (
          data.updateClientProfile.messages[0].message ===
          'User with this Email already exists.'
        ) {
          console.log('in the second if');
          setErrorState({
            firstName: errorState?.firstName,
            email: data.updateClientProfile.messages[0].message,
          });
          return;
        } else {
          throw new Error(
            `Failed to update a client profile 3: ${data?.updateClientProfile.messages[0].message}`
          );
        }
      }
      console.log('refetch and redirect');
      refetch();
      router.replace(`/client/${id}`);
    } catch (err) {
      throw new Error(`Failed to update a client profile 2: ${err}`);
    }
  };

  // function submitForm() {
  //   if (!client.user.firstName) {
  //     setErrorState({ firstName: 'First Name is required' });
  //     return;
  //   }
  //   setErrorState({});

  //   let input = {
  //     ...client,
  //   };

  //   if (client.dateOfBirth) {
  //     input.dateOfBirth = new Date(client.dateOfBirth);
  //   }

  //   if (id) {
  //     input = {
  //       ...client,
  //       id,
  //       user: {
  //         id: client.user.id || null,
  //         firstName: client.user.firstName,
  //         lastName: client.user.lastName,
  //         email: client.user.email,
  //         middleName: client.user.middleName,
  //       },
  //     };
  //     updateClientProfile(input);
  //   } else {
  //     createClientProfile(input);
  //   }
  // }

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

  if (error) throw new Error('Something went wrong. Please try again.');

  return (
    <View style={{ flex: 1 }}>
      <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <Name setErrorState={setErrorState} {...props} />
        <Dob initialDateOfBirth={initialDateOfBirth} {...props} />
        <Gender {...props} />
        <Language {...props} />
        <HMIS {...props} />
        <ContactInfo {...props} />
        <VeteranStatus {...props} />
      </MainScrollContainer>
      <BottomActions
        submitTitle={id ? 'Update' : 'Create'}
        cancel={
          <TextButton
            onPress={navigation.goBack}
            fontSize="sm"
            accessibilityHint="cancels the creation of a new client profile"
            title="Cancel"
          />
        }
        // onSubmit={submitForm}
        onSubmit={id ? updateClientProfile : createClientProfile}
      />
    </View>
  );
}
