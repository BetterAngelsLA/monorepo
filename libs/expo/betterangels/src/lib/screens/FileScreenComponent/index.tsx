import {
  Colors,
  MimeTypes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  BaseModal,
  BasicInput,
  BottomActions,
  ImageViewer,
  Loading,
  PdfViewer,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useNavigation, useRouter } from 'expo-router';
import { ReactNode, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AttachmentType } from '../../apollo';
import { enumDisplayDocumentType } from '../../static/enumDisplayMapping';
import { FileThumbnail, MainContainer } from '../../ui-components';
import { useClientDocumentQuery } from './__generated__/Document.generated';
import { fileDisplaySizeMap } from './fileDisplaySizeMap';

type TFileView = {
  content: ReactNode;
  title?: string;
};

type TFileScreenComponent = {
  id: string;
};

export default function FileScreenComponent(props: TFileScreenComponent) {
  const { id } = props;
  const router = useRouter();

  const navigation = useNavigation();
  const [fileView, setFileView] = useState<TFileView | null>(null);
  const [filename, setFileName] = useState('');
  const { data } = useClientDocumentQuery({ variables: { id } });

  useLayoutEffect(() => {
    if (!data) return;
    navigation.setOptions({
      title: enumDisplayDocumentType[data.clientDocument.namespace],
    });
    // Initialize filename state with originalfilename
    setFileName(data.clientDocument.originalFilename || '');
  }, [data, navigation]);

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Loading size="large" />
      </View>
    );
  }

  const { clientDocument } = data || {};
  const {
    attachmentType,
    createdAt,
    namespace,
    mimeType,
    file,
    originalFilename,
  } = clientDocument;

  const isImage = attachmentType === AttachmentType.Image;
  const isPdf = mimeType === MimeTypes.PDF;

  function onFilenameChange(value: string): void {
    setFileName(value);
  }

  async function handleSubmit() {
    try {
      await updateClientDocument({
        variables: {
          data: {
            id,
            originalFilename: filename,
          }
        }
      });
      router.back();
    } catch (error) {
      console.error('Error updating filename: ', error);
    }
  }

  return (
    <>
      <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <TextBold mb="xs" size="lg">
          {enumDisplayDocumentType[namespace]}
        </TextBold>
        <View style={styles.fileContainer}>
          {isImage && (
            <FileThumbnail
              uri={file.url}
              mimeType={mimeType}
              thumbnailSize={fileDisplaySizeMap[namespace]}
              accessibilityHint="view full image"
              onPress={() =>
                setFileView({
                  content: <ImageViewer url={file.url} />,
                  title: originalFilename || '',
                })
              }
            />
          )}

          {isPdf && (
            <FileThumbnail
              uri={file.url}
              mimeType={mimeType}
              thumbnailSize={fileDisplaySizeMap[namespace]}
              accessibilityHint="view pdf file"
              onPress={() =>
                setFileView({
                  content: <PdfViewer url={file.url} cache={true} />,
                  title: originalFilename || '',
                })
              }
            />
          )}

          {!isImage && !isPdf && (
            <FileThumbnail
              uri={file.url}
              mimeType={mimeType}
              thumbnailSize={fileDisplaySizeMap[namespace]}
            />
          )}

          <TextBold mt="sm" size="sm">
            File Name
          </TextBold>
          <BasicInput
            label="File Name"
            placeholder={'Enter a file name'}
            value={filename}
            required
            mt="sm"
            errorMessage={
              !file.name.trim() ? 'file name is required' : undefined
            }
            onDelete={() => onFilenameChange('')}
            onChangeText={(val) => onFilenameChange(val)}
          />
        </View>
        <TextRegular textAlign="right" size="sm">
          Uploaded on {format(new Date(createdAt), 'MM/dd/yyyy')}
        </TextRegular>
      </MainContainer>

      {!!fileView?.content && (
        <BaseModal
          title={fileView.title}
          isOpen={true}
          onClose={() => setFileView(null)}
        >
          {fileView.content}
        </BaseModal>
      )}
      <BottomActions
        cancel={
          <TextButton
            onPress={router.back}
            fontSize="sm"
            accessibilityHint={`cancels the change of the file name`}
            title="Cancel"
          />
        }
        onSubmit={handleSubmit()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fileContainer: {
    backgroundColor: Colors.WHITE,
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    marginBottom: Spacings.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
