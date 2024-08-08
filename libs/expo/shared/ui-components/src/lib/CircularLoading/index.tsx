import { Colors } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const CircularLoading = () => {
  const rotation = useSharedValue(0);

  rotation.value = withRepeat(
    withTiming(360, {
      duration: 2000,
      easing: Easing.linear,
    }),
    -1,
    false
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.loadingContainer, animatedStyle]}>
        <Svg height="70" width="70" viewBox="0 0 100 100">
          <Circle
            cx="50"
            cy="50"
            r="40"
            stroke={Colors.NEUTRAL_LIGHT}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <Circle
            cx="50"
            cy="50"
            r="40"
            stroke={Colors.PRIMARY}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="50 250"
            strokeDashoffset="0"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CircularLoading;
