import { Colors } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import BodyText from '../BodyText';

const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

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
          marginBottom: mb && SPACING[mb],
          marginTop: mt && SPACING[mt],
          marginLeft: ml && SPACING[ml],
          marginRight: mr && SPACING[mr],
          marginHorizontal: mx && SPACING[mx],
          marginVertical: my && SPACING[my],
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
