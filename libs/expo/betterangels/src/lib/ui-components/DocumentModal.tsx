import {
  DeleteIcon,
  DownloadIcon,
  ViewIcon,
} from '@monorepo/expo/shared/icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { ClientDocumentType } from '../apollo';
import {
  ClientProfileDocument,
  useDeleteClientDocumentMutation,
} from '../screens/Client/__generated__/Client.generated';
import MainModal from './MainModal';

interface IDocumentModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  document: ClientDocumentType | undefined;
  clientId: string;
}

const MIME_TYPE = 'application/octet-stream';

export default function DocumentModal(props: IDocumentModalProps) {
  const { isModalVisible, closeModal, document, clientId } = props;
  const [deleteDocument] = useDeleteClientDocumentMutation({
    refetchQueries: [
      {
        query: ClientProfileDocument,
        variables: {
          id: clientId,
        },
      },
    ],
    onCompleted: () => {
      closeModal();
    },
  });

  const handleDelete = async () => {
    if (!document?.id) return;
    try {
      await deleteDocument({
        variables: {
          id: document?.id,
        },
      });
    } catch (err) {
      console.error('Error deleting document', err);
      Alert.alert('Error', 'An error occurred while deleting the document.');
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

  const ACTIONS = [
    {
      title: 'View Image',
      Icon: ViewIcon,
      route: `/file/${document?.id}`,
    },
    // {
    //   title: 'Edit this file',
    //   Icon: PencilSolidIcon,
    //   route: `/edit-image/${document?.id}`,
    // },
    {
      title: 'Download this file',
      Icon: DownloadIcon,
      onPress: downloadFile,
    },
    {
      title: 'Delete this file',
      Icon: DeleteIcon,
      onPress: handleDelete,
    },
  ];

  return (
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
