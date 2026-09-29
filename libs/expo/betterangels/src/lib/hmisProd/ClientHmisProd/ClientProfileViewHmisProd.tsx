import { Colors } from '@monorepo/expo/shared/static';
import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { HmisClientProfileType } from '../../apollo';
import { ClientProfileSectionEnum } from '../../screenRouting';
import { ExpandableProfileContainer } from '../../screens/Client/ClientProfile/ExpandableProfileContainer';
import { FullNameCardHmis } from '../../screens/ClientHmis/tabs/ClientProfileViewHmis/ClientCardsHmis';
import { MainScrollContainer } from '../../ui-components';
import {
  DemographicInfoCardHmisProd,
  PersonalInfoCardHmisProd,
} from './ClientCardsHmisProd';

type TProps = {
  client?: HmisClientProfileType;
};

const DEFAULT_OPEN_CARD = ClientProfileSectionEnum.FullName;

/**
 * Read-only profile tab for the hmisProd demo — same expandable card layout
 * as `ClientProfileViewHmis` but without edit actions (those routes are
 * GraphQL-backed and have no prod equivalent) and with the cards trimmed to
 * Clarity-native fields.
 */
export function ClientProfileViewHmisProd(props: TProps) {
  const { client } = props;
  const scrollRef = useRef<ScrollView>(null);

  const [expandedCard, setExpandedCard] =
    useState<ClientProfileSectionEnum | null>(DEFAULT_OPEN_CARD);

  function onOpenCloseClick(card: ClientProfileSectionEnum) {
    setExpandedCard((current) => (current === card ? null : card));
  }

  return (
    <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <ExpandableProfileContainer
        card={ClientProfileSectionEnum.FullName}
        openCard={expandedCard}
        onOpenCloseClick={onOpenCloseClick}
      >
        <FullNameCardHmis client={client} />
      </ExpandableProfileContainer>
      <ExpandableProfileContainer
        card={ClientProfileSectionEnum.PersonalInfo}
        openCard={expandedCard}
        onOpenCloseClick={onOpenCloseClick}
      >
        <PersonalInfoCardHmisProd client={client} />
      </ExpandableProfileContainer>
      <ExpandableProfileContainer
        card={ClientProfileSectionEnum.Demographic}
        openCard={expandedCard}
        onOpenCloseClick={onOpenCloseClick}
      >
        <DemographicInfoCardHmisProd client={client} />
      </ExpandableProfileContainer>
    </MainScrollContainer>
  );
}
