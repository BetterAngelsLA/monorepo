import { UserSearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

type TProps = {
  style?: ViewStyle;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
};

export function NoResultsView(props: TProps) {
  const {
    icon,
    title = 'No results',
    subtitle = 'Try searching for something else.',
    style,
  } = props;

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
        {!!icon && icon}
        {!icon && <UserSearchIcon size="2xl" color={Colors.PRIMARY} />}
      </View>
      <TextBold mb="xs" size="sm">
        {title}
      </TextBold>
      <TextRegular size="sm">{subtitle}</TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
});
