import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  Colors,
  Radiuses,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotesQuery } from '../../../apollo';
import { NoteCard } from '../../../ui-components';

interface InteractionLocationsModalProps {
  selectedLocation: NotesQuery['notes']['results'][number] | null;
  setSelectedLocation: (
    location: NotesQuery['notes']['results'][number] | null
  ) => void;
}

export function InteractionLocationsModal(
  props: InteractionLocationsModalProps
) {
  const { selectedLocation, setSelectedLocation } = props;
  const [titleHeight, setTitleHeight] = useState<number>(1);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => [titleHeight], [titleHeight]);
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  if (!selectedLocation) {
    return null;
  }

  return (
    <BottomSheet
      index={0}
      handleIndicatorStyle={{
        backgroundColor: Colors.NEUTRAL_LIGHT,
        width: 54,
        height: 5,
        borderRadius: Radiuses.xxs,
      }}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      ref={bottomSheetRef}
      enableDynamicSizing
      style={styles.shadow}
    >
      <BottomSheetView style={styles.container}>
        <View
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            setTitleHeight(height + 25);
            console.log('Title height:', height);
          }}
          style={{
            borderBottomWidth: 1,
            borderColor: Colors.NEUTRAL_LIGHT,
            marginBottom: Spacings.sm,
            paddingBottom: bottomOffset + Spacings.xs,
            paddingHorizontal: Spacings.sm,
          }}
        >
          <TextBold>{selectedLocation.location?.address.street}</TextBold>
        </View>
        <View
          style={{
            paddingHorizontal: Spacings.sm,
            gap: Spacings.sm,
          }}
        >
          <NoteCard
            onPress={() => setSelectedLocation(null)}
            note={selectedLocation}
            variant={'clientProfile'}
            hasBorder
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Spacings.md,
  },
  shadow: Shadow,
});
