import { Colors } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import {
  CreateClientProfileInput,
  GenderEnum,
  LanguageEnum,
  YesNoPreferNotToSayEnum,
} from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
import Dob from './Dob';
import Gender from './Gender';
import Language from './Language';
import Name from './Name';
import SocialSecurity from './SocialSecurity';

const INITIAL_STATE = {
  address: '',
  dateOfBirth: '',
  gender: GenderEnum.Male,
  hmisId: '',
  nickname: '',
  phoneNumber: '',
  preferredLanguage: LanguageEnum.English,
  pronouns: '',
  spokenLanguages: [],
  user: {
    firstName: '',
    lastName: '',
    email: '',
  },
  veteranStatus: YesNoPreferNotToSayEnum.Yes,
};

export default function AddClient() {
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const [client, setClient] = useState<CreateClientProfileInput>(INITIAL_STATE);

  const props = {
    expanded,
    setExpanded,
    client,
    setClient,
  };

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <Name {...props} />
      <Dob {...props} />
      <Gender {...props} />
      <Language {...props} />
      <SocialSecurity {...props} />
    </MainScrollContainer>
  );
}
