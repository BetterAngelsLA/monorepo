import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';

type TProps = {
  clientProfile?: TClientProfile;
  relationId?: string;
};

export function HmisProfileForm(props: TProps) {
  const { clientProfile, relationId } = props;

  console.log('*****************  clientProfile:', clientProfile);
  console.log('*****************  relationId:', relationId);

  return (
    <View>
      <TextRegular>HmisProfileForm</TextRegular>
    </View>
  );
}
