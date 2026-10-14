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
        },
      ]}
    >
      <View style={styles.slotCenter}>
        <TextMedium textAlign="center" mb="md" size="sm" color={Colors.WARNING}>
          PHOTO
        </TextMedium>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.slotLeft}>
          <TextButton
            testId="camera-cancel-btn"
            style={{
              borderRadius: Radiuses.xs,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}
            color={Colors.WHITE}
            pressedBackgroundColor="rgba(255, 255, 255, 0.2)"
            onPress={onCancel}
            accessibilityHint="closes camera"
            title="Cancel"
          />
        </View>

        <View style={styles.slotCenter}>
          <Pressable
            onPress={onCapture}
            testID="camera-capture-btn"
            accessibilityRole="button"
            accessibilityLabel="capture"
            accessibilityHint="take a photo"
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
        </View>

        <View style={styles.slotRight}>
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
    paddingHorizontal: Spacings.md,
  },
  slotLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  slotRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  slotCenter: {
    flex: 1,
    alignItems: 'center',
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
