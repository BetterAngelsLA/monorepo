import { TThumbnailSize, thumbnailSizes } from '@monorepo/expo/shared/static';
import { ClientDocumentNamespaceEnum } from '../../apollo';

export const fileDisplaySizeMap: Partial<
  Record<ClientDocumentNamespaceEnum, TThumbnailSize>
> = {
  [ClientDocumentNamespaceEnum.PhotoId]: thumbnailSizes.PhotoId,
  [ClientDocumentNamespaceEnum.DriversLicenseFront]: thumbnailSizes.PhotoId,
  [ClientDocumentNamespaceEnum.DriversLicenseBack]: thumbnailSizes.PhotoId,
  [ClientDocumentNamespaceEnum.SocialSecurityCard]: thumbnailSizes.PhotoId,
};
