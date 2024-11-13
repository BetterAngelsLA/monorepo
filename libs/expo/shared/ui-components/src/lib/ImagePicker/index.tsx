import { gql, useMutation } from '@apollo/client';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { ImagesIcon } from '@monorepo/expo/shared/icons';
import { resizeImage } from '@monorepo/expo/shared/utils';
import * as ImagePicker from 'expo-image-picker';
import { Dispatch, SetStateAction } from 'react';
import IconButton from '../IconButton';

interface IImage {
  id: string | undefined;
  uri: string;
  loading?: boolean;
  abortController?: AbortController;
}

interface IImagePickerProps {
  setImages: Dispatch<SetStateAction<IImage[] | undefined>>;
  namespace: 'REQUESTED_SERVICES' | 'PROVIDED_SERVICES' | 'MOOD_ASSESSMENT';
  mr?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  noteId: string | undefined;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function ImagePickerComponent(props: IImagePickerProps) {
  const { setImages, mr, namespace, noteId, setIsLoading, isLoading } = props;
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
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => ({
          id: undefined,
          uri: asset.uri,
          loading: true,
          abortController: new AbortController(),
        }));

        setImages((prevImages) => {
          if (prevImages) {
            return [...prevImages, ...newImages];
          }
          return newImages;
        });

        const uploadPromises = newImages.map(async (image) => {
          const asset = result.assets.find((a) => a.uri === image.uri);
          if (!asset) return;
          const resizedPhoto = await resizeImage({ uri: asset.uri });
          const file = new ReactNativeFile({
            uri: resizedPhoto.uri,
            name: asset?.fileName || Date.now().toString(),
            type: asset?.mimeType || 'image/jpeg',
          });

          try {
            const { data } = await createNoteAttachment({
              variables: {
                namespace,
                file,
                noteId,
              },
              context: {
                fetchOptions: {
                  signal: image.abortController.signal,
                },
              },
            });

            if (!data) throw new Error(`Error uploading image: ${error}`);

            setImages((prevImages) =>
              prevImages?.map((img) =>
                img.uri === asset?.uri
                  ? { ...img, id: data.createNoteAttachment.id, loading: false }
                  : img
              )
            );
          } catch (err) {
            console.error(err);

            setImages((prevImages) =>
              prevImages?.map((img) =>
                img.uri === asset?.uri ? { ...img, loading: false } : img
              )
            );
          }
        });

        await Promise.all(uploadPromises);
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error(err);
    }
  };

  return (
    <IconButton
      disabled={isLoading}
      mr={mr}
      onPress={pickImage}
      accessibilityLabel="library"
      accessibilityHint="opens images library"
      variant="transparent"
    >
      <ImagesIcon
        // color={isLoading ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK}
        size="md"
      />
    </IconButton>
  );
}
