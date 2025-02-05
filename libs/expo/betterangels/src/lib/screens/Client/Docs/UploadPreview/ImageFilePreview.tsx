import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Image, View } from 'react-native';
import DeleteButton from './DeleteButton';

export interface IImageFilePreview {
  file: ReactNativeFile;
  onDelete: () => void;
}

export default function ImageFilePreview(props: IImageFilePreview) {
  const { file, onDelete } = props;

  return (
    <View
      style={{
        position: 'relative',
        width: 236,
        height: 395,
        marginBottom: Spacings.sm,
        borderWidth: 1,
        borderColor: Colors.NEUTRAL_LIGHT,
        borderRadius: 8,
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
