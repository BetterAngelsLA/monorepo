import { Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { RelationshipTypeEnum } from '../../../../../apollo';
import {
  ClientProfileSectionEnum,
  getRelatedModelAddRoute,
  getRelatedModelEditRoute,
} from '../../../../../screenRouting/clientProfileRoutes';
import { RelevantContactCard } from '../../../../Client/ClientProfile/ClientProfileCards/RelevantContactsCard/RelevantContactCard';
import { TClientProfile } from '../../../../Client/ClientProfile/types';
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

  const caseManagers = contacts?.filter(
    (contact) =>
      contact.relationshipToClient === RelationshipTypeEnum.CurrentCaseManager
  );

  const otherContacts = contacts?.filter((contact) => {
    const { relationshipToClient } = contact;

    return relationshipToClient !== RelationshipTypeEnum.CurrentCaseManager;
  });

  return (
    <View style={style}>
      {(caseManagers || []).map((contact) => {
        const editRoute = getRelatedModelEditRoute({
          profileId,
          relatedlId: contact.id,
          section: ClientProfileSectionEnum.RelevantContacts,
        });

        return (
          <ViewItemContainer
            key={contact.id}
            onClickEdit={() => router.navigate(editRoute)}
          >
            <RelevantContactCard contact={contact} showAllFields={true} />
          </ViewItemContainer>
        );
      })}

      {(otherContacts || []).map((contact) => {
        const editRoute = getRelatedModelEditRoute({
          profileId,
          relatedlId: contact.id,
          section: ClientProfileSectionEnum.RelevantContacts,
        });

        return (
          <ViewItemContainer
            key={contact.id}
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
