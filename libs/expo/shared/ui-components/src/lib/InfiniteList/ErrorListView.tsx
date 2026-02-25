import { FaceFrownIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View, ViewStyle } from 'react-native';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

type TProps = {
  style?: ViewStyle;
  title?: string;
  bodyText?: string;
};

export function ErrorListView(props: TProps) {
  const {
    style,
    title = 'Sorry, something went wrong.',
    bodyText = "There was an error retrieving the data. Rest assured, we're working on it.",
  } = props;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.icon}>
        <FaceFrownIcon size="2xl" color={Colors.PRIMARY} />
      </View>
      <View style={styles.messages}>
        <TextBold mb="sm" size="sm">
          {title}
        </TextBold>
        <TextRegular size="sm" textAlign="center">
          {bodyText}
        </TextRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  icon: {
    height: 90,
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxl,
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    marginBottom: Spacings.md,
  },
  messages: {
    alignItems: 'center',
    paddingHorizontal: Spacings.md,
  },
});
