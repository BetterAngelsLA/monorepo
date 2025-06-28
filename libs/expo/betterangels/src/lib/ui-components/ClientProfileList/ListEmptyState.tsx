import { UserAddOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View, ViewStyle } from 'react-native';

type TProps = {
  style?: ViewStyle;
};

export function ListEmptyState(props: TProps) {
  const { style } = props;

  return (
    <View style={[styles.container, style]}>
      <View
        style={{
          height: 90,
          width: 90,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: Radiuses.xxxl,
          backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
          marginBottom: Spacings.md,
        }}
      >
        <UserAddOutlineIcon size="2xl" color={Colors.PRIMARY} />
      </View>
      <TextBold mb="xs" size="sm">
        No Active Clients
      </TextBold>
      <TextRegular size="sm">
        Try adding a client or an interaction.
      </TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacings.xl,
  },
});
