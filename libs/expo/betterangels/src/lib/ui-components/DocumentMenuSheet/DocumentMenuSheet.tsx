import { useMutation } from '@apollo/client/react';
import {
  BaError,
  BaPermissionError,
  getOperationInfoMessage,
} from '@monorepo/ba-platform';
import {
  BottomSheetModalControlled,
  DeleteModal,
} from '@monorepo/expo/shared/ui-components';
import { downloadInBrowser } from '@monorepo/expo/shared/utils';
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

type ModalState = 'menuOpen' | 'confirmDelete' | 'closed';

interface IDocumentMenuSheetProps {
  onClose: () => void;
  document: ClientDocumentType;
  clientId: string;
  onDeleteStateChange?: (documentId: string, isDeleting: boolean) => void;
}

/**
 * Orchestrates the document actions flow: presents the `DocumentMenu` in a
 * bottom sheet and, when delete is chosen, a `DeleteModal` confirmation. Owns
 * the document side effects (navigation, download, delete).
 */
export function DocumentMenuSheet({
  onClose,
  document,
  clientId,
  onDeleteStateChange,
}: IDocumentMenuSheetProps) {
  const fileTypeLabel = getFileTypeLabel(document.mimeType);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [modalState, setModalState] = useState<ModalState>('menuOpen');

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
    // native modal mid-flight (we used to call onClose() here, which did
    // exactly that).
    setModalState('closed');

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
      onClose();
    }
  };

  const downloadFile = async () => {
    const { url } = document.file || {};
    const { originalFilename, mimeType } = document;

    if (!url || !originalFilename) {
      Alert.alert('Download Error', 'Missing file URL or filename.');
      return;
    }

    // A browser has no file system to download into and no share sheet — hand
    // the URL to the browser's own download machinery instead. expo-file-system
    // is a warn-only stub on web, so the native path below cannot run there.
    if (Platform.OS === 'web') {
      // Only surfaces "we could not start the download" (no DOM). A failure
      // *after* dispatch is the browser's to report: it owns the transfer, and
      // checking it ourselves would mean fetching the bytes — the exact CORS
      // dependency this direct hand-off avoids.
      const started = downloadInBrowser(url, originalFilename);

      if (!started) {
        showSnackbar({
          message: 'An error occurred while downloading the file.',
          type: 'error',
        });
        return;
      }

      onClose();
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

      onClose();
    } catch (err) {
      console.error('Download failed', err);
      Alert.alert(
        'Download Error',
        'An error occurred while downloading the file.',
      );
    }
  };

  const handleViewPress = () => {
    onClose();
    router.navigate({ pathname: '/file/[id]', params: { id: document.id } });
  };

  const handleEditPress = () => {
    onClose();
    router.navigate({
      pathname: '/file/[id]',
      params: { id: document.id, editing: 'true', clientId },
    });
  };

  return (
    <>
      <BottomSheetModalControlled
        isOpen={modalState === 'menuOpen'}
        onClose={onClose}
        options={{ showHandle: true }}
      >
        <DocumentMenu
          fileTypeLabel={fileTypeLabel}
          onView={handleViewPress}
          onEdit={handleEditPress}
          onDownload={downloadFile}
          onDelete={() => setModalState('confirmDelete')}
        />
      </BottomSheetModalControlled>

      <DeleteModal
        isVisible={modalState === 'confirmDelete'}
        body={`All data associated with this ${fileTypeLabel} will be deleted.`}
        title={`Delete ${fileTypeLabel}?`}
        onDelete={deleteFile}
        onCancel={() => setModalState('menuOpen')}
        deleteableItemName={fileTypeLabel}
      />
    </>
  );
}
