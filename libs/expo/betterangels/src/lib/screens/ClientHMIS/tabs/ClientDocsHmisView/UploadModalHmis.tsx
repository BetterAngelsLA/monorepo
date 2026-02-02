import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  Form,
  LoadingView,
  MediaPickerModal,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import { useHmisFileCategoryAndNames } from '../../../../hooks';
import { FileUploadsPreview } from '../../../../ui-components';
import { FileCategorySelector } from './FileCategorySelector';

export default function UploadModalHmis(props: {
  client?: HmisClientProfileType;
}) {
  const { client } = props;
  const [document, setDocument] = useState<ReactNativeFile | undefined>();
  const [documentCategory, setDocumentCategory] = useState({
    categoryId: '',
    categoryName: '',
    subCategoryId: '',
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const {
    categories: fileCategories,
    fileNames: fileCategyFileNames,
    error,
    loading: loadingCategoryMeta,
  } = useHmisFileCategoryAndNames();

  if (error) {
    console.error(error);

    return null;
  }

  if (loadingCategoryMeta) {
    return <LoadingView />;
  }

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

      {!document && fileCategories && fileCategyFileNames && (
        <FileCategorySelector
          categories={fileCategories}
          subCategories={fileCategyFileNames}
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
