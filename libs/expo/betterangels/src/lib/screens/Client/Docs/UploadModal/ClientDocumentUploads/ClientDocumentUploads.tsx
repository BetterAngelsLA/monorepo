import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { MediaPicker, TextBold } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import { useSnackbar } from '../../../../../hooks';
import { UploadSection } from '../UploadSection';
import UploadsPreview from '../UploadsPreview';
import { useClientDocumentUpload } from './useClientDocumentUpload';

export interface IClientDocUploadsProps {
  clientProfileId: string | undefined;
  files: ReactNativeFile[];
  onFilesChange: (files: ReactNativeFile[]) => void;
  onClose: () => void;
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
    namespace,
    title,
    allowMultiple = false,
  } = props;

  const { uploadDocuments } = useClientDocumentUpload();
  const { showSnackbar } = useSnackbar();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

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

      onClose();
    } catch (err) {
      console.error(`[ClientDocumentUploads error:] ${err}`);

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
            onPress={() => {
              setIsModalVisible(true);
            }}
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
        onClose={() => setIsModalVisible(false)}
        onCameraCapture={(file) => {
          onFilesChange(allowMultiple ? [...files, file] : [file]);
        }}
        onFilesSelected={(newFiles) => {
          onFilesChange(
            allowMultiple ? [...files, ...newFiles] : [newFiles[0]]
          );
        }}
      />
    </>
  );
}
