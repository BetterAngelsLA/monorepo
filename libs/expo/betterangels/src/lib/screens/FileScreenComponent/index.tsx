import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  ImagesWithZoom,
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AttachmentType } from '../../apollo';
import { MimeTypes } from '../../static';
import { enumDisplayDocumentType } from '../../static/enumDisplayMapping';
import { FileThumbnail, MainContainer } from '../../ui-components';
import { PdfModal } from './PdfModal';
import { useClientDocumentQuery } from './__generated__/Document.generated';
import { fileDisplaySizeMap } from './fileDisplaySizeMap';

export default function FileScreenComponent({ id }: { id: string }) {
  const { data } = useClientDocumentQuery({ variables: { id } });
  const [pdfIsOpen, setPdfIsOpen] = useState<boolean>(false);
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

  return (
    <>
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
            <FileThumbnail
              uri={file.url}
              mimeType={mimeType}
              thumbnailSize={fileDisplaySizeMap[namespace]}
              onPress={() => setPdfIsOpen(true)}
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
          <TextRegular size="sm">{originalFilename}</TextRegular>
        </View>
        <TextRegular textAlign="right" size="sm">
          Uploaded on {format(new Date(createdAt), 'MM/dd/yyyy')}
        </TextRegular>
      </MainContainer>

      <PdfModal url={file.url} isOpen={pdfIsOpen} setIsOpen={setPdfIsOpen} />
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
