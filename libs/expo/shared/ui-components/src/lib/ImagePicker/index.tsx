import { gql, useMutation } from '@apollo/client';
import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { ImagesIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { resizeImage } from '@monorepo/expo/shared/utils';
import * as ImagePicker from 'expo-image-picker';
import IconButton from '../IconButton';

interface IImagePickerProps {
  images: { id: string | undefined; uri: string }[];
  setImages: (e: { id: string | undefined; uri: string }[]) => void;
  namespace: 'REQUESTED_SERVICES' | 'PROVIDED_SERVICES' | 'MOOD_ASSESSMENT';
  mr?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  noteId: string | undefined;
  setIsLoading: (e: boolean) => void;
}

export default function ImagePickerComponent(props: IImagePickerProps) {
  const { setImages, images, mr, namespace, noteId, setIsLoading } = props;
  const [createNoteAttachment, { error }] = useMutation(gql`
    mutation CreateNoteAttachment(
      $noteId: ID!
      $namespace: NoteNamespaceEnum!
      $file: Upload!
    ) {
      createNoteAttachment(
        data: { note: $noteId, namespace: $namespace, file: $file }
      ) {
        ... on OperationInfo {
          messages {
            kind
            field
            message
          }
        }
        ... on NoteAttachmentType {
          id
          attachmentType
          file {
            name
          }
          originalFilename
          namespace
        }
      }
    }
  `);

  const pickImage = async () => {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets) {
        const uploadPromises = result.assets.map(async (asset) => {
          const resizedPhoto = await resizeImage(asset.uri);
          const file = new ReactNativeFile({
            uri: resizedPhoto.uri,
            name: asset?.fileName || Date.now().toString(),
            type: asset.mimeType || 'changeme',
          });
          const { data } = await createNoteAttachment({
            variables: {
              namespace,
              file,
              noteId,
            },
          });
          if (!data) throw new Error(`Error uploading image: ${error}`);

          return {
            id: data.createNoteAttachment.id,
            uri: asset.uri,
          };
        });

        const uploadedImages = await Promise.all(uploadPromises);

        setImages([...images, ...uploadedImages]);
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
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
