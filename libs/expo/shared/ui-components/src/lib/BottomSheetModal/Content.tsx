import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Colors, Shadow, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextBold from '../TextBold';

export default function BottomSheetModalContent({
  children,
  setTitleHeight,
  title,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  setTitleHeight: (height: number) => void;
  title?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  return (
    <BottomSheetView style={styles.container}>
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
            paddingBottom: bottomOffset + Spacings.xs,

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
        {children}
      </View>
    </BottomSheetView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Spacings.md,
  },
  shadow: {
    backgroundColor: Colors.WHITE,
    ...Shadow,
  },
});
