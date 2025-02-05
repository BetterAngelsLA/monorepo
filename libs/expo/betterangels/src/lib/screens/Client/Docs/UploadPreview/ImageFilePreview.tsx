import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ImageThumbnailSizeDefault } from 'libs/expo/shared/static/src/lib/thumbnail';
import { Image, View } from 'react-native';
import { TThumbnailSize } from '../UploadModal/types';
import DeleteButton from './DeleteButton';

export interface IImageFilePreview {
  file: ReactNativeFile;
  thumbnailSize?: TThumbnailSize;
  onDelete: () => void;
}

export default function ImageFilePreview(props: IImageFilePreview) {
  const { file, thumbnailSize, onDelete } = props;

  const previewSize = thumbnailSize || ImageThumbnailSizeDefault;

  return (
    <View
      style={{
        position: 'relative',
        marginBottom: Spacings.sm,
        borderWidth: 1,
        borderColor: Colors.NEUTRAL_LIGHT,
        borderRadius: 8,
        ...previewSize,
      }}
    >
      <DeleteButton onDelete={onDelete} accessibilityHint="deletes the image" />

      <Image
        style={{
          height: '100%',
          width: '100%',
        }}
        source={{ uri: file.uri }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
