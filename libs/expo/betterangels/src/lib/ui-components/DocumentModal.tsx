import {
  DeleteIcon,
  DownloadIcon,
  ViewIcon,
  WFEdit,
} from '@monorepo/expo/shared/icons';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { Alert } from 'react-native';
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
    if (!document?.file?.url) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot access media library.');
        return;
      }

      const fileUri = document.file.url;
      const localUri = `${FileSystem.cacheDirectory}${document.originalFilename}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        fileUri,
        localUri
      );
      const data = await downloadResumable.downloadAsync();

      if (!data?.uri) throw new Error('Download failed');

      const asset = await MediaLibrary.createAssetAsync(data.uri);
      await MediaLibrary.createAlbumAsync('Download', asset, false);

      showSnackbar({
        message: 'File saved to Downloads',
        type: 'success',
      });

      closeModal();
    } catch (error) {
      console.error('Error downloading the file:', error);
      Alert.alert('Download Error', 'An error occurred while saving the file.');
    }
  };

  const fileTypeText = getFileFileTypeText(document.mimeType);

  const ACTIONS = [
    {
      title: `View ${fileTypeText}`,
      Icon: ViewIcon,
      route: `/file/${document?.id}`,
    },
    {
      title: `Edit ${fileTypeText} name`,
      Icon: WFEdit,
      route: `/file/${document?.id}?editing=true&clientId=${clientId}`,
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

function getFileFileTypeText(mimeType?: string): string {
  if (mimeType?.startsWith('image')) {
    return 'image';
  }

  return 'file';
}
