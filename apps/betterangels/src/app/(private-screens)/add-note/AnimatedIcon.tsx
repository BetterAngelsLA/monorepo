import { Colors } from '@monorepo/expo/shared/static';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

const IMAGE_SOURCE = '../../assets/images/transparent-logo.png';

const AnimatedIcon = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(1),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 10,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ]).start(() => {
      setHidden(true);
    });
  }, [scale, opacity, backgroundOpacity]);

  if (hidden) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: backgroundOpacity }]}>
      <Animated.Image
        source={require(IMAGE_SOURCE)}
        style={[
          styles.image,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.PRIMARY,
    flex: 1,
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 100,
    height: 100,
  },
});

export default AnimatedIcon;
