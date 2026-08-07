import { FileOutlineIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

export default function EmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FileOutlineIcon size={40} color={Colors.NEUTRAL_EXTRA_DARK} />
        <View style={styles.badge}>
          <PlusIcon size={10} color={Colors.PRIMARY_EXTRA_DARK} />
        </View>
      </View>

      <View style={styles.textContainer}>
        <TextBold
          size="xsm"
          color={Colors.NEUTRAL_EXTRA_DARK}
          textAlign="center"
        >
          No files yet
        </TextBold>
        <TextRegular
          size="sm"
          color={Colors.NEUTRAL_EXTRA_DARK}
          textAlign="center"
        >
          After you upload a file, it will appear here along with its folder.
        </TextRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacings.xl,
    paddingHorizontal: Spacings.lg,
    gap: Spacings.md,
  },
  iconContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxl,
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
  },
  badge: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxl,
    backgroundColor: Colors.PRIMARY_LIGHT,
    borderWidth: 2,
    borderColor: Colors.PRIMARY_EXTRA_LIGHT,
  },
  textContainer: {
    alignItems: 'center',
    gap: Spacings.xs,
  },
});
