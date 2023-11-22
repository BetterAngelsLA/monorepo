import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import BodyText from '../BodyText';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function StatusBadge({
  title,
  mb,
  mt,
  my,
  mx,
  ml,
  mr,
}: {
  title: 'Pending' | 'Accepted';
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            title === 'Accepted'
              ? Colors.SUCCESS_EXTRA_LIGHT
              : Colors.WARNING_EXTRA_LIGHT,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
    >
      <BodyText size="sm">{title}</BodyText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 75,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
});
