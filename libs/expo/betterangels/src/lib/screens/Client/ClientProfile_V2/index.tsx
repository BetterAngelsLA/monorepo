import { Colors } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ContactInfoCard } from './ClientProfileCards/ContactInfoCard';
import { DemographicInfoCard } from './ClientProfileCards/DemographicInfoCard';
import { FullNameCard } from './ClientProfileCards/FullNameCard';
import { HmisProfilesCard } from './ClientProfileCards/HmisProfilesCard';
import { HouseholdMembersCard } from './ClientProfileCards/HouseholdMembersCard';
import { ImportantNotesCard } from './ClientProfileCards/ImportantNotesCard';
import { PersonalInfoCard } from './ClientProfileCards/PersonalInfoCard';
import { RelevantContactsCard } from './ClientProfileCards/RelevantContactsCard';
import { ExpandableProfileContainer } from './ExpandableProfileContainer';
import { getEditButtonRoute } from './utils/getEditButtonRoute';

interface ProfileProps {
  client: ClientProfileQuery | undefined;
  openCard?: ClientProfileSectionEnum | null;
}

const DEFAULT_OPEN_CARD = ClientProfileSectionEnum.FullName;

export default function ClientProfileView(props: ProfileProps) {
  const { client, openCard } = props;
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();

  const clientProfile = client?.clientProfile;

  const [expandedCard, setExpandedCard] =
    useState<ClientProfileSectionEnum | null>(openCard || DEFAULT_OPEN_CARD);

  function onOpenCloseClick(card: ClientProfileSectionEnum) {
    if (card === expandedCard) {
      setExpandedCard(null);

      return;
    }

    setExpandedCard(card);
  }

  function onClickEdit(card: ClientProfileSectionEnum) {
    if (!clientProfile) {
      return;
    }
    const route = getEditButtonRoute({
      clientProfile: clientProfile,
      section: card,
    });

    router.push(route);
  }

  return (
    <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View>
        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.FullName}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <FullNameCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.PersonalInfo}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <PersonalInfoCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.ImportantNotes}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <ImportantNotesCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.Demographic}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <DemographicInfoCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.ContactInfo}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <ContactInfoCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.RelevantContacts}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <RelevantContactsCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.Household}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <HouseholdMembersCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.HmisIds}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <HmisProfilesCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>
      </View>
    </MainScrollContainer>
  );
}
