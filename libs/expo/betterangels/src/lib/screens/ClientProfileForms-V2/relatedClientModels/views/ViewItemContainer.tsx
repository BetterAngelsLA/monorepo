import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { EditButton } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
  onClickEdit: () => void;
  accessibilityHint?: string;
};

export function ViewItemContainer(props: TProps) {
  const { accessibilityHint, children, style, onClickEdit } = props;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.contentColumn}>{children}</View>

      <View>
        <EditButton
          onClick={onClickEdit}
          accessibilityHint={accessibilityHint || 'edit item'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    borderRadius: Radiuses.xs,
  },
  contentColumn: {
    flex: 1,
    marginTop: 6,
  },
});
