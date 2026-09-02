import { useMutation } from '@apollo/client/react';
import {
  BaError,
  BaPermissionError,
  getOperationInfoMessage,
} from '@monorepo/ba-platform';
import {
  DeleteIcon,
  DownloadIcon,
  ViewIcon,
  WFEdit,
} from '@monorepo/expo/shared/icons';
import type { TMenuSheetAction } from '@monorepo/expo/shared/ui-components';
import { DeleteModal, MenuSheet } from '@monorepo/expo/shared/ui-components';
import { Directory, File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { ClientDocumentType, OperationMessageKind } from '../apollo';
import { convertCapitalize } from '../helpers';
import { useSnackbar } from '../hooks';
import {
  ClientProfileDocument,
  DeleteClientDocumentDocument,
} from '../screens/Client/__generated__/Client.generated';
import { deleteClientDocumentMeta } from '../screens/Client/__generated__/Client_meta.generated';

interface IDocumentModalProps {
  closeModal: () => void;
  document: ClientDocumentType;
  clientId: string;
  onDeleteStateChange?: (documentId: string, isDeleting: boolean) => void;
}

export default function DocumentModal({
  closeModal,
  document,
  clientId,
  onDeleteStateChange,
}: IDocumentModalProps) {
  const router = useRouter();
  const fileTypeText = getFileTypeText(document.mimeType);

  const { showSnackbar } = useSnackbar();
  // 'menu' → actions sheet; 'confirm' → DeleteModal open (sheet hidden).
  const [stage, setStage] = useState<'menu' | 'confirm'>('menu');

  const [deleteDocument] = useMutation(DeleteClientDocumentDocument, {
    refetchQueries: [
      { query: ClientProfileDocument, variables: { id: clientId } },
    ],
  });

  const { operationKey, successTypename } = deleteClientDocumentMeta;

  const deleteFile = async () => {
    onDeleteStateChange?.(document.id, true);
    closeModal();

    try {
      const result = await deleteDocument({
        variables: { id: document.id },
      });

      const deleteResult = result.data?.deleteClientDocument;

      // Success — file deleted.
      if (deleteResult?.__typename === successTypename) {
        showSnackbar({
          message: `${convertCapitalize(fileTypeText)} deleted.`,
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
      const downloaded = await File.downloadFileAsync(url, cacheDest);

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

  /** View / Edit: navigate to the file screen and close the whole flow. */
  const openFile = (route: string) => {
    router.navigate(route);
    closeModal();
  };

  const actions: TMenuSheetAction[] = [
    {
      title: `View ${fileTypeText}`,
      testId: 'view-file-btn',
      Icon: ViewIcon,
      onPress: () => openFile(`/file/${document.id}`),
    },
    {
      title: `Edit ${fileTypeText} name`,
      testId: 'edit-file-btn',
      Icon: WFEdit,
      onPress: () =>
        openFile(`/file/${document.id}?editing=true&clientId=${clientId}`),
    },
    {
      title: `Download ${fileTypeText}`,
      testId: 'download-file-btn',
      Icon: DownloadIcon,
      onPress: downloadFile,
    },
    {
      title: `Delete ${fileTypeText}`,
      testId: 'delete-file-btn',
      Icon: DeleteIcon,
      onPress: () => setStage('confirm'),
    },
  ];

  return (
    <>
      {/* Actions sheet. Rendered via MenuSheet (Gorhom) which is NOT an RN
          Modal, so DeleteModal can open without the RN-modal handoff that
          caused the old flicker. Hiding the sheet on Delete and reopening it
          on Cancel is just the `stage` toggle below. */}
      <MenuSheet
        isOpen={stage === 'menu'}
        onClose={closeModal}
        actions={actions}
      />

      {stage === 'confirm' && (
        <DeleteModal
          isVisible
          body={`All data associated with this ${fileTypeText} will be deleted.`}
          title={`Delete ${fileTypeText}?`}
          onDelete={deleteFile}
          onCancel={() => setStage('menu')}
          deleteableItemName={fileTypeText}
        />
      )}
    </>
  );
}

function getFileTypeText(mimeType?: string): string {
  return mimeType?.startsWith('image') ? 'image' : 'file';
}
