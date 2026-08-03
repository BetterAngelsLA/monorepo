import { CheckIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Button } from '@monorepo/expo/shared/ui-components';
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

const FileUploadTab = (props: IFileUploadTabProps) => {
  const { docs, tabKey, title, allowMultiple = false, onPress } = props;
  const disabled = !allowMultiple && docs[tabKey].length > 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={[
          styles.tabIcon,
          disabled && {
            backgroundColor: Colors.SUCCESS,
            borderWidth: 0,
          },
        ]}
      >
        {(disabled && <CheckIcon size="sm" color={Colors.WHITE} />) || (
          <PlusIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
        )}
      </View>

      <Button
        disabled={disabled}
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
    </View>
  );
};

export default FileUploadTab;

const styles = StyleSheet.create({
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
});
