import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Divider } from '@monorepo/expo/shared/ui-components';
import { Children, Fragment, ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
};

export function ClientProfileCardContainer(props: TProps) {
  const { style, children } = props;

  const childrenArray = Children.toArray(children);

  return (
    <View style={[styles.container, style]}>
      {childrenArray.map((child, index) => {
        const showDivider = index < childrenArray.length - 1;

        return (
          <Fragment key={index}>
            {child}
            {showDivider && <Divider />}
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.lg,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.md,
    borderRadius: Radiuses.xs,
  },
});
