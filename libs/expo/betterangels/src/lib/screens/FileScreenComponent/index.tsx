import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  ImagesWithZoom,
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import PDF from 'react-native-pdf';
import { AttachmentType } from '../../apollo';
import { MimeTypes } from '../../static';
import { enumDisplayDocumentType } from '../../static/enumDisplayMapping';
import { FileThumbnail, MainContainer } from '../../ui-components';
import { useClientDocumentQuery } from './__generated__/Document.generated';
import { fileDisplaySizeMap } from './fileDisplaySizeMap';

export default function FileScreenComponent({ id }: { id: string }) {
  const { data } = useClientDocumentQuery({ variables: { id } });
  const navigation = useNavigation();

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

  // const pdfUrl =
  // 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf';

  return (
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TextBold mb="xs" size="lg">
        {enumDisplayDocumentType[namespace]}
      </TextBold>
      <View style={styles.fileContainer}>
        {isImage && (
          <ImagesWithZoom title={originalFilename} imageUrl={file.url}>
            <FileThumbnail
              uri={file.url}
              mimeType={mimeType}
              thumbnailSize={fileDisplaySizeMap[namespace]}
            />
          </ImagesWithZoom>
        )}

        {isPdf && (
          <SafeAreaView style={{ flex: 1 }}>
            <PDF
              source={{
                uri: file.url,
                cache: true,
              }}
              style={{ flex: 1 }}
            />
          </SafeAreaView>

          // <WebBrowserLink href={file.url} accessibilityHint="open pdf file">
          //   <FileThumbnail
          //     uri={file.url}
          //     mimeType={mimeType}
          //     thumbnailSize={fileDisplaySizeMap[namespace]}
          //   />
          // </WebBrowserLink>
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
        <TextRegular size="sm">{originalFilename}</TextRegular>
      </View>
      <TextRegular textAlign="right" size="sm">
        Uploaded on {format(new Date(createdAt), 'MM/dd/yyyy')}
      </TextRegular>
    </MainContainer>
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
