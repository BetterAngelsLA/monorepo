import {
  DeleteIcon,
  DownloadIcon,
  ViewIcon,
  WFEdit,
} from '@monorepo/expo/shared/icons';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { ClientDocumentType } from '../apollo';
import { useSnackbar } from '../hooks';
import {
  ClientProfileDocument,
  useDeleteClientDocumentMutation,
} from '../screens/Client/__generated__/Client.generated';
import MainModal from './MainModal';

interface IDocumentModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  document: ClientDocumentType;
  clientId: string;
}

export default function DocumentModal(props: IDocumentModalProps) {
  const { isModalVisible, closeModal, document, clientId } = props;
  const { showSnackbar } = useSnackbar();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [deleteDocument] = useDeleteClientDocumentMutation({
    refetchQueries: [
      {
        query: ClientProfileDocument,
        variables: {
          id: clientId,
        },
      },
    ],
  });

  const onClickDeleteFile = async () => {
    setDeleteModalVisible(true);
  };

  const deleteFile = async () => {
    closeModal();
    try {
      await deleteDocument({
        variables: {
          id: document.id,
        },
      });
    } catch (err) {
      console.error('[DocumentModal] Error deleting document', err);
      showSnackbar({
        message: 'An error occurred while deleting the document',
        type: 'error',
      });
    }
  };

  const downloadFile = async () => {
    if (!document?.file?.url) {
      console.warn('No file URL to download');
      return;
    }

    const remoteUrl = document.file.url;
    const filename = document.originalFilename;
    const mimeType = document.mimeType;
    if (!filename) {
      console.error('Missing originalFilename');
      Alert.alert('Download Error', 'Filename is missing.');
      return;
    }

    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      console.error('Cache directory unavailable');
      Alert.alert('Download Error', 'Unable to access cache directory.');
      return;
    }

    try {
      // 1. Download to cache
      const localUri = `${cacheDir}${filename}`;
      const { uri: downloadedUri } = await FileSystem.downloadAsync(
        remoteUrl,
        localUri
      );

      if (Platform.OS === 'android') {
        // 2A. Request directory permissions (SAF)
        const permResult =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permResult.granted) {
          Alert.alert(
            'Permission Required',
            'Permission to access storage is required to save the file.'
          );
          return;
        }

        // 2B. Create and write file in chosen directory
        const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permResult.directoryUri,
          filename,
          mimeType
        );
        const base64 = await FileSystem.readAsStringAsync(downloadedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.StorageAccessFramework.writeAsStringAsync(
          newUri,
          base64,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        );
      } else {
        // iOS: share dialog (iCloud, Files, AirDrop)
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          Alert.alert(
            'Sharing not available',
            'Sharing is not supported on this device.'
          );
          return;
        }

        await Sharing.shareAsync(downloadedUri, {
          dialogTitle: 'Save or share file',
          mimeType,
        });
      }

      closeModal();
    } catch (error) {
      console.error('Error downloading the file:', error);
      Alert.alert(
        'Download Error',
        'An error occurred while downloading the file.'
      );
    }
  };

  const fileTypeText = getFileTypeText(document.mimeType);

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
      onPress: onClickDeleteFile,
    },
  ];

  return (
    <>
      <MainModal
        closeButton
        vertical
        actions={ACTIONS}
        isModalVisible={isModalVisible}
        closeModal={closeModal}
        opacity={0.5}
      />

      <DeleteModal
        body={`All data associated with this ${fileTypeText} will be deleted.`}
        title={`Delete ${fileTypeText}?`}
        onDelete={deleteFile}
        onCancel={() => setDeleteModalVisible(false)}
        isVisible={deleteModalVisible}
        deleteableItemName={fileTypeText}
      />
    </>
  );
}

function getFileTypeText(mimeType?: string): string {
  if (mimeType?.startsWith('image')) {
    return 'image';
  }

  return 'file';
}
