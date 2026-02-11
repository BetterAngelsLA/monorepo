import {
  AllowedFileType,
  HmisError,
  HmisInvalidFileTypeError,
  ReactNativeFile,
} from '@monorepo/expo/shared/clients';
import {
  Form,
  LoadingView,
  MediaPickerModal,
} from '@monorepo/expo/shared/ui-components';
import { readFileAsBase64 } from '@monorepo/expo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import {
  useHmisClient,
  useHmisFileCategoryAndNames,
  useSnackbar,
} from '../../../../hooks';
import { getClientFilesQueryKey } from '../../../../hooks/hmisFileMetadata/useClientFiles';
import { FileUploadsPreview } from '../../../../ui-components';
import { FileCategorySelector } from './FileCategorySelector';

export type TFileCategorySelection = {
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  customFilename?: string;
};

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
  const [fileSelection, setFileSelection] =
    useState<TFileCategorySelection | null>(null);

  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { uploadClientFile } = useHmisClient();
  const queryClient = useQueryClient();

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

  function onCancel() {
    setDocument(undefined);
    closeModal();
  }

  function onUploadSuccess() {
    if (client?.id && client?.hmisId) {
      queryClient.invalidateQueries({
        queryKey: getClientFilesQueryKey(client.id, client.hmisId),
      });
    }

    closeModal();
  }

  async function onSubmit() {
    const clientHmisId = client?.uniqueIdentifier;

    try {
      setIsUploading(true);

      if (!clientHmisId || !document || !fileSelection) {
        throw new Error('Missing client, document or file name/category');
      }

      const { uri, type, name } = document;
      const { categoryId, subCategoryId, customFilename } = fileSelection;

      if (!categoryId || !subCategoryId) {
        throw new Error('Missing category or subcategory Id');
      }

      const parsedCategoryId = parseInt(categoryId, 10);
      const parsedSubCategoryId = parseInt(subCategoryId, 10);

      const customFileName =
        parsedSubCategoryId === 0 ? customFilename?.trim() : undefined;

      if (parsedSubCategoryId === 0 && !customFileName) {
        throw new Error('No filename entered for subcategory_id [0]');
      }

      const fileBase64 = await readFileAsBase64(uri);

      await uploadClientFile({
        clientId: clientHmisId.trim(),
        file: {
          content: fileBase64,
          name: name.trim(),
          mimeType: type as AllowedFileType,
        },
        categoryId: parsedCategoryId,
        fileNameId: parsedSubCategoryId,
        customFileName,
        isPrivate: false,
      });

      onUploadSuccess();
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
      showLoadingOverlay={isUploading}
      actionProps={
        document
          ? {
              onSubmit,
              onLeftBtnClick: onCancel,
              disabled: isUploading,
            }
          : undefined
      }
    >
      {!!document && fileSelection && (
        <FileUploadsPreview
          disabled={isUploading}
          title={`Upload ${fileSelection.categoryName}`}
          files={[document]}
          onRemoveFile={() => setDocument(undefined)}
        />
      )}

      {!document && fileCategories && fileCategoryFileNames && (
        <FileCategorySelector
          disabled={isUploading}
          categories={fileCategories}
          subCategories={fileCategoryFileNames}
          onSelect={(selection) => {
            if (selection.type === 'predefined') {
              setFileSelection({
                categoryId: selection.categoryId,
                subCategoryId: selection.subCategoryId,
                categoryName: selection.categoryName,
              });
            } else {
              setFileSelection({
                categoryId: selection.categoryId,
                subCategoryId: '0',
                categoryName: selection.categoryName,
                customFilename: selection.fileName,
              });
            }

            setMediaPickerVisible(true);
          }}
        />
      )}

      <MediaPickerModal
        onCapture={(file) => {
          setDocument(file);
        }}
        allowMultiple={false}
        setModalVisible={setMediaPickerVisible}
        isModalVisible={mediaPickerVisible}
        setFiles={(files) => {
          setDocument(files[0]);
        }}
        labels={{
          file: 'From Files folder',
        }}
      />
    </Form.Page>
  );
}
