import { FontAwesome } from '@expo/vector-icons';
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
        size={24}
        color={isActive ? 'white' : 'black'}
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    width: 110,
    height: 110,
  },
  activeChip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    borderRadius: 20,
    backgroundColor: 'blue',
    borderWidth: 1,
    borderColor: 'blue',
    width: 110,
    height: 110,
  },
  chipText: {
    color: 'black',
    textAlign: 'center',
    marginTop: 8,
  },
  activeChipText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default Chip;
