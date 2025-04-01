import { Text, View } from 'react-native';
import { TClientProfile } from '../../../Client/ClientProfile_V2/types';

type TProps = {
  clientProfile?: TClientProfile;
};

export function HmisProfileForm(props: TProps) {
  const { clientProfile } = props;

  const { hmisProfiles } = clientProfile || {};

  if (!hmisProfiles?.length) {
    return null;
  }

  return (
    <View>
      <Text>ADD HMIS ID</Text>

      {/* <Component clientProfile={data.clientProfile} /> */}
    </View>
  );
}
