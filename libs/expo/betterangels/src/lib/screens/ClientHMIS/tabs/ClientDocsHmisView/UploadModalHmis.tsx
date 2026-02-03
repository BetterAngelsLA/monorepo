import {
  ALLOWED_FILE_TYPES,
  AllowedFileType,
  ReactNativeFile,
} from '@monorepo/expo/shared/clients';
import {
  Form,
  LoadingView,
  MediaPickerModal,
} from '@monorepo/expo/shared/ui-components';
import {
  readFileAsBase64,
  validateFileSize,
} from '@monorepo/expo/shared/utils';
import { useState } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import { useHmisClient, useHmisFileCategoryAndNames } from '../../../../hooks';
import { FileUploadsPreview } from '../../../../ui-components';
import { FileCategorySelector } from './FileCategorySelector';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB - adjust as needed
const MAX_UPLOAD_BYTES = Math.floor(MAX_FILE_SIZE_BYTES * 0.72); // rough adjustment for base64 encoding

function isAllowedFileMimeType(
  mimeType: string | null | undefined
): mimeType is AllowedFileType {
  return ALLOWED_FILE_TYPES.includes(mimeType as AllowedFileType);
}

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

  const { uploadClientFile } = useHmisClient();

  const {
    categories: fileCategories,
    fileNames: fileCategoryFileNames,
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

  async function onSubmit() {
    const clientHmisId = client?.uniqueIdentifier;

    if (!clientHmisId || !document) {
      return;
    }

    try {
      const { uri, type, name } = document;

      if (!isAllowedFileMimeType(type)) {
        throw new Error(
          `invalid mimeType [${type}] for document name [${name}]`
        );
      }

      await validateFileSize(document.uri, MAX_UPLOAD_BYTES);

      const fileBase64 = await readFileAsBase64(uri);

      const { categoryId, subCategoryId } = documentCategory;

      const result = await uploadClientFile(
        clientHmisId.trim(),
        {
          content: fileBase64,
          name: name.trim(),
          mimeType: type,
        },
        parseInt(categoryId, 10),
        parseInt(subCategoryId, 10),
        false
      );

      console.log();
      console.log('| -------------  result  ------------- |');
      console.log(result);
      console.log();
    } catch (err) {
      console.error(`[UploadModalHmis onSubmit] ${err}`);
    }
  }

  return (
    <Form.Page
      actionProps={
        document
          ? {
              onSubmit,
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

      {!document && fileCategories && fileCategoryFileNames && (
        <FileCategorySelector
          categories={fileCategories}
          subCategories={fileCategoryFileNames}
          onSelect={({ categoryId, categoryName, subCategoryId }) => {
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
