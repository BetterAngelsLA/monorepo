import {
  HMIS_ALLOWED_FILE_TYPES,
  HmisAllowedFileType,
  ReactNativeFile,
} from '@monorepo/expo/shared/clients';
import {
  Form,
  LoadingView,
  MediaPickerModal,
} from '@monorepo/expo/shared/ui-components';
import { readFileAsBase64 } from '@monorepo/expo/shared/utils';
import {
  HmisError,
  HmisInvalidFileTypeError,
} from 'libs/expo/shared/clients/src/lib/http/hmisError';
import { useState } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import {
  useHmisClient,
  useHmisFileCategoryAndNames,
  useSnackbar,
} from '../../../../hooks';
import { FileUploadsPreview } from '../../../../ui-components';
import { FileCategorySelector } from './FileCategorySelector';

function toErrorMessage(err: unknown): string {
  if (err instanceof HmisInvalidFileTypeError) {
    const receivedType = err.data?.received;

    return receivedType
      ? `Sorry, file type "${receivedType}" is not supported.`
      : `Sorry, this file type is not supported.`;
  }

  if (err instanceof HmisError) {
    if (err.status === 401) {
      return 'Your HMIS session has expired. Please log in again.';
    }

    if (err.status === 403) {
      return 'You do not have permission to upload files for this client.';
    }
  }

  return 'Sorry, something went wrong. Please try again.';
}

type TProps = {
  client?: HmisClientProfileType;
  closeModal: () => void;
};

export default function UploadModalHmis(props: TProps) {
  const { client, closeModal } = props;

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

  function clearDocument() {
    setIsUploading(false);
    setDocument(undefined);
  }

  function onCancel() {
    clearDocument();
    closeModal();
  }

  async function onSubmit() {
    const clientHmisId = client?.uniqueIdentifier;

    try {
      setIsUploading(true);

      if (!clientHmisId || !document) {
        throw new Error('onSubmit called without client or document');
      }

      const { uri, type, name } = document;
      const { categoryId, subCategoryId } = documentCategory;

      const fileBase64 = await readFileAsBase64(uri);

      await uploadClientFile(
        clientHmisId.trim(),
        {
          content: fileBase64,
          name: name.trim(),
          mimeType: type as HmisAllowedFileType, // validate in client
        },
        parseInt(categoryId, 10),
        parseInt(subCategoryId, 10),
        false
      );

      closeModal();
    } catch (err) {
      console.error('[UploadModalHmis onSubmit]', err);

      showSnackbar({
        message: toErrorMessage(err),
        type: 'error',
        persist: true,
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
              onLeftBtnClick: onCancel,
            }
          : undefined
      }
    >
      {!!document && (
        <FileUploadsPreview
          disabled={isUploading}
          title={`Upload ${documentCategory.categoryName}`}
          files={[document]}
          onRemoveFile={clearDocument}
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
