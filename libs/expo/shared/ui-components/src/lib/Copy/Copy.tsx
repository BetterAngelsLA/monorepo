import { Colors, Spacings } from '@monorepo/expo/shared/static';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, View } from 'react-native';
import BodyText from '../BodyText';

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
        <BodyText size="xs">Copy</BodyText>
      </Pressable>
      <View style={styles.triangle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'column',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -25 }],

    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bubble: {
    alignItems: 'center',
    width: 50,
    paddingVertical: Spacings.xs,
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
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
