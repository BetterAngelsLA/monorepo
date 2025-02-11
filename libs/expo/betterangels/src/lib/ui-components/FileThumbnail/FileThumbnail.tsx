import { FilePdfIcon, NoteIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FileThumbnailSizeDefault,
  ImageThumbnailSizeDefault,
  TThumbnailSize,
  thumbnailSizes,
} from '@monorepo/expo/shared/static';
import { Image, View } from 'react-native';
import { AttachmentType, ClientDocumentNamespaceEnum } from '../../apollo';
import {
  TFileType,
  getFileTypeFromExtension,
} from '../../helpers/files/getFileTypeFromExtension';
import { ThumbnailDeleteButton } from './ThumbnailDeleteButton';

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
  attachmentType?: AttachmentType;
  thumbnailSize?: TThumbnailSize;
  documentType?: ClientDocumentNamespaceEnum;
  onDelete?: () => void;
}

export function FileThumbnail(props: IProps) {
  const { attachmentType, documentType, onDelete, uri, thumbnailSize } = props;

  const fileType = getFileType(uri, attachmentType);

  const isImage = fileType === 'image';
  const isPdf = fileType === 'pdf';
  const isDefaultFileType = !isImage && !isPdf;

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

      {isDefaultFileType && <NoteIcon size="lg" color={Colors.NEUTRAL_DARK} />}
    </View>
  );
}

// TODO: use mimeType if/when DEV-1493 is implemented
function getFileType(uri: string, attachmentType?: AttachmentType): TFileType {
  if (attachmentType === AttachmentType.Image) {
    return 'image';
  }

  return getFileTypeFromExtension(uri);
}
