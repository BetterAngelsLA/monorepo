import { Colors, Spacings } from '@monorepo/expo/shared/static';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

const Copy = ({
  textToCopy,
  closeCopy,
}: {
  textToCopy: string;
  closeCopy: () => void;
}) => {
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(textToCopy);
    closeCopy();
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        style={styles.bubble}
        onPress={copyToClipboard}
      >
        <TextRegular size="xs">Copy</TextRegular>
      </Pressable>
      <View style={styles.triangle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'column',
    borderRadius: 8,
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -25 }],
    alignItems: 'center',
    shadowColor: Colors.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: Colors.WHITE,
  },
  bubble: {
    alignItems: 'center',
    width: 50,
    paddingVertical: Spacings.xs,
  },
  triangle: {
    position: 'absolute',
    width: 0,
    top: '100%',
    borderStyle: 'solid',
    borderTopWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 0,
    borderLeftWidth: 10,
    borderTopColor: Colors.WHITE,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    marginTop: -1,
  },
});

export { Copy };
