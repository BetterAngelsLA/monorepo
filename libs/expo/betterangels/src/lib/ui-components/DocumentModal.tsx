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

  const fileTypeText = getFileFileTypeText(document?.file.url);

  const ACTIONS = [
    {
      title: `View this ${fileTypeText}`,
      Icon: ViewIcon,
      route: `/file/${document?.id}`,
    },
    {
      title: `Download this ${fileTypeText}`,
      Icon: DownloadIcon,
      onPress: downloadFile,
    },
    {
      title: `Delete this ${fileTypeText}`,
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

type TFileType = 'image' | 'pdf' | 'other' | 'unknown' | null;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'];

// TODO if DEV-1493 is ever implemented and document has a mimeType
function getFileTypeFromExtension(url?: string): TFileType {
  if (!url) {
    return null;
  }

  const extension = url.split('.').pop()?.toLowerCase();

  if (!extension) {
    return 'unknown';
  }

  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'image';
  }

  if (extension === 'pdf') {
    return 'pdf';
  }

  return 'other';
}

function getFileFileTypeText(url?: string): string {
  const fileType = getFileTypeFromExtension(url);

  if (fileType === 'image') {
    return 'image';
  }

  return 'file';
}
