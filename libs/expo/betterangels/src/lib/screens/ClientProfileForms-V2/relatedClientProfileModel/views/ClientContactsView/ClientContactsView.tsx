import { Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { StyleSheet, View, ViewStyle } from 'react-native';
import {
  ClientProfileSectionEnum,
  getRelatedModelAddRoute,
  getRelatedModelEditRoute,
} from '../../../../../screenRouting/clientProfileRoutes';
import { RelevantContactCard } from '../../../../Client/ClientProfile_V2/ClientProfileCards/RelevantContactsCard/RelevantContactCard';
import { TClientProfile } from '../../../../Client/ClientProfile_V2/types';
import { AddButton } from '../AddButton';
import { ViewItemContainer } from '../ViewItemContainer';

type TProps = {
  clientProfile?: TClientProfile;
  style?: ViewStyle;
};

export function ClientContactsView(props: TProps) {
  const { clientProfile, style } = props;

  const router = useRouter();

  const { contacts, id: profileId } = clientProfile || {};

  if (!profileId) {
    return;
  }

  const addRoute = getRelatedModelAddRoute({
    profileId,
    section: ClientProfileSectionEnum.RelevantContacts,
  });

  return (
    <View style={style}>
      {(contacts || []).map((contact, idx) => {
        const editRoute = getRelatedModelEditRoute({
          profileId,
          relatedlId: contact.id,
          section: ClientProfileSectionEnum.RelevantContacts,
        });

        return (
          <ViewItemContainer
            key={idx}
            onClickEdit={() => router.navigate(editRoute)}
          >
            <RelevantContactCard contact={contact} showAllFields={true} />
          </ViewItemContainer>
        );
      })}

      <View style={styles.addButtonView}>
        <AddButton
          itemName="relevant contact"
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
