import {
  DeleteIcon,
  DownloadIcon,
  PencilSolidIcon,
  ViewIcon,
} from '@monorepo/expo/shared/icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
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
  const router = useRouter();

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
    }
  };

  const downloadFile = async () => {
    if (!document?.file?.url) return;
    try {
      const fileUri = document.file.url;
      const downloadLocation = `${FileSystem.documentDirectory}${document.originalFilename}`;

      await FileSystem.downloadAsync(fileUri, downloadLocation);

      closeModal();
    } catch (error) {
      console.error('Error downloading the file:', error);
    }
  };

  const ACTIONS = [
    {
      title: 'View Image',
      Icon: ViewIcon,
      route: `/image/${document?.id}`,
    },
    {
      title: 'Edit this file',
      Icon: PencilSolidIcon,
      route: `/edit-image/${document?.id}`,
    },
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
