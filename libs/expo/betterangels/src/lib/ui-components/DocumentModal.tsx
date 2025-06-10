import {
  DeleteIcon,
  DownloadIcon,
  ViewIcon,
} from '@monorepo/expo/shared/icons';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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

const MIME_TYPE = 'application/octet-stream';

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
      return;
    }

    try {
      const fileUri = document.file.url;
      const downloadLocation = `${FileSystem.documentDirectory}${document.originalFilename}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        fileUri,
        downloadLocation
      );

      const data = await downloadResumable.downloadAsync();

      if ((await Sharing.isAvailableAsync()) && data?.uri) {
        await Sharing.shareAsync(data?.uri, {
          mimeType: MIME_TYPE,
          dialogTitle: 'Save file to Files',
        });
      } else {
        Alert.alert(
          'Sharing not available',
          'Sharing is not supported on this device.'
        );
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

  const fileTypeText = getFileFileTypeText(document.mimeType);

  const ACTIONS = [
    {
      title: `View this ${fileTypeText}`,
      Icon: ViewIcon,
      route: `/file/${document?.id}`,
    },
    {
      title: `Edit filename`,
      Icon: ViewIcon,
      route: `/file/${document?.id}?editing=true`,
    },
    {
      title: `Download this ${fileTypeText}`,
      Icon: DownloadIcon,
      onPress: downloadFile,
    },
    {
      title: `Delete this ${fileTypeText}`,
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
