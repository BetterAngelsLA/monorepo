import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Chip from './Chip'; // Import Chip component

interface ChipData {
  iconName: string;
  value: string;
}

interface ChipRowProps {
  chipsData: ChipData[];
  onSelectionChange: (selectedValues: string[]) => void;
}

const ChipRow = ({ chipsData, onSelectionChange }: ChipRowProps) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleToggle = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newSelectedValues);
    onSelectionChange(newSelectedValues);
  };

  return (
    <View style={styles.container}>
      {chipsData.map(chip => (
        <Chip 
          key={chip.value} 
          iconName={chip.iconName} 
          value={chip.value} 
          onToggle={handleToggle} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChipRow;
