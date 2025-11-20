import { Colors } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { HmisClientProfileType } from '../../../../apollo';
import { ClientProfileSectionEnum } from '../../../../screenRouting';
import { MainScrollContainer } from '../../../../ui-components';
import { ExpandableProfileContainer } from '../../../Client/ClientProfile/ExpandableProfileContainer';
import { getHMISEditButtonRoute } from '../../../Client/ClientProfile/utils/getHMISEditButtonRoute';
import {
  DemographicInfoCardHmis,
  FullNameCardHmis,
  PersonalInfoCardHmis,
} from './ClientCardsHMIS';

type TProps = {
  client?: HmisClientProfileType;
  openCard?: ClientProfileSectionEnum | null;
};

const DEFAULT_OPEN_CARD = ClientProfileSectionEnum.FullName;

export function ClientProfileHMISView(props: TProps) {
  const { client, openCard } = props;
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();

  const { id } = client || {};

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
    if (!id) {
      return;
    }

    const route = getHMISEditButtonRoute({
      profileId: id,
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
          <FullNameCardHmis client={client} />
        </ExpandableProfileContainer>
        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.PersonalInfo}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <PersonalInfoCardHmis client={client} />
        </ExpandableProfileContainer>
        <ExpandableProfileContainer
          card={ClientProfileSectionEnum.Demographic}
          openCard={expandedCard}
          onOpenCloseClick={onOpenCloseClick}
          onEditClick={onClickEdit}
        >
          <DemographicInfoCardHmis client={client} />
        </ExpandableProfileContainer>
      </View>
    </MainScrollContainer>
  );
}
