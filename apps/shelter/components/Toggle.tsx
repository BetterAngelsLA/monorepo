import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

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
    <TouchableOpacity onPress={toggleSwitch} style={isActive ? styles.activeToggle : styles.toggle}>
      {iconName && (
        <FontAwesome 
          name={iconName as any} 
          size={24} 
          color={isActive ? 'white' : 'black'} 
          style={styles.icon}
        />
      )}
      <Text style={isActive ? styles.activeToggleText : styles.toggleText}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    margin: 5,
    borderRadius: 20,
    backgroundColor: '#ccc',
  },
  activeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    margin: 5,
    borderRadius: 20,
    backgroundColor: 'blue',
  },
  toggleText: {
    color: 'black',
  },
  activeToggleText: {
    color: 'white',
  },
  icon: {
    marginRight: 5,
  },
});

export default Toggle;
