import { EditIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import H4 from '../H4';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IFieldCardProps {
  children?: ReactNode;
  title: string;
  Icon?: React.ElementType;
  onPress: () => void;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

export function FieldCard(props: IFieldCardProps) {
  const { children, title, Icon, onPress, mb, mt, mr, ml, my, mx } = props;
  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {Icon ? <Icon mr="xs" color={Colors.PRIMARY_EXTRA_DARK} /> : null}
          <H4>{title}</H4>
        </View>
        <Pressable onPress={onPress}>
          <EditIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </Pressable>
      </View>
      {children && <View style={{ marginTop: Spacings.sm }}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacings.sm,
    borderRadius: 3,
    backgroundColor: Colors.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
