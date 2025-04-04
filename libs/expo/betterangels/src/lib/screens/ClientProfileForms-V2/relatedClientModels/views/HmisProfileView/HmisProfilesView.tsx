import { useRouter } from 'expo-router';
import { View, ViewStyle } from 'react-native';
import {
  ClientProfileSectionEnum,
  getRelatedModelAddRoute,
  getRelatedModelEditRoute,
} from '../../../../../screenRouting/clientProfileRoutes';
import { HmisProfileCard } from '../../../../Client/ClientProfile_V2/ClientProfileCards/HmisProfilesCard/HmisProfileCard';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { AddButton } from '../AddButton';
import { ViewItemContainer } from '../ViewItemContainer';

type TProps = {
  clientProfile?: TClientProfile;
  style?: ViewStyle;
};

export function HmisProfilesView(props: TProps) {
  const { clientProfile, style } = props;

  const router = useRouter();

  const { hmisProfiles, id: profileId } = clientProfile || {};

  if (!profileId) {
    return;
  }

  const addRoute = getRelatedModelAddRoute({
    profileId,
    section: ClientProfileSectionEnum.HmisIds,
  });

  return (
    <View style={style}>
      {(hmisProfiles || []).map((hmisProfile, idx) => {
        return (
          <ViewItemContainer
            key={idx}
            onClickEdit={() =>
              router.navigate(
                getRelatedModelEditRoute({
                  profileId,
                  relatedlId: hmisProfile.id,
                  section: ClientProfileSectionEnum.HmisIds,
                })
              )
            }
          >
            <HmisProfileCard hmisProfile={hmisProfile} />
          </ViewItemContainer>
        );
      })}

      <AddButton itemName="HMIS ID" onClick={() => router.navigate(addRoute)} />
    </View>
  );
}
