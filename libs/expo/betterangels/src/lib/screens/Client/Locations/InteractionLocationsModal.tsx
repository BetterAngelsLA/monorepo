import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomSheetModal,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { NoteCard } from '../../../ui-components';
import { useInteractionsMapState } from './map/hooks';

export function InteractionLocationsModal() {
  const { mapState } = useInteractionsMapState();
  const [titleHeight, setTitleHeight] = useState<number>(1);

  const { selectedInteractions } = mapState;
  const snapPoints = useMemo(() => [titleHeight], [titleHeight]);

  if (!selectedInteractions.length) {
    return null;
  }

  const primaryInteraction = selectedInteractions[0];

  const sheetTitle =
    primaryInteraction.location?.address.street || 'Interaction';

  return (
    <BottomSheetModal
      index={0}
      enableDynamicSizing
      enablePanDownToClose={false}
      snapPoints={snapPoints}
    >
      <View
        onLayout={(e) => {
          const height = e.nativeEvent.layout.height;
          setTitleHeight(height + 40);
        }}
        style={{
          borderBottomWidth: 1,
          borderColor: Colors.NEUTRAL_LIGHT,
          marginBottom: Spacings.sm,
          paddingBottom: Spacings.md,
          paddingHorizontal: Spacings.sm,
        }}
      >
        <TextBold>{sheetTitle}</TextBold>
      </View>
      <View
        style={{
          paddingHorizontal: Spacings.sm,
          gap: Spacings.sm,
        }}
      >
        {selectedInteractions.map((interaction) => {
          return (
            <NoteCard
              key={interaction.id}
              note={interaction}
              variant={'clientProfile'}
              hasBorder
            />
          );
        })}
      </View>
    </BottomSheetModal>
  );
}
