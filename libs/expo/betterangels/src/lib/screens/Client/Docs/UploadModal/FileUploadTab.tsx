import { CheckIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Button } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { DocUploads, ITab } from './types';

export interface IFileUploadTabProps {
  docs: DocUploads;
  setTab?: (tabKey: ITab) => void;
  tabKey: keyof DocUploads;
  title: string;
  allowMultiple?: boolean;
  onPress?: () => void;
}

const FileUploadTab = (props: IFileUploadTabProps) => {
  const { docs, setTab, tabKey, title, allowMultiple = false, onPress } = props;
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
        onPress={() => {
          if (onPress) {
            onPress();
            return;
          }

          setTab?.(tabKey);
        }}
        height="md"
        align="flex-start"
        weight="regular"
        size="full"
        variant="secondary"
        title={title}
        accessibilityHint={`opens the ${title} screen`}
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
    height: 20,
    justifyContent: 'center',
    marginRight: Spacings.xs,
    width: 20,
  },
});
