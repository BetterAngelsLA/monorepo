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

export default function DocumentModal({
  isModalVisible,
  closeModal,
  document,
  clientId,
}: IDocumentModalProps) {
  const { showSnackbar } = useSnackbar();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [deleteDocument] = useDeleteClientDocumentMutation({
    refetchQueries: [
      { query: ClientProfileDocument, variables: { id: clientId } },
    ],
  });

  const deleteFile = async () => {
    closeModal();
    try {
      await deleteDocument({ variables: { id: document.id } });
    } catch (err) {
      console.error('Error deleting document', err);
      showSnackbar({
        message: 'An error occurred while deleting the document',
        type: 'error',
      });
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
      const cacheUri = `${FileSystem.cacheDirectory}${originalFilename}`;
      const { uri: localUri } = await FileSystem.downloadAsync(url, cacheUri);

      if (Platform.OS === 'android') {
        const perm =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Permission Required',
            'Storage access is required to save the file.'
          );
          return;
        }

        const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          originalFilename,
          mimeType
        );
        const base64 = await FileSystem.readAsStringAsync(localUri, {
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
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('Sharing Error', 'Sharing not supported on this device.');
          return;
        }
        await Sharing.shareAsync(localUri, {
          dialogTitle: 'Save or share file',
          mimeType,
        });
      }

      closeModal();
    } catch (err) {
      console.error('Download failed', err);
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
      onPress: () => setDeleteModalVisible(true),
    },
  ];

  return deleteModalVisible ? (
    <DeleteModal
      body={`All data associated with this ${fileTypeText} will be deleted.`}
      title={`Delete ${fileTypeText}?`}
      onDelete={deleteFile}
      onCancel={() => setDeleteModalVisible(false)}
      isVisible
      deleteableItemName={fileTypeText}
    />
  ) : (
    <MainModal
      closeButton
      vertical
      actions={ACTIONS}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
      opacity={0.5}
    />
  );
}

function getFileTypeText(mimeType?: string): string {
  return mimeType?.startsWith('image') ? 'image' : 'file';
}
