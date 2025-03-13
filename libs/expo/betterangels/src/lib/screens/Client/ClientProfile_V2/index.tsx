import { Colors } from '@monorepo/expo/shared/static';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
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
import { ClientProfileCardEnum } from './constants';

interface ProfileProps {
  client: ClientProfileQuery | undefined;
  openCard?: ClientProfileCardEnum | null;
}

const DEFAULT_OPEN_CARD = ClientProfileCardEnum.FullName;

export default function ClientProfileView(props: ProfileProps) {
  const { client, openCard } = props;
  const scrollRef = useRef<ScrollView>(null);

  const clientProfile = client?.clientProfile;

  const defaultOpenCard =
    openCard === null ? null : openCard || DEFAULT_OPEN_CARD;

  const [expandedCard, setExpandedCard] =
    useState<ClientProfileCardEnum | null>(defaultOpenCard);

  function onOpenCloseClick(card: ClientProfileCardEnum) {
    if (card === expandedCard) {
      setExpandedCard(null);

      return;
    }

    setExpandedCard(card);
  }

  function onClickEdit(card: ClientProfileCardEnum) {
    console.log('*****************  on click edit:', card);
  }

  return (
    <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View>
        <ExpandableProfileContainer
          card={ClientProfileCardEnum.FullName}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <FullNameCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileCardEnum.PersonalInfo}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <PersonalInfoCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileCardEnum.ImportantNotes}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <ImportantNotesCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileCardEnum.Demographic}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <DemographicInfoCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileCardEnum.ContactInfo}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <ContactInfoCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileCardEnum.RelevantContacts}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <RelevantContactsCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileCardEnum.Household}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <HouseholdMembersCard clientProfile={clientProfile} />
        </ExpandableProfileContainer>

        <ExpandableProfileContainer
          card={ClientProfileCardEnum.HmisIds}
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
