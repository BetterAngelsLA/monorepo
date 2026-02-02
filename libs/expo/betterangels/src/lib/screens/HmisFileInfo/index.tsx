import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import mime from 'mime';
import { useLayoutEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClientFiles } from '../../hooks/hmisFileMetadata';

export type HmisFileInfoProps = {
  id: string;
  label?: string;
  createdAt?: string;
  clientId?: string;
  hmisId?: string;
};

const toDataUri = (raw: string | undefined, mimeType: string) => {
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;
  return `data:${mimeType};base64,${raw.trim().replace(/\s/g, '')}`;
};

export default function HmisFileInfoScreen(props: HmisFileInfoProps) {
  const { id, label, createdAt, clientId, hmisId } = props;
  const navigation = useNavigation();

  // Retrieve file from query cache or fetch if missing (handles page reload/deep link)
  const { data: files } = useClientFiles(clientId, hmisId);

  const file = useMemo(() => {
    return files?.find((f) => String(f.id) === id);
  }, [files, id]);

  const previewUri = useMemo(() => {
    if (!file) return null;

    const rawPreview =
      file.file?.encodedPreviewFileContent ??
      file.file?.encodedThumbnailFileContent;

    const filename = file.file?.filename ?? label ?? 'file.bin';
    const detectedMime = mime.getType(filename) ?? 'application/octet-stream';
    const imgMime = detectedMime.startsWith('image')
      ? detectedMime
      : 'image/jpeg';

    return toDataUri(rawPreview, imgMime);
  }, [file, label]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: label || 'Document',
    });
  }, [label, navigation]);

  return (
    <View
      style={{
        flex: 1,
        padding: Spacings.md,
        backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
      }}
    >
      <View style={styles.fileContainer}>
        <TextBold size="lg">{label || `Document ${id}`}</TextBold>
        {!!previewUri && (
          <View style={styles.previewContainer}>
            <Image
              style={styles.previewImage}
              source={{ uri: previewUri }}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
        )}
      </View>
      {!!createdAt && (
        <TextRegular textAlign="right" size="sm">
          Uploaded on {format(new Date(createdAt), 'MM/dd/yyyy')}
        </TextRegular>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  fileContainer: {
    backgroundColor: Colors.WHITE,
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    marginBottom: Spacings.xs,
  },
  previewContainer: {
    marginTop: Spacings.sm,
    borderRadius: Radiuses.xs,
    overflow: 'hidden',
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  previewImage: {
    width: '100%',
    minHeight: 200,
    aspectRatio: 1,
  },
});
