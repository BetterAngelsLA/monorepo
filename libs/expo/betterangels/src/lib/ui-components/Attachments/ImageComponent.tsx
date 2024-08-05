import { useMutation } from '@apollo/client';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { Image, View } from 'react-native';
import { DELETE_NOTE_ATTACHMENT } from '../../apollo';
import {
  DeleteNoteAttachmentMutation,
  DeleteNoteAttachmentMutationVariables,
} from '../../apollo/graphql/__generated__/mutations.generated';

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
            borderRadius: Radiuses.xxxl,
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
            <PlusIcon size="sm" rotate="45deg" />
          </IconButton>
        </View>
      )}
    </View>
  );
}
