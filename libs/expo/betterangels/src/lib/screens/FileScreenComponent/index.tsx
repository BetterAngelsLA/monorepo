import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BaseModal,
  ImageViewer,
  Loading,
  PdfViewer,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useNavigation } from 'expo-router';
import { ReactNode, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AttachmentType } from '../../apollo';
import { MimeTypes } from '../../static';
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

  const navigation = useNavigation();
  const [fileView, setFileView] = useState<TFileView | null>(null);
  const { data } = useClientDocumentQuery({ variables: { id } });

  useLayoutEffect(() => {
    if (!data) return;
    navigation.setOptions({
      title: enumDisplayDocumentType[data.clientDocument.namespace],
    });
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

  const pdfUrl =
    'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf';

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
            // <WebBrowserLink href={pdfUrl} accessibilityHint="view pdf file">
            //   <FileThumbnail
            //     uri={file.url}
            //     mimeType={mimeType}
            //     thumbnailSize={fileDisplaySizeMap[namespace]}
            //     accessibilityHint="view pdf file"
            //     // onPress={() =>
            //     //   setFileView({
            //     //     // content: <PdfViewer url={file.url} />,
            //     //     content: <PdfViewer url={pdfUrl} />,
            //     //     title: originalFilename || '',
            //     //   })
            //     // }
            //   />
            // </WebBrowserLink>
            <FileThumbnail
              uri={file.url}
              mimeType={mimeType}
              thumbnailSize={fileDisplaySizeMap[namespace]}
              accessibilityHint="view pdf file"
              onPress={() =>
                setFileView({
                  // content: <PdfViewer url={file.url} />,
                  content: <PdfViewer url={pdfUrl} />,
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
          <TextRegular size="sm" style={{ width: '100%' }}>
            {originalFilename}
          </TextRegular>
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
