import { Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { StyleSheet, View, ViewStyle } from 'react-native';
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
        const editRoute = getRelatedModelEditRoute({
          profileId,
          relatedlId: hmisProfile.id,
          section: ClientProfileSectionEnum.HmisIds,
        });

        return (
          <ViewItemContainer
            key={idx}
            onClickEdit={() => router.navigate(editRoute)}
          >
            <HmisProfileCard hmisProfile={hmisProfile} />
          </ViewItemContainer>
        );
      })}

      <View style={styles.addButtonView}>
        <AddButton
          itemName="HMIS ID"
          onClick={() => router.navigate(addRoute)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addButtonView: {
    marginTop: Spacings.md,
    marginBottom: Spacings.lg,
  },
});
