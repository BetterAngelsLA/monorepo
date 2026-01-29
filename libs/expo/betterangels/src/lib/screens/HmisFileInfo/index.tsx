import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { getHmisFilePreview } from './hmisFilePreviewCache';

export type HmisFileInfoProps = {
  id: string;
  label?: string;
  createdAt?: string;
};

export default function HmisFileInfoScreen(props: HmisFileInfoProps) {
  const { id, label, createdAt } = props;
  const navigation = useNavigation();
  const preview = getHmisFilePreview(id);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: label ? 'Document' : 'Document',
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
        {!!preview?.uri && (
          <View style={styles.previewContainer}>
            <Image
              style={styles.previewImage}
              source={{ uri: preview.uri }}
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
