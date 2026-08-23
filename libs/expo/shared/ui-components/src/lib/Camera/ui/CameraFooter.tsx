import { CameraRotateIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from '../../IconButton';
import TextButton from '../../TextButton';
import TextMedium from '../../TextMedium';

interface CameraFooterProps {
  onCancel: () => void;
  onCapture: () => void;
  onToggleCameraType: () => void;
}

export function CameraFooter({
  onCancel,
  onCapture,
  onToggleCameraType,
}: CameraFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomBar,
        {
          paddingBottom: insets.bottom + Spacings.xs,
          paddingHorizontal: Spacings.md,
        },
      ]}
    >
      <TextMedium textAlign="center" mb="md" size="sm" color={Colors.WARNING}>
        PHOTO
      </TextMedium>

      <View style={styles.controlsRow}>
        <TextButton
          testId="camera-cancel-btn"
          style={{
            flex: 1,
            borderRadius: Radiuses.xs,
            borderWidth: 1,
            borderColor: 'red',
            padding: 8,
          }}
          color={Colors.WHITE}
          // The default pressed grey flashes white against the camera.
          pressedBackgroundColor="rgba(255, 255, 255, 0.2)"
          onPress={onCancel}
          accessibilityHint="closes camera"
          title="Cancel"
        />

        <Pressable
          onPress={onCapture}
          testID="camera-capture-btn"
          style={{
            flex: 2,
            alignItems: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="capture"
          accessibilityHint="taka a photo"
        >
          {({ pressed }) => (
            <View style={styles.shutterOuter}>
              <View
                style={[
                  styles.shutterInner,
                  {
                    height: pressed ? 38 : 45,
                    width: pressed ? 38 : 45,
                  },
                ]}
              />
            </View>
          )}
        </Pressable>

        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={styles.swapWrap}>
            <IconButton
              onPress={onToggleCameraType}
              testID="camera-flip-btn"
              accessibilityLabel="change camera"
              accessibilityHint="toggles front/back camera"
              variant="transparent"
            >
              <CameraRotateIcon color={Colors.WHITE} />
            </IconButton>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shutterOuter: {
    backgroundColor: Colors.BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxl,
    borderWidth: 5,
    borderColor: Colors.WHITE,
    height: 60,
    width: 60,
  },
  shutterInner: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xxxl,
  },
  swapWrap: {
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxl,
    height: 41,
    width: 41,
  },
});
