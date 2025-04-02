import { useRouter } from 'expo-router';
import { View, ViewStyle } from 'react-native';
import { HmisProfileCard } from '../../../../Client/ClientProfile_V2/ClientProfileCards/HmisProfilesCard/HmisProfileCard';
import { ClientProfileCardEnum } from '../../../../Client/ClientProfile_V2/constants';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { ViewItemContainer } from '../ViewItemContainer';

type TProps = {
  clientProfile?: TClientProfile;
  style?: ViewStyle;
};

export function HmisProfilesView(props: TProps) {
  const { clientProfile, style } = props;

  const router = useRouter();

  const { hmisProfiles, id: profileId } = clientProfile || {};

  if (!hmisProfiles?.length) {
    return null;
  }

  return (
    <View style={style}>
      {hmisProfiles.map((hmisProfile, idx) => {
        return (
          <ViewItemContainer
            key={idx}
            onClickEdit={() =>
              router.navigate(
                `/clients/${profileId}/relations/${hmisProfile.id}/edit?componentName=${ClientProfileCardEnum.HmisIds}`
              )
            }
          >
            <HmisProfileCard hmisProfile={hmisProfile} />
          </ViewItemContainer>
        );
      })}
    </View>
  );
}
