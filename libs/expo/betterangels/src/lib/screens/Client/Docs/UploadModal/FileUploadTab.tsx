import { CheckIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { DocUploads } from './types';

export interface IFileUploadTabProps {
  docs: DocUploads;
  tabKey: keyof DocUploads;
  title: string;
  allowMultiple?: boolean;
  onPress: () => void;
}

/** Size of the circular status badge (plus/check) before each row. */
const ICON_BADGE_SIZE = 20;
/** Matches Button height="lg" so completed rows line up with active rows. */
const ROW_HEIGHT = 44;

const FileUploadTab = (props: IFileUploadTabProps) => {
  const { docs, tabKey, title, allowMultiple = false, onPress } = props;
  const isComplete = !allowMultiple && docs[tabKey].length > 0;

  return (
    <View style={styles.row}>
      <View style={[styles.tabIcon, isComplete && styles.tabIconComplete]}>
        {isComplete ? (
          <CheckIcon size="sm" color={Colors.WHITE} />
        ) : (
          <PlusIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
        )}
      </View>

      {isComplete ? (
        <View
          style={styles.completeRow}
          accessible
          accessibilityLabel={`${title} — uploaded`}
        >
          <TextRegular
            size="sm"
            color={Colors.NEUTRAL_EXTRA_DARK}
            style={styles.completeTitle}
          >
            {title}
          </TextRegular>
          <TextRegular size="xs" color={Colors.SUCCESS}>
            Uploaded
          </TextRegular>
        </View>
      ) : (
        <Button
          containerStyle={{ flex: 1 }}
          onPress={onPress}
          height="lg"
          align="flex-start"
          weight="regular"
          size="full"
          variant="secondary"
          title={title}
          accessibilityHint={`opens the file picker for ${title}`}
        />
      )}
    </View>
  );
};

export default FileUploadTab;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xxxl,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
    height: ICON_BADGE_SIZE,
    justifyContent: 'center',
    marginRight: Spacings.xs,
    width: ICON_BADGE_SIZE,
  },
  tabIconComplete: {
    backgroundColor: Colors.SUCCESS,
    borderWidth: 0,
  },
  completeRow: {
    flex: 1,
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.xs,
  },
  completeTitle: {
    flex: 1,
  },
});
