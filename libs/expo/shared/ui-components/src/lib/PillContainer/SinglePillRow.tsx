import { Spacings } from '@monorepo/expo/shared/static';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Pill from '../Pill';
import { IPillProps } from '../Pill/Pill';
import TextRegular from '../TextRegular';

type TProps = {
  pills: string[];
  pillVariant: IPillProps['variant'];
  pillGap?: number;
  style?: ViewStyle;
};

export function SinglePillRow(props: TProps) {
  const { pills, pillVariant, pillGap, style } = props;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.pills, { gap: pillGap }]}>
        {pills.map((item, idx) => (
          <Pill key={idx} variant={pillVariant} label={item} />
        ))}
      </View>

      <View style={styles.total}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']}>
          <TextRegular size="sm">{pills.length}</TextRegular>
        </LinearGradient>

        {/* <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']}>
          <TextRegular size="sm">{pills.length}</TextRegular>
        </LinearGradient> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pills: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  total: {
    paddingRight: Spacings.xs,
    paddingLeft: Spacings.lg,
    backgroundColor: 'red',
    marginLeft: 'auto',
    alignItems: 'center',
    height: '100%',
  },
});
