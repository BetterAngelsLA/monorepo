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
import SocialSecurity from './SocialSecurity';
import VeteranStatus from './VeteranStatus';

const INITIAL_STATE = {
  address: '',
  dateOfBirth: '',
  gender: undefined as GenderEnum | undefined,
  hmisId: '',
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
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);

  const props = {
    expanded,
    setExpanded,
    client,
    setClient,
    scrollRef,
  };

  const submitNote = () => {
    console.log('submitting note', client);
  };

  return (
    <View style={{ flex: 1 }}>
      <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <Name {...props} />
        <Dob {...props} />
        <Gender {...props} />
        <Language {...props} />
        <SocialSecurity {...props} />
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
            accessibilityHint="discards changes and reverts note to previous state"
            title="Cancel"
          />
        }
        onSubmit={submitNote}
      />
    </View>
  );
}
