import { FilePdfIcon, NoteIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FileThumbnailSizeDefault,
  ImageThumbnailSizeDefault,
  TThumbnailSize,
  thumbnailSizes,
} from '@monorepo/expo/shared/static';
import { Image, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../apollo';
import { ThumbnailDeleteButton } from './ThumbnailDeleteButton';

export type TThumbFileType = 'image' | 'pdf' | 'other';

const thumbSizeMap: Partial<
  Record<ClientDocumentNamespaceEnum, TThumbnailSize>
> = {
  [ClientDocumentNamespaceEnum.PhotoId]: thumbnailSizes.PhotoId,
  [ClientDocumentNamespaceEnum.DriversLicenseFront]: thumbnailSizes.PhotoId,
  [ClientDocumentNamespaceEnum.DriversLicenseBack]: thumbnailSizes.PhotoId,
  [ClientDocumentNamespaceEnum.SocialSecurityCard]: thumbnailSizes.PhotoId,
};

interface IProps {
  uri: string;
  fileType: TThumbFileType;
  thumbnailSize?: TThumbnailSize;
  documentType?: ClientDocumentNamespaceEnum;
  onDelete?: () => void;
}

export function FileThumbnail(props: IProps) {
  const { documentType, fileType, onDelete, uri, thumbnailSize } = props;

  const isImage = fileType === 'image';
  const isPdf = fileType === 'pdf';
  const isOtherType = fileType === 'other';

  let thumbSize =
    thumbnailSize || thumbSizeMap[documentType as ClientDocumentNamespaceEnum];

  if (!thumbSize) {
    thumbSize = isImage ? ImageThumbnailSizeDefault : FileThumbnailSizeDefault;
  }

  const fileOrImageText = isImage ? 'image' : 'file';

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: Colors.NEUTRAL_LIGHT,
        borderRadius: 8,
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

      {isPdf && <FilePdfIcon size="lg" color={Colors.NEUTRAL_DARK} />}

      {isOtherType && <NoteIcon size="lg" color={Colors.NEUTRAL_DARK} />}
    </View>
  );
}
