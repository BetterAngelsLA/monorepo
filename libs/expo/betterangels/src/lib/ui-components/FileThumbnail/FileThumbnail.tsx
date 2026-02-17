import { FilePdfIcon, NoteIcon, TIconSize } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FileThumbnailSizeDefault,
  ImageThumbnailSizeDefault,
  MimeTypes,
  Radiuses,
  TRadius,
  TThumbnailSize,
} from '@monorepo/expo/shared/static';
import { Image } from 'expo-image';
import { TouchableOpacity, View } from 'react-native';
import { ThumbnailDeleteButton } from './ThumbnailDeleteButton';

function getIconSize(thumbSize: TThumbnailSize): TIconSize {
  if (typeof thumbSize.width === 'number' && thumbSize.width >= 70) {
    return 'lg';
  }

  return 'sm';
}

interface IProps {
  uri: string;
  headers?: Record<string, string>;
  mimeType: string;
  thumbnailSize?: TThumbnailSize;
  iconSize?: TIconSize;
  borderRadius?: TRadius;
  accessibilityHint?: string;
  onDelete?: () => void;
  onPress?: () => void;
  disabled?: boolean;
}

export function FileThumbnail(props: IProps) {
  const { accessibilityHint, onPress, disabled, ...rest } = props;

  if (onPress) {
    return (
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
      >
        <FileThumbnailBase {...rest} />
      </TouchableOpacity>
    );
  }

  return <FileThumbnailBase disabled={disabled} {...rest} />;
}

function FileThumbnailBase(props: IProps) {
  const {
    disabled,
    mimeType,
    onDelete,
    uri,
    headers,
    thumbnailSize,
    iconSize,
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

  const effectiveIconSize: TIconSize = iconSize || getIconSize(thumbSize);

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
          disabled={disabled}
          accessibilityHint={`deletes the ${fileOrImageText}`}
        />
      )}

      {isImage && (
        <Image
          style={{
            height: '100%',
            width: '100%',
          }}
          source={{ uri, headers }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      )}

      {isPdf && (
        <FilePdfIcon size={effectiveIconSize} color={Colors.NEUTRAL_DARK} />
      )}

      {isOtherType && (
        <NoteIcon size={effectiveIconSize} color={Colors.NEUTRAL_DARK} />
      )}
    </View>
  );
}
