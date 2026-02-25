import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import { TextOrNode } from '@monorepo/expo/shared/ui-components';
import { ElementType, ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type TProps = {
  title: string | ReactNode;
  Icon: ElementType;
  style?: ViewStyle;
};

export function MainModalActionBtnBody(props: TProps) {
  const { title, Icon, style } = props;

  return (
    <View style={[styles.body, style]}>
      <View style={styles.iconWrapper}>
        <Icon color={Colors.PRIMARY_EXTRA_DARK} />
      </View>

      <TextOrNode
        textStyle={{ color: Colors.PRIMARY_EXTRA_DARK, ...FontSizes.md }}
      >
        {title}
      </TextOrNode>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: Radiuses.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
  },
  iconWrapper: {
    marginRight: Spacings.sm,
    height: Spacings.xl,
    width: Spacings.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
