import { useMutation } from '@apollo/client';
import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { Image, View } from 'react-native';
import {
  DELETE_NOTE_ATTACHMENT,
  DeleteNoteAttachmentMutation,
  DeleteNoteAttachmentMutationVariables,
} from '../../apollo';

interface IImageComponentProps {
  width: number;
  image: { id: string | undefined; uri: string };
  setImages: (images: { id: string | undefined; uri: string }[]) => void;
  images: { id: string | undefined; uri: string }[];
  isLoading: boolean;
}

export default function ImageComponent(props: IImageComponentProps) {
  const { width, image, setImages, images, isLoading } = props;
  const [deleteNoteAttachment, { error }] = useMutation<
    DeleteNoteAttachmentMutation,
    DeleteNoteAttachmentMutationVariables
  >(DELETE_NOTE_ATTACHMENT);

  const onDelete = async () => {
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
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <View
      style={{
        height: (width / 3) * 1.3 - Spacings.xs * 2,
        width: width / 3 - Spacings.xs * 2,
        margin: Spacings.xs,
        overflow: 'hidden',
      }}
    >
      <Image
        style={{ height: '100%', width: '100%' }}
        source={{ uri: image.uri }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {!isLoading && (
        <View
          style={{
            backgroundColor: Colors.WHITE,
            borderRadius: 100,
            position: 'absolute',
            top: 5,
            right: 5,
          }}
        >
          <IconButton
            onPress={onDelete}
            variant="transparent"
            height="xs"
            width="xs"
            accessibilityLabel="delete"
            accessibilityHint="deletes the image"
          >
            <XmarkIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
          </IconButton>
        </View>
      )}
    </View>
  );
}
