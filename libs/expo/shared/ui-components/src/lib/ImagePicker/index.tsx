import { gql, useMutation } from '@apollo/client';
import { ImagesIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import * as ImagePicker from 'expo-image-picker';
import IconButton from '../IconButton';

const fetchResourceFromURI = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

interface IImagePickerProps {
  images: { id: string | undefined; uri: string }[];
  setImages: (e: { id: string | undefined; uri: string }[]) => void;
  namespace: 'REQUESTED_SERVICES' | 'PROVIDED_SERVICES' | 'MOOD_ASSESSMENT';
  mr?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  noteId: string | undefined;
}

export default function ImagePickerComponent(props: IImagePickerProps) {
  const { setImages, images, mr, namespace, noteId } = props;
  const [createNoteAttachment] = useMutation(gql`
    mutation CreateNoteAttachment($data: CreateNoteAttachmentInput!) {
      createNoteAttachment(data: $data) {
        ... on OperationInfo {
          messages {
            kind
            field
            message
          }
        }
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
          const file = await fetchResourceFromURI(asset.uri);
          const response = await createNoteAttachment({
            variables: {
              data: {
                namespace,
                file,
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
