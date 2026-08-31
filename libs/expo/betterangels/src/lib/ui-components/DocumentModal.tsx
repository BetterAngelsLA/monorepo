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
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import { Directory, File, Paths } from 'expo-file-system';
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
import { MainModal } from './MainModal';

type ModalState =
  | 'menuVisible'
  | 'menuClosing'
  | 'deleteRequested'
  | 'deleteVisible';

interface IDocumentModalProps {
  closeModal: () => void;
  document: ClientDocumentType;
  clientId: string;
}

export default function DocumentModal({
  closeModal,
  document,
  clientId,
}: IDocumentModalProps) {
  const fileTypeText = getFileTypeText(document.mimeType);

  const { showSnackbar } = useSnackbar();
  const [modalState, setModalState] = useState<ModalState>('menuVisible');

  const [deleteDocument] = useMutation(DeleteClientDocumentDocument, {
    refetchQueries: [
      { query: ClientProfileDocument, variables: { id: clientId } },
    ],
  });

  const { operationKey, successTypename } = deleteClientDocumentMeta;

  const deleteFile = async () => {
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

  const ACTIONS = [
    {
      title: `View ${fileTypeText}`,
      Icon: ViewIcon,
      route: `/file/${document.id}`,
    },
    {
      title: `Edit ${fileTypeText} name`,
      Icon: WFEdit,
      route: `/file/${document.id}?editing=true&clientId=${clientId}`,
    },
    {
      title: `Download ${fileTypeText}`,
      Icon: DownloadIcon,
      onPress: downloadFile,
    },
    {
      title: `Delete ${fileTypeText}`,
      Icon: DeleteIcon,
      onPress: () => setModalState('deleteRequested'),
    },
  ];

  return (
    <>
      {modalState === 'deleteVisible' && (
        <DeleteModal
          isVisible={true}
          body={`All data associated with this ${fileTypeText} will be deleted.`}
          title={`Delete ${fileTypeText}?`}
          onDelete={deleteFile}
          onCancel={() => setModalState('menuVisible')}
          deleteableItemName={fileTypeText}
        />
      )}

      {modalState !== 'deleteVisible' && (
        <MainModal
          isModalVisible={modalState === 'menuVisible'}
          closeButton
          vertical
          actions={ACTIONS}
          closeModal={() => setModalState('menuClosing')}
          opacity={0.5}
          onCloseComplete={() => {
            // MainModal must fully close (animation + unmount) before DeleteModal
            // mounts: RN can only present one Modal at a time, and mounting
            // DeleteModal while MainModal is still up causes the confirm modal to
            // be dropped and the actions sheet to reappear. Can possibly use BottomSheetModal.
            if (modalState === 'deleteRequested') {
              setTimeout(() => {
                setModalState('deleteVisible');
              }, 0);
            } else {
              closeModal();
            }
          }}
        />
      )}
    </>
  );
}

function getFileTypeText(mimeType?: string): string {
  return mimeType?.startsWith('image') ? 'image' : 'file';
}
