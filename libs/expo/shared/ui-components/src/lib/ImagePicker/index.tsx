import { gql, useMutation } from '@apollo/client';
import { ImagesIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import * as ImagePicker from 'expo-image-picker';
import IconButton from '../IconButton';

interface IImagePickerProps {
  images: { id: string; uri: string }[];
  setImages: React.Dispatch<
    React.SetStateAction<{ id: string; uri: string }[]>
  >;
  namespace: 'REQUESTED_SERVICES' | 'PROVIDED_SERVICES' | 'MOOD_ASSESSMENT';
  mr?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  noteId: string | undefined;
}

export default function ImagePickerComponent(props: IImagePickerProps) {
  const { setImages, images, mr, namespace, noteId } = props;
  const [createNoteAttachment] = useMutation(gql`
    mutation CreateNoteAttachment($data: CreateNoteAttachmentInput!) {
      createNoteAttachment(data: $data) {
        ... on NoteAttachmentType {
          id
        }
      }
    }
  `);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        const uploadPromises = result.assets.map(async (asset) => {
          const response = await createNoteAttachment({
            variables: {
              data: {
                namespace,
                file: asset.uri,
                note: noteId,
              },
            },
          });

          return {
            id: response.data.createNoteAttachment.id,
            uri: asset.uri,
          };
        });

        const uploadedImages = await Promise.all(uploadPromises);

        setImages([...images, ...uploadedImages]);
      }
    } catch (e) {
      console.log(e);
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
