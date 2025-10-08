import { Colors } from '@monorepo/expo/shared/static';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { HmisClientType } from '../../../../apollo';
import { ClientProfileSectionEnum } from '../../../../screenRouting';
import { MainScrollContainer } from '../../../../ui-components';
import { ExpandableProfileContainer } from '../../../Client/ClientProfile/ExpandableProfileContainer';
import { FullNameCardHmis } from './ClientCardsHMIS';

type TProps = {
  client?: HmisClientType;
  openCard?: ClientProfileSectionEnum | null;
};

const DEFAULT_OPEN_CARD = ClientProfileSectionEnum.FullName;

export function ClientProfileHMISView(props: TProps) {
  const { client, openCard } = props;
  const scrollRef = useRef<ScrollView>(null);
  // const router = useRouter();

  const clientProfile = client;

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

    console.log('edit FullName hmis: ', card);

    // const route = getEditButtonRoute({
    //   clientProfile: clientProfile,
    //   section: card,
    // });

    // router.push(route);
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
          <FullNameCardHmis client={clientProfile} />
        </ExpandableProfileContainer>
      </View>
    </MainScrollContainer>
  );
}
