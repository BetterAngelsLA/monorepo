import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  MediaPickerModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HmisClientProfileType } from '../../../../apollo';
import { FileUploadsPreview } from '../../../../ui-components';
import { FileCategorySelector } from './FileCategorySelector';

export default function UploadModalHmis(props: {
  client?: HmisClientProfileType;
  closeModal: () => void;
}) {
  const { client, closeModal } = props;
  const [document, setDocument] = useState<ReactNativeFile | undefined>();
  const [documentCategory, setDocumentCategory] = useState({
    category: '',
    value: '',
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  return (
    <View
      style={{
        paddingTop: topOffset + Spacings.xs,
        backgroundColor: Colors.WHITE,
        flex: 1,
      }}
    >
      <ScrollView
        style={{
          paddingHorizontal: Spacings.sm,
          paddingBottom: 35 + bottomOffset,
        }}
      >
        {document ? (
          <FileUploadsPreview
            files={[document]}
            onRemoveFile={() => setDocument(undefined)}
            title={`Upload ${documentCategory.category}`}
          />
        ) : (
          <FileCategorySelector
            closeModal={closeModal}
            onSelect={({ category, value }) => {
              setDocumentCategory({
                category,
                value,
              });
              setIsModalVisible(true);
            }}
          />
        )}
      </ScrollView>
      {document && (
        <BottomActions
          cancel={
            <TextButton
              onPress={() => setDocument(undefined)}
              title="Cancel"
              accessibilityHint="Cancel upload"
            />
          }
          onSubmit={() => console.log('Uploading file...', client?.id)} // TODO: implement upload logic
        />
      )}
      <MediaPickerModal
        onCapture={(file) => {
          setDocument(file);
        }}
        allowMultiple={false}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setDocument(files[0]);
        }}
      />
    </View>
  );
}
