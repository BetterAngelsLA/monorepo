import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomSheetModal,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { TNotesQueryInteraction } from '../../../apollo';
import { NoteCard } from '../../../ui-components';
import { useInteractionsMapState } from './map/hooks';

export function InteractionLocationsModal() {
  const { mapState } = useInteractionsMapState();
  const [selectedInteraction, setSelectedInteraction] =
    useState<TNotesQueryInteraction | null>(null);
  const [titleHeight, setTitleHeight] = useState<number>(1);

  const { selectedInteractions } = mapState;
  const snapPoints = useMemo(() => [titleHeight], [titleHeight]);

  useEffect(() => {
    if (!selectedInteractions.length) {
      setSelectedInteraction(null);

      return;
    }

    const currentInteraction = selectedInteractions[0];

    if (currentInteraction.id === selectedInteraction?.id) {
      return;
    }

    setSelectedInteraction(currentInteraction);
  }, [selectedInteractions]);

  if (!selectedInteraction) {
    return null;
  }

  const title = selectedInteraction.location?.address.street;

  return (
    <BottomSheetModal
      index={0}
      enableDynamicSizing
      enablePanDownToClose={false}
      snapPoints={snapPoints}
    >
      {title && (
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
          <TextBold>{title}</TextBold>
        </View>
      )}
      <View
        style={{
          paddingHorizontal: Spacings.sm,
          gap: Spacings.sm,
        }}
      >
        <NoteCard
          note={selectedInteraction}
          variant={'clientProfile'}
          hasBorder
        />
      </View>
    </BottomSheetModal>
  );
}
