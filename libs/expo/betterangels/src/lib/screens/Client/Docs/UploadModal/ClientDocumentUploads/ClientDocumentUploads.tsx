import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors } from '@monorepo/expo/shared/static';
import { MediaPicker } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import { useSnackbar } from '../../../../../hooks';
import { useClientDocumentUpload } from './useClientDocumentUpload';

export interface IClientDocUploadsProps {
  clientProfileId: string | undefined;
  files: ReactNativeFile[];
  onFilesChange: (files: ReactNativeFile[]) => void;
  onClose: () => void;
  onUploadSuccess?: () => void;
  onUploadError?: () => void;
  namespace: ClientDocumentNamespaceEnum;
  title: string;
  allowMultiple?: boolean;
}

export function ClientDocumentUploads(props: IClientDocUploadsProps) {
  const {
    clientProfileId,
    files,
    onFilesChange,
    onClose,
    onUploadSuccess,
    onUploadError,
    namespace,
    title,
    allowMultiple = false,
  } = props;

  const { uploadDocuments } = useClientDocumentUpload();
  const { showSnackbar } = useSnackbar();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setIsModalVisible(true);
  }, []);

  const handleMediaPickerClose = () => {
    setIsModalVisible(false);

    setTimeout(() => {
      onClose();
    }, 250);
  };

  const uploadSelectedFiles = async (selectedFiles: ReactNativeFile[]) => {
    if (!clientProfileId || !selectedFiles.length) {
      return;
    }

    try {
      setProcessing(true);

      await uploadDocuments({
        clientProfileId,
        documents: selectedFiles,
        namespace,
      });

      onUploadSuccess?.();
    } catch (err) {
      console.error(`[ClientDocumentUploads error:] ${err}`);

      onUploadError?.();

      showSnackbar({
        message: `Sorry, there was an error with the file upload.`,
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!clientProfileId) {
      return;
    }

    try {
      setProcessing(true);

      await uploadDocuments({
        clientProfileId,
        documents: files,
        namespace,
      });

      onUploadSuccess?.();
    } catch (err) {
      console.error(`[ClientDocumentUploads error:] ${err}`);

      onUploadError?.();

      showSnackbar({
        message: `Sorry, there was an error with the file upload.`,
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const onRemoveFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const onFilenameChange = (index: number, value: string) => {
    onFilesChange(
      files.map((file, i) => (i === index ? { ...file, name: value } : file))
    );
  };

  const allDocsValid = files.every((file) => {
    return !!file.name && !!file.type && !!file.uri;
  });

  return (
    <View style={{ flex: 1 }}>
      {processing ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Colors.WHITE,
          }}
        >
          <ActivityIndicator
            size="large"
            color={Colors.PRIMARY}
            style={{ transform: [{ translateY: -40 }] }}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <MediaPicker
        allowMultiple={allowMultiple}
        isOpen={isModalVisible}
        onClose={handleMediaPickerClose}
        onSelectionComplete={() => setIsModalVisible(false)}
        onCameraCapture={(file) => {
          const selectedFiles = allowMultiple ? [...files, file] : [file];

          onFilesChange(selectedFiles);
          uploadSelectedFiles(selectedFiles);
        }}
        onFilesSelected={(newFiles) => {
          const selectedFiles = allowMultiple
            ? [...files, ...newFiles]
            : [newFiles[0]];

          onFilesChange(selectedFiles);
          uploadSelectedFiles(selectedFiles);
        }}
      />
    </View>
  );
}
