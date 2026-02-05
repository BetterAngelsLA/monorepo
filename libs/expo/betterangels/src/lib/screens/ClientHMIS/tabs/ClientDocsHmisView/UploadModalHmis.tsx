import {
  HMIS_ALLOWED_FILE_TYPES,
  HmisFileError,
  HmisFileErrorCode,
  ReactNativeFile,
} from '@monorepo/expo/shared/clients';
import {
  Form,
  LoadingView,
  MediaPickerModal,
} from '@monorepo/expo/shared/ui-components';
import { readFileAsBase64 } from '@monorepo/expo/shared/utils';
import { useState } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import {
  useHmisClient,
  useHmisFileCategoryAndNames,
  useSnackbar,
} from '../../../../hooks';
import { FileUploadsPreview } from '../../../../ui-components';
import { FileCategorySelector } from './FileCategorySelector';

export default function UploadModalHmis(props: {
  client?: HmisClientProfileType;
}) {
  const { client } = props;
  const { showSnackbar } = useSnackbar();
  const [document, setDocument] = useState<ReactNativeFile | undefined>();
  const [documentCategory, setDocumentCategory] = useState({
    categoryId: '',
    categoryName: '',
    subCategoryId: '',
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      setIsUploading(true);

      const { uri, type, name } = document;
      const { categoryId, subCategoryId } = documentCategory;

      const fileBase64 = await readFileAsBase64(uri);

      const result = await uploadClientFile(
        clientHmisId.trim(),
        {
          content: fileBase64,
          name: name.trim(),
          // mimeType: type as HmisAllowedFileType,
          mimeType: 'hello' as any,
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
      let errMessage = 'Sorry, something went wrong. Please try again.';

      if (err instanceof HmisFileError) {
        if (err.code === HmisFileErrorCode.INVALID_FILE_TYPE) {
          const receivedMimeType = (err as any).data['received'];

          errMessage = receivedMimeType
            ? `Sorry, file type "${receivedMimeType}" is not supported.`
            : `Sorry, this file type is not supported.`;
        }
      }

      console.error(`[UploadModalHmis onSubmit] ${error}`);

      showSnackbar({
        message: errMessage,
        type: 'error',
      });
    } finally {
      setIsUploading(false);
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
          disabled={isUploading}
          files={[document]}
          onRemoveFile={(x) => {
            console.log('*****************  onRemoveFile:', x);

            setDocument(undefined);
          }}
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
        mimeTypes={HMIS_ALLOWED_FILE_TYPES}
      />
    </Form.Page>
  );
}
