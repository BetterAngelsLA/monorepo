import { useMutation } from '@apollo/client/react';
import {
  BaError,
  BaPermissionError,
  getOperationInfoMessage,
} from '@monorepo/ba-platform';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import { Directory, File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { ClientDocumentType, OperationMessageKind } from '../../apollo';
import { convertCapitalize } from '../../helpers';
import { useSnackbar } from '../../hooks';
import {
  ClientProfileDocument,
  DeleteClientDocumentDocument,
} from '../../screens/Client/__generated__/Client.generated';
import { deleteClientDocumentMeta } from '../../screens/Client/__generated__/Client_meta.generated';
import { DocumentMenu } from './DocumentMenu';
import { getFileTypeLabel } from './utils';

type ModalStep = 'menuOpen' | 'confirmDelete' | 'closed';

interface IDocumentMenuSheetProps {
  closeModal: () => void;
  document: ClientDocumentType;
  clientId: string;
  onDeleteStateChange?: (documentId: string, isDeleting: boolean) => void;
}

/**
 * Orchestrates the document actions flow: presents the `DocumentMenu` sheet
 * and, when delete is chosen, a `DeleteModal` confirmation. Owns the document
 * side effects (navigation, download, delete).
 */
export function DocumentMenuSheet({
  closeModal,
  document,
  clientId,
  onDeleteStateChange,
}: IDocumentMenuSheetProps) {
  const fileTypeLabel = getFileTypeLabel(document.mimeType);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [step, setStep] = useState<ModalStep>('menuOpen');

  const [deleteDocument] = useMutation(DeleteClientDocumentDocument, {
    refetchQueries: [
      { query: ClientProfileDocument, variables: { id: clientId } },
    ],
  });

  const { operationKey, successTypename } = deleteClientDocumentMeta;

  const deleteFile = async () => {
    onDeleteStateChange?.(document.id, true);
    // Dismiss the confirm dialog without unmounting this component. We stay
    // mounted until the mutation settles so we never tear down a presented
    // native modal mid-flight (the old closeModal() here did exactly that).
    setStep('closed');

    try {
      const result = await deleteDocument({
        variables: { id: document.id },
      });

      const deleteResult = result.data?.deleteClientDocument;

      // Success — file deleted.
      if (deleteResult?.__typename === successTypename) {
        showSnackbar({
          message: `${convertCapitalize(fileTypeLabel)} deleted.`,
          type: 'success',
          durationMs: 2000,
        });

        return;
      }

      // Failure
      const permissionMsg = getOperationInfoMessage(
        result,
        operationKey,
        OperationMessageKind.Permission,
      );

      if (permissionMsg) {
        throw new BaPermissionError(permissionMsg.message || undefined);
      }

      throw new Error('unspecified error');
    } catch (err) {
      console.error('Delete file error:', err);

      let errorMessage = 'An error occurred while deleting the document';

      if (err instanceof BaError) {
        errorMessage = err.message;
      }

      showSnackbar({
        message: errorMessage,
        type: 'error',
        persist: true,
      });
    } finally {
      onDeleteStateChange?.(document.id, false);
      closeModal();
    }
  };

  const downloadFile = async () => {
    const { url } = document.file || {};
    const { originalFilename, mimeType } = document;

    if (!url || !originalFilename) {
      Alert.alert('Download Error', 'Missing file URL or filename.');
      return;
    }

    try {
      const cacheDest = new File(new Directory(Paths.cache), originalFilename);
      const downloaded = await File.downloadFileAsync(url, cacheDest, {
        idempotent: true, // prevents existing destination file from causing error on re-download
      });

      if (Platform.OS === 'android') {
        const pickedDir = await Directory.pickDirectoryAsync();
        if (!pickedDir) {
          Alert.alert(
            'Permission Required',
            'Storage access is required to save the file.',
          );
          return;
        }

        const outFile = pickedDir.createFile(
          originalFilename,
          mimeType ?? null,
        );
        const bytes = await downloaded.bytes();
        outFile.write(bytes, {});
      } else {
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('Sharing Error', 'Sharing not supported on this device.');
          return;
        }
        await Sharing.shareAsync(downloaded.uri, {
          dialogTitle: 'Save or share file',
          mimeType,
        });
      }

      closeModal();
    } catch (err) {
      console.error('Download failed', err);
      Alert.alert(
        'Download Error',
        'An error occurred while downloading the file.',
      );
    }
  };

  const handleViewPress = () => {
    closeModal();
    router.navigate({ pathname: '/file/[id]', params: { id: document.id } });
  };

  const handleEditPress = () => {
    closeModal();
    router.navigate({
      pathname: '/file/[id]',
      params: { id: document.id, editing: 'true', clientId },
    });
  };

  return (
    <>
      <DocumentMenu
        isOpen={step === 'menuOpen'}
        onClose={closeModal}
        fileTypeLabel={fileTypeLabel}
        onView={handleViewPress}
        onEdit={handleEditPress}
        onDownload={downloadFile}
        onDelete={() => setStep('confirmDelete')}
      />

      <DeleteModal
        isVisible={step === 'confirmDelete'}
        body={`All data associated with this ${fileTypeLabel} will be deleted.`}
        title={`Delete ${fileTypeLabel}?`}
        onDelete={deleteFile}
        onCancel={() => setStep('menuOpen')}
        deleteableItemName={fileTypeLabel}
      />
    </>
  );
}
