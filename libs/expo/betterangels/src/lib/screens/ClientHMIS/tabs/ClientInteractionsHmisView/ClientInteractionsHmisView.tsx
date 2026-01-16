import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { HmisClientProfileType, HmisNoteType } from '../../../../apollo';
import {
  InteractionListHmis,
  MainScrollContainer,
  ProgramNoteCard,
} from '../../../../ui-components';

type TProps = { client?: HmisClientProfileType };

export function ClientInteractionsHmisView(props: TProps) {
  const { client } = props;

  const renderItemFn = useCallback(
    (item: HmisNoteType) => (
      <ProgramNoteCard
        onPress={() => {
          router.navigate({
            pathname: `/notes-hmis/${item.id}`,
          });
        }}
        variant="clientProfile"
        hmisNote={item}
      />
    ),
    []
  );

  const renderHeader = useCallback(
    (visible: number, total: number | undefined) => {
      const text =
        typeof total === 'number'
          ? `Displaying ${visible} of ${total} notes`
          : `Displaying ${visible} notes`;

      return (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacings.md,
          }}
        >
          <TextMedium size="sm">{text}</TextMedium>
          <IconButton
            variant="secondary"
            borderColor={Colors.WHITE}
            accessibilityLabel="create an interaction"
            accessibilityHint="create new interaction"
            onPress={() => {
              router.navigate(`/notes-hmis/create?clientId=${client!.id}`);
            }}
          >
            <PlusIcon />
          </IconButton>
        </View>
      );
    },
    [client!.id]
  );

  if (!client) {
    return null;
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <InteractionListHmis
        filters={{ hmisClientProfile: client.id }}
        renderItem={renderItemFn}
        renderHeader={renderHeader}
      />
    </MainScrollContainer>
  );
}
