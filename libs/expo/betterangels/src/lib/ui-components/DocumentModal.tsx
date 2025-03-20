import {
  DeleteIcon,
  DownloadIcon,
  ViewIcon,
} from '@monorepo/expo/shared/icons';
import { BasicModal, Button, TextBold, TextButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, View } from 'react-native';
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

  const fileTypeText = getFileFileTypeText(document?.mimeType);

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
      onPress: () => setDeleteModalVisible(true),
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

      <BasicModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
      >
        <TextBold size="lg">{`Delete ${fileTypeText}?`}</TextBold>
        <TextRegular size="sm" mt="sm">
          {`All data associated with this ${fileTypeText} will be deleted.`}
        </TextRegular>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <TextButton
              fontSize="sm"
              onPress={() => setDeleteModalVisible(false)}
              color="#007AFF"
              accessibilityHint="cancel deletion"
              title="Cancel"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Button
              fontSize="sm"
              size="full"
              accessibilityHint={`deletes the ${fileTypeText}`}
              onPress={() => {
                handleDelete();
                setDeleteModalVisible(false);
                closeModal()
              }}
              variant="primary"
              title="Delete"
            />
          </View>
        </View>
      </BasicModal>
    </>
  );
}

function getFileFileTypeText(mimeType?: string): string {
  if (mimeType?.startsWith('image')) {
    return 'image';
  }

  return 'file';
}
