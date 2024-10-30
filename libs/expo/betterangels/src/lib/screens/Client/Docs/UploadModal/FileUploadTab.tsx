import { CheckIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Button } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { Docs, ITab } from './types';

export interface IFileUploadTabProps {
  docs: Docs;
  isSingleUpload: boolean;
  setTab: (tabKey: ITab) => void;
  tabKey: keyof Docs;
  title: string;
}

const FileUploadTab = (props: IFileUploadTabProps) => {
  const { docs, isSingleUpload, setTab, tabKey, title } = props;
  const disabled = isSingleUpload && !!docs[tabKey as keyof Docs];

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
          {
            backgroundColor: disabled ? Colors.SUCCESS : Colors.WHITE,
            borderColor: Colors.NEUTRAL_LIGHT,
            borderWidth: disabled ? 0 : 1,
          },
        ]}
      >
        {(disabled && <CheckIcon size="sm" color={Colors.WHITE} />) || (
          <PlusIcon size="sm" color={Colors.PRIMARY_DARK} />
        )}
      </View>

      <Button
        disabled={disabled}
        containerStyle={{ flex: 1 }}
        onPress={() => setTab(tabKey as keyof Docs)}
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
    borderRadius: Radiuses.xxxl,
    height: 20,
    justifyContent: 'center',
    marginRight: Spacings.xs,
    width: 20,
  },
});
