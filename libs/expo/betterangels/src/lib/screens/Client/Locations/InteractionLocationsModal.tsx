import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomSheetModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

  // Assumes we display multiple interactions only if they are
  // in same location (cannot be broken up by clustering)
  const primaryInteraction = selectedInteractions[0];

  const sheetTitle = primaryInteraction.location?.address.street;
  const sheetSubTitle =
    selectedInteractions.length > 1 &&
    `Total ${selectedInteractions.length} interactions`;

  return (
    <BottomSheetModal
      index={0}
      enableDynamicSizing
      enablePanDownToClose={false}
      snapPoints={snapPoints}
      maxDynamicContentSize={600}
    >
      <View
        onLayout={(e) => {
          const height = e.nativeEvent.layout.height;
          setTitleHeight(height + 40);
        }}
        style={styles.header}
      >
        {!!sheetTitle && <TextBold>{sheetTitle}</TextBold>}

        {!!sheetSubTitle && (
          <TextRegular size="xs" mt="xxs">
            {sheetSubTitle}
          </TextRegular>
        )}
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

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    marginBottom: Spacings.sm,
    paddingBottom: Spacings.md,
    paddingHorizontal: Spacings.sm,
  },
});
