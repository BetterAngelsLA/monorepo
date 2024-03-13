import React, { useState } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface AnimatedButtonProps {
  iconName: string;
  onPress: () => void;
}

const AnimatedButton = ({ iconName, onPress }: AnimatedButtonProps) => {
  const scale = useState(new Animated.Value(1))[0];

  const animatePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.85,
      useNativeDriver: true
    }).start();
  };

  const animatePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity 
        onPressIn={animatePressIn} 
        onPressOut={animatePressOut} 
        onPress={onPress} 
        style={styles.button}
      >
        <FontAwesome name={iconName as any} size={28} color="black" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    margin: 10,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: 'white',
  },
});

export default AnimatedButton;