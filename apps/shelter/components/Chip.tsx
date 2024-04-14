import { FontAwesome } from '@expo/vector-icons';
import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Themed';

interface ChipProps {
  iconName: string;
  value: string;
  onToggle: (value: string) => void;
}

const Chip = ({ iconName, value, onToggle }: ChipProps) => {
  const [isActive, setIsActive] = useState(false);

  const toggleChip = () => {
    setIsActive(!isActive);
    onToggle(value);
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={toggleChip}
      style={isActive ? styles.activeChip : styles.chip}
    >
      <FontAwesome
        name={iconName as any}
        size={FontSizes.md.fontSize}
        color={Colors.PRIMARY_EXTRA_DARK}
      />
      <Text style={isActive ? styles.activeChipText : styles.chipText}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL,
    width: 110,
    height: 110,
  },
  activeChip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    borderRadius: 20,
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    borderWidth: 1,
    borderColor: Colors.PRIMARY_EXTRA_LIGHT,
    width: 110,
    height: 110,
  },
  chipText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    textAlign: 'center',
    marginTop: Spacings.xs,
  },
  activeChipText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    textAlign: 'center',
    marginTop: Spacings.xs,
  },
});

export default Chip;
