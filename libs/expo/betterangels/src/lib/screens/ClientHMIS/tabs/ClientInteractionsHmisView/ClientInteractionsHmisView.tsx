import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
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
            params: { clientId: client?.id },
          });
        }}
        variant="clientProfile"
        hmisNote={item}
      />
    ),
    []
  );

  if (!client) {
    return null;
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={{ marginBottom: Spacings.md }}>
        <IconButton
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel="create an interaction"
          accessibilityHint="create new interaction"
          onPress={() =>
            router.navigate(`/notes-hmis/create?clientId=${client.id}`)
          }
        >
          <PlusIcon />
        </IconButton>
      </View>

      <InteractionListHmis
        filters={{ hmisClientProfile: client.id }}
        renderItem={renderItemFn}
      />
    </MainScrollContainer>
  );
}
