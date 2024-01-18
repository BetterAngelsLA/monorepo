import { ImagesIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import * as ImagePicker from 'expo-image-picker';
import IconButton from '../IconButton';
type TImages = {
  [key: string]: string;
}[];

interface IImagePickerProps {
  setImages: React.Dispatch<React.SetStateAction<TImages>>;
  images: TImages;
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

    console.log(result);

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
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
