import { ImagesIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import * as ImagePicker from 'expo-image-picker';
import IconButton from '../IconButton';

interface IImagePickerProps {
  setImages: (images: Array<string>) => void;
  images: Array<string>;
  mr?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function ImagePickerComponent(props: IImagePickerProps) {
  const { setImages, images, mr } = props;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedPhotos = result.assets.map((asset) => asset.uri);
      setImages([...images, ...selectedPhotos]);
    }
  };

  return (
    <IconButton
      mr={mr}
      onPress={pickImage}
      accessibilityLabel="library"
      accessibilityHint="opens images library"
      variant="transparent"
    >
      <ImagesIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
    </IconButton>
  );
}
