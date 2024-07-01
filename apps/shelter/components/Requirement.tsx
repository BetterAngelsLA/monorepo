import { FontAwesome } from '@expo/vector-icons';
import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Themes from '../constants/themes';
import { Text, View } from './Themed';

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
        {iconName && (
          <FontAwesome style={styles.icon} name={iconName as any} size={24} />
        )}
        <Text style={styles.headerText}>{value}</Text>
      </View>
      <View style={styles.optionsContainer}>
        {['Required', 'Not Required', 'Show Both'].map((option, index) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={option}
            onPress={() => handleSelect(option)}
            style={[
              styles.option,
              activeOption === option && styles.activeOption,
              index === 0 && styles.firstOption,
              index === 2 && styles.lastOption,
            ]}
          >
            <Text
              style={
                activeOption === option
                  ? styles.activeOptionText
                  : styles.optionText
              }
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacings.xs,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  headerText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontFamily: Themes.BetterAngels.headerFontFamily,
    marginLeft: Spacings.xs,
  },
  icon: {
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.sm.fontSize,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginTop: Spacings.xs,
  },
  option: {
    flex: 1,
    padding: 5,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstOption: {
    borderTopLeftRadius: Spacings.xs,
    borderBottomLeftRadius: Spacings.xs,
    borderRightWidth: 0,
  },
  lastOption: {
    borderTopRightRadius: Spacings.xs,
    borderBottomRightRadius: Spacings.xs,
    borderLeftWidth: 0,
  },
  activeOption: {
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    // borderColor: Colors.PRIMARY_EXTRA_LIGHT,
  },
  optionText: {
    color: Colors.PRIMARY_EXTRA_DARK,
  },
  activeOptionText: {
    // color: 'white',
  },
});

export default Requirement;
