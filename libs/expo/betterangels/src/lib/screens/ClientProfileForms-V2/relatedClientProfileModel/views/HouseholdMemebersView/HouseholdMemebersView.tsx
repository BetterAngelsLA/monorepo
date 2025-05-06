import { Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { StyleSheet, View, ViewStyle } from 'react-native';
import {
  ClientProfileSectionEnum,
  getRelatedModelAddRoute,
  getRelatedModelEditRoute,
} from '../../../../../screenRouting/clientProfileRoutes';
import { HouseholdMemberCard } from '../../../../Client/ClientProfile_V2/ClientProfileCards/HouseholdMembersCard';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { AddButton } from '../AddButton';
import { ViewItemContainer } from '../ViewItemContainer';

type TProps = {
  clientProfile?: TClientProfile;
  style?: ViewStyle;
};

export function HouseholdMemebersView(props: TProps) {
  const { clientProfile, style } = props;

  const router = useRouter();

  const { householdMembers, id: profileId } = clientProfile || {};

  if (!profileId) {
    return;
  }

  const addRoute = getRelatedModelAddRoute({
    profileId,
    section: ClientProfileSectionEnum.Household,
  });

  return (
    <View style={style}>
      {(householdMembers || []).map((householdMember, idx) => {
        const editRoute = getRelatedModelEditRoute({
          profileId,
          relatedlId: householdMember.id,
          section: ClientProfileSectionEnum.Household,
        });

        return (
          <ViewItemContainer
            key={idx}
            onClickEdit={() => router.navigate(editRoute)}
          >
            <HouseholdMemberCard
              member={householdMember}
              showAllFields={true}
            />
          </ViewItemContainer>
        );
      })}

      <View style={styles.addButtonView}>
        <AddButton
          itemName="household member"
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
