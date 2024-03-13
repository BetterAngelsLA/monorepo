import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import Themes from '../constants/themes';
import { FontAwesome } from '@expo/vector-icons';

interface RequirementProps {
  value: string;
  iconName?: string;
  onSelect: (value: string, selection: string) => void;
}

const Requirement = ({ value, iconName, onSelect }: RequirementProps) => {
  const [activeOption, setActiveOption] = useState('Show Both');

  const handleSelect = (selection: string) => {
    setActiveOption(selection);
    onSelect(value, selection);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {iconName && <FontAwesome style={styles.icon} name={iconName as any} size={24} />}
        <Text style={styles.headerText}>{value}</Text>
      </View>
      <View style={styles.optionsContainer}>
        {['Required', 'Not Required', 'Show Both'].map((option, index) => (
          <TouchableOpacity
            key={option}
            onPress={() => handleSelect(option)}
            style={[
              styles.option,
              activeOption === option && styles.activeOption,
              index === 0 && styles.firstOption,
              index === 2 && styles.lastOption
            ]}>
            <Text style={activeOption === option ? styles.activeOptionText : styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5,
  },
  headerText: {
    fontFamily: Themes.BetterAngels.headerFontFamily,
    marginLeft: 10,
  },
  icon: {
    color: '#ccc',
  },
  optionsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    minWidth: 320,
  },
  option: {
    flex: 1,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstOption: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderRightWidth: 0,
  },
  lastOption: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderLeftWidth: 0,
  },
  activeOption: {
    backgroundColor: 'blue',
    borderColor: 'blue',
  },
  optionText: {
    
  },
  activeOptionText: {
    color: 'white',
  },
});

export default Requirement;