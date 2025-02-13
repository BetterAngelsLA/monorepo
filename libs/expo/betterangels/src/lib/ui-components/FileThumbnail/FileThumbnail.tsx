import { FilePdfIcon, NoteIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FileThumbnailSizeDefault,
  ImageThumbnailSizeDefault,
  Radiuses,
  TRadius,
  TThumbnailSize,
} from '@monorepo/expo/shared/static';
import { Image, TouchableOpacity, View } from 'react-native';
import { MimeTypes } from '../../static';
import { ThumbnailDeleteButton } from './ThumbnailDeleteButton';

interface IProps {
  uri: string;
  mimeType: string;
  thumbnailSize?: TThumbnailSize;
  borderRadius?: TRadius;
  accessibilityHint?: string;
  onDelete?: () => void;
  onPress?: () => void;
}

export function FileThumbnail(props: IProps) {
  const { accessibilityHint, onPress, ...rest } = props;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
      >
        <FileThumbnailBase {...rest} />
      </TouchableOpacity>
    );
  }

  return <FileThumbnailBase {...rest} />;
}

function FileThumbnailBase(props: IProps) {
  const {
    mimeType,
    onDelete,
    uri,
    thumbnailSize,
    borderRadius = Radiuses.xs,
  } = props;

  const isImage = mimeType.startsWith('image');
  const isPdf = mimeType === MimeTypes.PDF;
  const isOtherType = !isImage && !isPdf;

  let thumbSize = thumbnailSize;

  if (!thumbSize) {
    thumbSize = isImage ? ImageThumbnailSizeDefault : FileThumbnailSizeDefault;
  }

  const fileOrImageText = isImage ? 'image' : 'file';

  const iconSize = thumbSize.width >= 70 ? 'lg' : 'sm';

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: Colors.NEUTRAL_LIGHT,
        borderRadius: borderRadius,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        ...thumbSize,
      }}
    >
      {!!onDelete && (
        <ThumbnailDeleteButton
          onDelete={onDelete}
          accessibilityHint={`deletes the ${fileOrImageText}`}
        />
      )}

      {isImage && (
        <Image
          style={{
            height: '100%',
            width: '100%',
          }}
          source={{ uri }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}

      {isPdf && <FilePdfIcon size={iconSize} color={Colors.NEUTRAL_DARK} />}

      {isOtherType && <NoteIcon size={iconSize} color={Colors.NEUTRAL_DARK} />}
    </View>
  );
}
