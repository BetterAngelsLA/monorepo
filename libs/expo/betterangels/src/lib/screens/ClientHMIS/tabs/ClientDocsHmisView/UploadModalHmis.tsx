import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Form, MediaPickerModal } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
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
    categoryId: '',
    categoryName: '',
    subCategoryId: '',
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <Form.Page
      actionProps={
        document
          ? {
              onSubmit: () => console.log('Uploading file...', client?.id),
              onLeftBtnClick: () => setDocument(undefined),
            }
          : undefined
      }
    >
      {!!document && (
        <FileUploadsPreview
          files={[document]}
          onRemoveFile={() => setDocument(undefined)}
          title={`Upload ${documentCategory.categoryName}`}
        />
      )}

      {!document && (
        <FileCategorySelector
          onSelect={({ categoryId, subCategoryId, categoryName }) => {
            setDocumentCategory({
              categoryId,
              subCategoryId,
              categoryName,
            });
            setIsModalVisible(true);
          }}
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
    </Form.Page>
  );
}
