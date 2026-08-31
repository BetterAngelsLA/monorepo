import { BoltIcon, BoltSlashIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { FlashMode } from 'expo-camera';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from '../../IconButton';

interface CameraHeaderProps {
  flashMode: FlashMode;
  onToggleFlash: () => void;
}

export function CameraHeader({ flashMode, onToggleFlash }: CameraHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { paddingTop: insets.top + Spacings.xs }]}>
      <IconButton
        onPress={onToggleFlash}
        accessibilityLabel="flash"
        accessibilityHint={
          flashMode === 'off' ? 'enables flash' : 'disables flash'
        }
        variant="transparent"
      >
        {flashMode === 'off' ? (
          <BoltSlashIcon size="md" color={Colors.WHITE} />
        ) : (
          <BoltIcon size="md" color={Colors.WHITE} />
        )}
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    paddingHorizontal: Spacings.md,
  },
});
