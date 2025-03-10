import { Colors } from '@monorepo/expo/shared/static';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { CardAccordion } from './ClientProfileCards/CardAccordion';
import { FullNameCard } from './ClientProfileCards/FullNameCard';
import { HmisProfilesCards } from './ClientProfileCards/HmisProfilesCard';
import { HouseholdMembersCard } from './ClientProfileCards/HouseholdMembersCard';
import { RelevantContactsCard } from './ClientProfileCards/RelevantContactsCard/RelevantContactsCard';
import { ClientProfileCardEnum } from './constants';
import { TClientProfileCardTitle } from './types';

interface ProfileProps {
  client: ClientProfileQuery | undefined;
}

export default function ClientProfileView(props: ProfileProps) {
  const { client } = props;
  const scrollRef = useRef<ScrollView>(null);

  const [expandedTitle, setExpandedTitle] =
    useState<TClientProfileCardTitle | null>(null);

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
          section={ClientProfileCardEnum.RelevantContacts}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <RelevantContactsCard clientProfile={clientProfile} />
        </CardAccordion>

        <CardAccordion
          section={ClientProfileCardEnum.Household}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <HouseholdMembersCard clientProfile={clientProfile} />
        </CardAccordion>

        <CardAccordion
          section={ClientProfileCardEnum.HmisIds}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <HmisProfilesCards clientProfile={clientProfile} />
        </CardAccordion>
      </View>
    </MainScrollContainer>
  );
}
