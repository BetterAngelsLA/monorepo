import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { MediaPicker, TextBold } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../../apollo';
import { useSnackbar } from '../../../../../hooks';
import { UploadSection } from '../UploadSection';
import UploadsPreview from '../UploadsPreview';
import { IClientDocUploadsProps } from '../types';
import { DOCUMENT_CONFIG } from './constants';
import { useClientDocumentUpload } from './useClientDocumentUpload';

export function ClientDocUploads(props: IClientDocUploadsProps) {
  console.log('################################### ClientDocUploads');

  const { setTab, client, setDocs, docs, title, docType } = props;

  const { uploadDocuments } = useClientDocumentUpload();
  const { showSnackbar } = useSnackbar();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { multiple: allowMultiple } = DOCUMENT_CONFIG[docType];

  const namespace = ClientDocumentNamespaceEnum[docType];

  const handleUpload = async () => {
    if (!client?.clientProfile.id) {
      return;
    }

    try {
      setProcessing(true);

      await uploadDocuments({
        clientProfileId: client.clientProfile.id,
        documents: docs[docType],
        namespace,
      });

      setTab(undefined);
    } catch (err) {
      showSnackbar({
        message: `Sorry, there was an error with the file upload.`,
        type: 'error',
        durationMs: 99999999999,
      });
    } finally {
      setProcessing(false);
    }
  };

  const onRemoveFile = (index: number) => {
    setDocs((prev) => ({
      ...prev,
      [docType]: prev[docType].filter((_, i) => i !== index),
    }));
  };

  const onFilenameChange = (index: number, value: string) => {
    setDocs((prev) => ({
      ...prev,
      [docType]: prev[docType].map((file, i) =>
        i === index ? { ...file, name: value } : file
      ),
    }));
  };

  const docsToUpload = docs[docType];

  const allDocsValid = docsToUpload.every((file) => {
    return !!file.name && !!file.type && !!file.uri;
  });

  return (
    <>
      <UploadSection
        loading={processing}
        disabled={!docsToUpload.length || !allDocsValid}
        title={title}
        onSubmit={handleUpload}
        onCancel={() => {
          setDocs({
            ...docs,
            [docType]: [],
          });
          setTab(undefined);
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

        {docsToUpload.length > 0 && (
          <UploadsPreview
            files={docsToUpload}
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
          setDocs((prev) => {
            const next = allowMultiple ? [...prev[docType], file] : [file];

            return {
              ...prev,
              [docType]: next,
            };
          });
        }}
        onFilesSelected={(files) => {
          setDocs((prev) => {
            const existing = prev[docType];

            const next = allowMultiple ? [...existing, ...files] : [files[0]]; // enforce single

            return {
              ...prev,
              [docType]: next,
            };
          });
        }}
      />
    </>
  );
}
