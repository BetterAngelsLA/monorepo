import { Colors } from '@monorepo/expo/shared/static';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { CardAccordion } from './ClientProfileCards/CardAccordion';
import { ContactInfoCard } from './ClientProfileCards/ContactInfoCard';
import { DemographicInfoCard } from './ClientProfileCards/DemographicInfoCard';
import { FullNameCard } from './ClientProfileCards/FullNameCard';
import { ImportantNotesCard } from './ClientProfileCards/ImportantNotesCard';
import { PersonalInfoCard } from './ClientProfileCards/PersonalInfoCard';
import { RelevantContactsCard } from './ClientProfileCards/RelevantContactCard';
import { ClientProfileCardEnum, ClientProfileCardTitles } from './constants';
import { TClientProfileCardTitle } from './types';

interface ProfileProps {
  client: ClientProfileQuery | undefined;
  openCard?: ClientProfileCardEnum | null;
}

const DEFAULT_OPEN_CARD = ClientProfileCardEnum.FullName;

export default function ClientProfileView(props: ProfileProps) {
  const { client, openCard } = props;
  const scrollRef = useRef<ScrollView>(null);

  const defaultOpenCardTitle =
    openCard === null
      ? null
      : ClientProfileCardTitles[openCard || DEFAULT_OPEN_CARD];

  const [expandedTitle, setExpandedTitle] =
    useState<TClientProfileCardTitle | null>(defaultOpenCardTitle);

  const clientProfile = client?.clientProfile;

  return (
    <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View>
        <CardAccordion
          section={ClientProfileCardEnum.FullName}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <FullNameCard clientProfile={clientProfile} />
        </CardAccordion>

        <CardAccordion
          section={ClientProfileCardEnum.PersonalInfo}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <PersonalInfoCard clientProfile={clientProfile} />
        </CardAccordion>

        <CardAccordion
          section={ClientProfileCardEnum.ImportantNotes}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <ImportantNotesCard clientProfile={clientProfile} />
        </CardAccordion>

        <CardAccordion
          section={ClientProfileCardEnum.Demographic}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <DemographicInfoCard clientProfile={clientProfile} />
        </CardAccordion>

        <CardAccordion
          section={ClientProfileCardEnum.ContactInfo}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <ContactInfoCard clientProfile={clientProfile} />
        </CardAccordion>

        <CardAccordion
          section={ClientProfileCardEnum.RelevantContacts}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <RelevantContactsCard clientProfile={clientProfile} />
        </CardAccordion>
      </View>
    </MainScrollContainer>
  );
}
