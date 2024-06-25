import { Colors } from '@monorepo/expo/shared/static';
import { BottomActions, TextButton } from '@monorepo/expo/shared/ui-components';
import { useNavigation } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  GenderEnum,
  LanguageEnum,
  YesNoPreferNotToSayEnum,
} from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
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

export default function AddClient() {
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [client, setClient] = useState<CreateClientProfileInput>(INITIAL_STATE);
  const [createClient, { error }] = useCreateClientProfileMutation();
  const [errorState, setErrorState] = useState<string | null>(null);
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);

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
      setErrorState('First Name is required');
      return;
    }
    setErrorState(null);
    const input = {
      ...client,
    };

    if (client.dateOfBirth) {
      input.dateOfBirth = new Date(client.dateOfBirth);
    }

    if (client.preferredLanguage) {
      const trimmedLanguage = client.preferredLanguage.replace(
        /\s+/g,
        ''
      ) as keyof typeof LanguageEnum;
      input.preferredLanguage = LanguageEnum[trimmedLanguage];
    }

    if (client.veteranStatus) {
      input.veteranStatus = client.veteranStatus.replace(
        /\s+/g,
        ''
      ) as YesNoPreferNotToSayEnum;
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
        throw new Error(`Failed to create a client profile: ${error}`);
      }
      navigation.goBack();
    } catch (err) {
      throw new Error(`Failed to create a client profile: ${err}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <Name {...props} />
        <Dob {...props} />
        <Gender {...props} />
        <Language {...props} />
        <HMIS {...props} />
        <ContactInfo {...props} />
        <VeteranStatus {...props} />
      </MainScrollContainer>
      <BottomActions
        submitTitle="Create"
        cancel={
          <TextButton
            onPress={navigation.goBack}
            fontSize="sm"
            accessibilityHint="cancels the creation of a new client profile"
            title="Cancel"
          />
        }
        onSubmit={createClientProfile}
      />
    </View>
  );
}
