import { TargetIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import Button from '../../../Button';
import Copy from '../../../Copy';
import TextBold from '../../../TextBold';
import TextButton from '../../../TextButton';
import TextRegular from '../../../TextRegular';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { TLocationData } from './types';

interface SelectedLocationPanelProps {
  location: TLocationData;
  onConfirm: () => void;
  onGetDirections: (provider: 'apple' | 'google') => void;
  onShowIosDirections: () => void;
}

export function SelectedLocationPanel({
  location,
  onConfirm,
  onGetDirections,
  onShowIosDirections,
}: SelectedLocationPanelProps) {
  const [copyField, setCopyField] = useState<'address' | 'coords' | null>(null);

  const coordsDisplay = `${location.latitude.toFixed(
    7
  )} ${location.longitude.toFixed(7)}`;
  const coordsCopy = `${location.longitude} ${location.latitude}`;

  const handleDirections = () => {
    if (Platform.OS === 'ios') {
      onShowIosDirections();
    } else {
      onGetDirections('google');
    }
  };

  return (
    <View style={styles.panel}>
      <TextBold mx="md">{location.name}</TextBold>

      {/* Address with copy */}
      <View
        style={[
          styles.copyContainer,
          copyField === 'address' && styles.copyActive,
        ]}
      >
        {copyField === 'address' && (
          <Copy
            textToCopy={location.address}
            closeCopy={() => setCopyField(null)}
          />
        )}
        <Pressable
          onLongPress={() => setCopyField('address')}
          accessibilityRole="button"
          accessibilityHint="long press to copy address"
          style={styles.copyPressable}
        >
          <TextRegular mx="md">{location.address}</TextRegular>
        </Pressable>
      </View>

      <TextButton
        onPress={handleDirections}
        fontSize="sm"
        color={Colors.PRIMARY}
        mx="md"
        mb="sm"
        accessibilityHint="opens maps to get directions"
        title="Get directions"
      />

      {/* Coordinates with copy */}
      <View
        style={[
          styles.copyContainer,
          copyField === 'coords' && styles.copyActive,
        ]}
      >
        {copyField === 'coords' && (
          <Copy textToCopy={coordsCopy} closeCopy={() => setCopyField(null)} />
        )}
        <Pressable
          onLongPress={() => setCopyField('coords')}
          accessibilityRole="button"
          accessibilityHint="long press to copy coordinates"
          style={styles.copyPressable}
        >
          <View style={styles.coordsRow}>
            <TargetIcon color={Colors.PRIMARY_EXTRA_DARK} />
            <TextBold size="sm">{coordsDisplay}</TextBold>
          </View>
        </Pressable>
      </View>

      <View style={styles.confirmBtn}>
        <Button
          onPress={onConfirm}
          size="full"
          title="Select this location"
          accessibilityHint="select pinned location"
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.WHITE,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  copyContainer: {
    position: 'relative',
    marginBottom: Spacings.sm,
    width: '100%',
  },
  copyActive: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  copyPressable: {
    paddingVertical: Spacings.xs,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.md,
  },
  confirmBtn: {
    paddingHorizontal: Spacings.md,
  },
});
