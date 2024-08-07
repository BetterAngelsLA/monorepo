import { useMutation } from '@apollo/client';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  CircularLoading,
  DeleteModal,
  IconButton,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction } from 'react';
import { Image, View } from 'react-native';
import { DELETE_NOTE_ATTACHMENT } from '../../apollo';
import {
  DeleteNoteAttachmentMutation,
  DeleteNoteAttachmentMutationVariables,
} from '../../apollo/graphql/__generated__/mutations.generated';

interface IImage {
  id: string | undefined;
  uri: string;
  loading?: boolean;
  abortController?: AbortController;
}

interface IImageComponentProps {
  width: number;
  image: IImage;
  setImages: Dispatch<SetStateAction<IImage[] | undefined>>;
  images: IImage[];
  isLoading: boolean;
}

export default function ImageComponent(props: IImageComponentProps) {
  const { width, image, setImages, images } = props;
  const [deleteNoteAttachment, { error }] = useMutation<
    DeleteNoteAttachmentMutation,
    DeleteNoteAttachmentMutationVariables
  >(DELETE_NOTE_ATTACHMENT);

  const onDelete = async () => {
    if (image.loading && image.abortController) {
      image.abortController.abort();
      setImages(images.filter((i) => i.uri !== image.uri));
      return;
    }
    if (!image.id) return;
    try {
      const { data } = await deleteNoteAttachment({
        variables: { attachmentId: image.id },
      });
      if (!data) {
        console.log('Error deleting attachment', error);
        return;
      }
      setImages(images.filter((i) => i.uri !== image.uri));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: Colors.NEUTRAL_LIGHT,
        height: width / 3 - Spacings.xs * 2,
        width: width / 3 - Spacings.xs * 2,
        margin: Spacings.xs,
        overflow: 'hidden',
        borderRadius: Radiuses.xs,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {image.loading && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <CircularLoading />
          <View
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: Radiuses.xxxl,
              position: 'absolute',
            }}
          >
            <IconButton
              onPress={onDelete}
              variant="transparent"
              height="sm"
              width="sm"
              accessibilityLabel="delete"
              accessibilityHint="deletes the image"
            >
              <PlusIcon size="sm" rotate="45deg" />
            </IconButton>
          </View>
        </View>
      )}
      <Image
        style={{ height: '100%', width: '100%' }}
        source={{ uri: image.uri }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {!image.loading && (
        <DeleteModal
          title="Are you sure you want to delete this item?"
          onDelete={onDelete}
          button={
            <IconButton
              borderRadius={Radiuses.xxxl}
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
              }}
              variant="secondary"
              height="xs"
              width="xs"
              accessibilityLabel="delete"
              accessibilityHint="deletes the image"
            >
              <PlusIcon size="sm" rotate="45deg" />
            </IconButton>
          }
        />
      )}
    </View>
  );
}
