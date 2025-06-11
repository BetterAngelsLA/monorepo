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
import { router, useNavigation } from 'expo-router';
import { ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AttachmentType } from '../../apollo';
import useSnackbar from '../../hooks/snackbar/useSnackbar';
import { enumDisplayDocumentType } from '../../static/enumDisplayMapping';
import { FileThumbnail, MainContainer } from '../../ui-components';
import {
  ClientProfileDocument,
  useUpdateClientDocumentMutation,
} from '../Client/__generated__/Client.generated';
import { useClientDocumentQuery } from './__generated__/Document.generated';
import { fileDisplaySizeMap } from './fileDisplaySizeMap';

type TFileView = {
  content: ReactNode;
  title?: string;
};

type TFileScreenComponent = {
  id: string;
  clientId: string;
  editing: string;
};

export default function FileScreenComponent(props: TFileScreenComponent) {
  const { id, clientId, editing } = props;

  const navigation = useNavigation();
  const { showSnackbar } = useSnackbar();
  const [fileView, setFileView] = useState<TFileView | null>(null);
  const { data } = useClientDocumentQuery({ variables: { id } });
  const [filename, setFilename] = useState('');
  const [updateClientDocument, { loading }] = useUpdateClientDocumentMutation({
    refetchQueries: [
      {
        query: ClientProfileDocument,
        variables: {
          id: clientId,
        },
      },
    ],
  });

  async function handleUpdateClientDocument() {
    try {
      await updateClientDocument({
        variables: {
          data: {
            id: id,
            originalFilename: filename,
          },
        },
      });

      router.back();
    } catch (err) {
      console.error(`error updating file: `, err);

      showSnackbar({
        message: `Sorry, there was an error with the file update.`,
        type: 'error',
      });
    }
  }

  useLayoutEffect(() => {
    if (!data) return;
    navigation.setOptions({
      title: enumDisplayDocumentType[data.clientDocument.namespace],
    });
  }, [data, navigation]);

  useEffect(() => {
    if (!data?.clientDocument.originalFilename) {
      return;
    }
    setFilename(data?.clientDocument.originalFilename);
  }, [data]);

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

          {editing === 'true' ? (
            <BasicInput
              label="File Name"
              placeholder={'Enter a file name'}
              value={filename}
              required
              mt="sm"
              errorMessage={
                !filename.trim() ? 'file name is required' : undefined
              }
              onDelete={() => setFilename('')}
              onChangeText={(val) => setFilename(val)}
            />
          ) : (
            <>
              <TextBold mt="sm" size="sm">
                File Name
              </TextBold>
              <TextRegular size="sm" style={{ width: '100%' }}>
                {originalFilename}
              </TextRegular>
            </>
          )}
        </View>
        <TextRegular textAlign="right" size="sm">
          Uploaded on {format(new Date(createdAt), 'MM/dd/yyyy')}
        </TextRegular>
      </MainContainer>
      {editing === 'true' && (
        <BottomActions
          isLoading={loading}
          disabled={false}
          cancel={
            <TextButton
              title="Cancel"
              onPress={router.back}
              accessibilityHint="Cancel upload"
            />
          }
          onSubmit={handleUpdateClientDocument}
        />
      )}

      {!!fileView?.content && (
        <BaseModal
          title={fileView.title}
          isOpen={true}
          onClose={() => setFileView(null)}
        >
          {fileView.content}
        </BaseModal>
      )}
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
