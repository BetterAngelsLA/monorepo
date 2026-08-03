import {
  AllowedFileType,
  ErrorHmis,
  InvalidFileTypeErrorHmis,
  ReactNativeFile,
} from '@monorepo/expo/shared/clients';
import {
  Form,
  LoadingView,
  MediaPicker,
} from '@monorepo/expo/shared/ui-components';
import { readFileAsBase64 } from '@monorepo/expo/shared/utils';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import { useClientHmis, useFileCategoryAndNamesHmis } from '../../../../hooks';
import { getClientFilesQueryKey } from '../../../../hooks/fileMetadataHmis/useClientFiles';
import { useUploadProgress } from '../../../../providers';
import { FileUploadsPreview } from '../../../../ui-components';
import { FileCategorySelector } from './FileCategorySelector';

export type TFileCategorySelection = {
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  customFilename?: string;
};

function toErrorMessage(err: unknown): string {
  if (err instanceof InvalidFileTypeErrorHmis) {
    const receivedType = err.data?.received;

    return receivedType
      ? `Sorry, file type "${receivedType}" is not supported.`
      : `Sorry, this file type is not supported.`;
  }

  if (err instanceof ErrorHmis) {
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

  const [document, setDocument] = useState<ReactNativeFile | undefined>();
  const [fileSelection, setFileSelection] =
    useState<TFileCategorySelection | null>(null);

  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload, updateUpload, failUpload, endUpload } =
    useUploadProgress();
  const { uploadClientFile } = useClientHmis();
  const queryClient = useQueryClient();

  const {
    categories: fileCategories,
    fileNames: fileCategoryFileNames,
    error,
    loading: loadingCategoryMeta,
  } = useFileCategoryAndNamesHmis();

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

  async function onSubmit() {
    const clientHmisId = client?.uniqueIdentifier;
    let sessionId: string | undefined;

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

      sessionId = randomUUID();
      startUpload(sessionId, [name.trim()]);
      updateUpload(sessionId, {
        stage: 'UPLOADING',
        completed: 0,
        total: 1,
      });

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

      endUpload(sessionId);

      if (client?.id && client?.hmisId) {
        queryClient.invalidateQueries({
          queryKey: getClientFilesQueryKey(client.id, client.hmisId),
        });
      }

      closeModal();
    } catch (err) {
      console.error('[UploadModalHmis onSubmit]', err);

      // Keep the session so the drawer shows the failure with the specific
      // message; the modal stays open so the user can retry or cancel.
      if (sessionId) {
        failUpload(sessionId, toErrorMessage(err));
      }
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

      <MediaPicker
        allowMultiple={false}
        isOpen={mediaPickerVisible}
        onClose={() => setMediaPickerVisible(false)}
        onCameraCapture={(file) => setDocument(file)}
        onFilesSelected={(files) => setDocument(files[0])}
      />
    </Form.Page>
  );
}
