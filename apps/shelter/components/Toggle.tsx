import { FontAwesome } from '@expo/vector-icons';
import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ToggleProps {
  value: string;
  iconName?: string;
  onToggle: (value: string) => void;
}

const Toggle = ({ value, iconName, onToggle }: ToggleProps) => {
  const [isActive, setIsActive] = useState(false);

  const toggleSwitch = () => {
    setIsActive(!isActive);
    onToggle(value);
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={toggleSwitch}
      style={isActive ? styles.activeToggle : styles.toggle}
    >
      {iconName && (
        <FontAwesome
          name={iconName as any}
          size={24}
          color={Colors.PRIMARY_EXTRA_DARK}
          style={styles.icon}
        />
      )}
      <Text style={isActive ? styles.activeToggleText : styles.toggleText}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacings.xs,
    borderWidth: 1,
    margin: 4,
    padding: Spacings.xs,
    backgroundColor: Colors.WHITE,
    borderColor: Colors.NEUTRAL,
  },
  activeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
    borderRadius: Spacings.xs,
    borderWidth: 1,
    padding: Spacings.xs,
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    borderColor: Colors.NEUTRAL,
  },
  toggleText: {
    color: Colors.PRIMARY_EXTRA_DARK,
    letterSpacing: 0.4,
  },
  activeToggleText: {
    letterSpacing: 0.4,
  },
  icon: {
    fontSize: FontSizes.sm.fontSize,
    marginRight: Spacings.xs,
  },
});

export default Toggle;
