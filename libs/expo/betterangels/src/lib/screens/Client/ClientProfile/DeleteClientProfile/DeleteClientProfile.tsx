import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

type TProps = {
  hello?: string;
};

export function DeleteClientProfile(props: TProps) {
  //   const { } = props;

  return (
    <View style={styles.container}>
      <TextRegular color={Colors.WHITE}>DELETE PROFILE</TextRegular>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
