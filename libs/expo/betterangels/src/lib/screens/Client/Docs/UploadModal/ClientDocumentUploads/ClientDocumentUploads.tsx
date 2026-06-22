import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { MediaPicker, TextBold } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import { UploadSection } from '../UploadSection';
import UploadsPreview from '../UploadsPreview';
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
    if (!clientProfileId || !selectedFiles.length) return;

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
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!clientProfileId) return;

    await uploadSelectedFiles(files);
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

  if (processing) {
    return (
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
    );
  }

  return (
    <>
      <UploadSection
        loading={processing}
        disabled={!files.length || !allDocsValid}
        title={title}
        onSubmit={handleUpload}
        onCancel={() => {
          onFilesChange([]);
          onClose();
        }}
      >
        <View
          style={{
            padding: Spacings.sm,
            paddingBottom: Spacings.lg,
            marginBottom: Spacings.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomColor: Colors.NEUTRAL_LIGHT,
            borderBottomWidth: 1,
          }}
        >
          <Pressable
            onPress={() => setIsModalVisible(true)}
            accessibilityRole="button"
            style={{ alignItems: 'center' }}
          >
            <View
              style={{
                flexDirection: 'row',
                gap: Spacings.xs,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.NEUTRAL_LIGHT,
                borderRadius: Radiuses.xs,
                height: 66,
                width: 139,
              }}
            >
              <UploadIcon size="lg" />
              <TextBold size="sm">Upload</TextBold>
            </View>
          </Pressable>
        </View>

        {files.length > 0 && (
          <UploadsPreview
            files={files}
            onRemoveFile={onRemoveFile}
            onFilenameChange={onFilenameChange}
            documentType={namespace}
          />
        )}
      </UploadSection>

      <MediaPicker
        allowMultiple={allowMultiple}
        isOpen={isModalVisible}
        onClose={handleMediaPickerClose}
        onSelectionComplete={() => setIsModalVisible(false)}
        onCameraCapture={(file) => {
          const updatedFiles = allowMultiple ? [...files, file] : [file];
          onFilesChange(updatedFiles);
          uploadSelectedFiles([file]);
        }}
        onFilesSelected={(newFiles) => {
          const updatedFiles = allowMultiple
            ? [...files, ...newFiles]
            : [newFiles[0]];
          onFilesChange(updatedFiles);
          uploadSelectedFiles(newFiles);
        }}
      />
    </>
  );
}
