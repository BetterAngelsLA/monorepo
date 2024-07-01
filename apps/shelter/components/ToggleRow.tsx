import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Toggle from './Toggle';

interface ToggleData {
  value: string;
  iconName?: string;
}

interface ToggleRowProps {
  togglesData: ToggleData[];
  onSelectionChange: (selectedValues: string[]) => void;
}

const ToggleRow = ({ togglesData, onSelectionChange }: ToggleRowProps) => {
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
      {togglesData.map(toggle => (
        <Toggle 
          key={toggle.value} 
          value={toggle.value} 
          iconName={toggle.iconName}
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

export default ToggleRow;
